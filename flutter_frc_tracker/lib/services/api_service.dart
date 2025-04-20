import 'dart:convert';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_frc_tracker/models/event.dart';
import 'package:flutter_frc_tracker/models/team.dart';
import 'package:flutter_frc_tracker/models/team_achievement.dart';
import 'package:logger/logger.dart';

class ApiService {
  final Dio _dio = Dio();
  final FlutterSecureStorage secureStorage;
  final Logger _logger = Logger();
  String? apiKey;
  
  // Base URL for TBA API
  static const String _baseUrl = 'https://www.thebluealliance.com/api/v3';
  
  // Backend base URL for proxied requests (if available)
  static const String _backendUrl = ''; // This would be filled in if you have a backend proxy

  ApiService({
    this.apiKey,
    required this.secureStorage,
  }) {
    _initDio();
  }

  void _initDio() {
    _dio.options.baseUrl = _baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 10);
    _dio.options.receiveTimeout = const Duration(seconds: 10);
    
    // Add logging interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add API key if available
          if (apiKey != null) {
            options.headers['X-TBA-Auth-Key'] = apiKey;
          } else {
            // Try to get API key from secure storage
            final storedApiKey = await secureStorage.read(key: 'TBA_API_KEY');
            if (storedApiKey != null) {
              apiKey = storedApiKey;
              options.headers['X-TBA-Auth-Key'] = storedApiKey;
            }
          }
          
          _logger.d('API Request: ${options.method} ${options.path}');
          return handler.next(options);
        },
        onResponse: (response, handler) {
          _logger.d('API Response: ${response.statusCode} for ${response.requestOptions.path}');
          return handler.next(response);
        },
        onError: (DioException e, handler) {
          _logger.e('API Error: ${e.message} for ${e.requestOptions.path}', e, StackTrace.current);
          return handler.next(e);
        },
      ),
    );
  }

  // Check if API key is valid
  Future<bool> validateApiKey(String key) async {
    try {
      final response = await _dio.get('/status',
          options: Options(headers: {'X-TBA-Auth-Key': key}));
      
      if (response.statusCode == 200) {
        // Save the API key if valid
        await secureStorage.write(key: 'TBA_API_KEY', value: key);
        apiKey = key;
        return true;
      }
      return false;
    } catch (e) {
      _logger.e('Error validating API key', e, StackTrace.current);
      return false;
    }
  }

  // Fetch available years
  Future<List<int>> fetchYears() async {
    try {
      // Use backend proxy if available, otherwise direct TBA API
      final String url = _backendUrl.isNotEmpty ? '$_backendUrl/api/years' : '/events/years';
      final response = await _dio.get(url);
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((year) => year as int).toList()..sort((a, b) => b.compareTo(a)); // Sort in descending order
      }
      
      throw Exception('Failed to load years: ${response.statusCode}');
    } catch (e) {
      _logger.e('Error fetching years', e, StackTrace.current);
      rethrow;
    }
  }

  // Search events by year and query
  Future<List<Event>> searchEvents({
    required int year,
    String? query,
    String? eventType,
  }) async {
    try {
      // Use backend proxy if available, otherwise direct TBA API
      final String url = _backendUrl.isNotEmpty 
          ? '$_backendUrl/api/search/events' 
          : '/events/$year';
      
      Map<String, dynamic> queryParams = {};
      if (_backendUrl.isNotEmpty) {
        queryParams['year'] = year.toString();
        if (query != null && query.isNotEmpty) {
          queryParams['query'] = query;
        }
        if (eventType != null && eventType.isNotEmpty) {
          queryParams['eventType'] = eventType;
        }
      }
      
      final response = await _dio.get(url, queryParameters: queryParams);
      
      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        
        // If using direct TBA API and query is provided, filter results manually
        List<Event> events = data.map((eventJson) => Event.fromJson(eventJson)).toList();
        
        if (_backendUrl.isEmpty && query != null && query.isNotEmpty) {
          final lowerQuery = query.toLowerCase();
          events = events.where((event) {
            return event.name.toLowerCase().contains(lowerQuery) ||
                (event.city != null && event.city!.toLowerCase().contains(lowerQuery)) ||
                (event.stateProv != null && event.stateProv!.toLowerCase().contains(lowerQuery)) ||
                (event.country != null && event.country!.toLowerCase().contains(lowerQuery));
          }).toList();
        }
        
        if (_backendUrl.isEmpty && eventType != null && eventType.isNotEmpty) {
          final eventTypeInt = int.tryParse(eventType);
          if (eventTypeInt != null) {
            events = events.where((event) => event.eventType == eventTypeInt).toList();
          }
        }
        
        return events;
      }
      
      throw Exception('Failed to search events: ${response.statusCode}');
    } catch (e) {
      _logger.e('Error searching events', e, StackTrace.current);
      rethrow;
    }
  }

  // Get event details
  Future<Event> getEventDetails(String eventKey) async {
    try {
      // Use backend proxy if available, otherwise direct TBA API
      final String url = _backendUrl.isNotEmpty 
          ? '$_backendUrl/api/events/$eventKey' 
          : '/event/$eventKey';
      
      final response = await _dio.get(url);
      
      if (response.statusCode == 200) {
        return Event.fromJson(response.data);
      }
      
      throw Exception('Failed to get event details: ${response.statusCode}');
    } catch (e) {
      _logger.e('Error getting event details', e, StackTrace.current);
      rethrow;
    }
  }

  // Get teams for an event with their championship status
  Future<List<TeamWithStatus>> getEventTeams(String eventKey) async {
    try {
      // Use backend proxy if available, otherwise direct TBA API
      final String url = _backendUrl.isNotEmpty 
          ? '$_backendUrl/api/events/$eventKey/teams' 
          : '/event/$eventKey/teams/statuses';
      
      final Response teamsResponse = await _dio.get(_backendUrl.isEmpty 
          ? '/event/$eventKey/teams' 
          : url);
      
      if (teamsResponse.statusCode == 200) {
        if (_backendUrl.isNotEmpty) {
          // If using backend proxy, the response already includes status
          final List<dynamic> data = teamsResponse.data;
          return data.map((json) => TeamWithStatus.fromJson(json)).toList();
        } else {
          // If using direct TBA API, we need to fetch teams and their statuses separately
          final List<dynamic> teamsData = teamsResponse.data;
          List<Team> teams = teamsData.map((json) => Team.fromJson(json)).toList();
          
          // Fetch the statuses
          final Response statusResponse = await _dio.get('/event/$eventKey/teams/statuses');
          if (statusResponse.statusCode == 200) {
            final Map<String, dynamic> statuses = statusResponse.data;
            
            // Combine team data with statuses
            final List<TeamWithStatus> teamsWithStatus = teams.map((team) {
              final status = statuses[team.key];
              return TeamWithStatus(
                team: team,
                isQualified: status != null && status['alliance'] != null,
                rank: status != null && status['qual'] != null ? status['qual']['ranking']['rank'] : null,
                record: status != null && status['qual'] != null ? '${status['qual']['ranking']['record']['wins']}-${status['qual']['ranking']['record']['losses']}-${status['qual']['ranking']['record']['ties']}' : null,
                totalTeams: status != null && status['qual'] != null ? status['qual']['num_teams'] : null,
                overallStatusStr: status != null && status['overall_status_str'] != null ? status['overall_status_str'] : null,
                allianceStatusStr: status != null && status['alliance_status_str'] != null ? status['alliance_status_str'] : null,
              );
            }).toList();
            
            return teamsWithStatus;
          }
          
          throw Exception('Failed to get team statuses: ${statusResponse.statusCode}');
        }
      }
      
      throw Exception('Failed to get event teams: ${teamsResponse.statusCode}');
    } catch (e) {
      _logger.e('Error getting event teams', e, StackTrace.current);
      rethrow;
    }
  }

  // Get team achievements for a specific year
  Future<TeamAchievement> getTeamAchievements(int teamNumber, int year) async {
    try {
      // Use backend proxy if available, otherwise we'll need to construct this from multiple API calls
      final String url = _backendUrl.isNotEmpty 
          ? '$_backendUrl/api/team/$teamNumber/achievements/$year' 
          : null;
      
      if (url != null) {
        final response = await _dio.get(url);
        
        if (response.statusCode == 200) {
          return TeamAchievement.fromJson(response.data);
        }
        
        throw Exception('Failed to get team achievements: ${response.statusCode}');
      } else {
        // Implement the complex logic to fetch and compile team achievements from multiple TBA API endpoints
        // This would be a substantial implementation similar to what's in your existing backend
        throw UnimplementedError('Direct TBA API implementation for team achievements is not implemented yet.');
      }
    } catch (e) {
      _logger.e('Error getting team achievements', e, StackTrace.current);
      rethrow;
    }
  }
}