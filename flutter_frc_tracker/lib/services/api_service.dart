import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_frc_tracker/models/event.dart';
import 'package:flutter_frc_tracker/models/team.dart';
import 'package:flutter_frc_tracker/models/team_achievement.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  final String baseUrl;
  final FlutterSecureStorage secureStorage;
  
  ApiService({
    required this.baseUrl,
    required this.secureStorage,
  });

  // Helper method to get API key from secure storage
  Future<String?> _getApiKey() async {
    return await secureStorage.read(key: 'TBA_API_KEY');
  }

  // Helper method for making authenticated HTTP requests
  Future<http.Response> _authenticatedRequest(String endpoint) async {
    final apiKey = await _getApiKey();
    
    if (apiKey == null || apiKey.isEmpty) {
      throw Exception('No API key found. Please add your Blue Alliance API key in the settings.');
    }

    final headers = {
      'Content-Type': 'application/json',
      'X-TBA-Auth-Key': apiKey,
    };

    final url = Uri.parse('$baseUrl$endpoint');
    final response = await http.get(url, headers: headers);

    if (response.statusCode >= 400) {
      throw Exception('Error ${response.statusCode}: ${response.reasonPhrase}');
    }

    return response;
  }

  // Validate API key
  Future<bool> validateApiKey(String apiKey) async {
    try {
      final url = Uri.parse('$baseUrl/api/years');
      final headers = {
        'Content-Type': 'application/json',
        'X-TBA-Auth-Key': apiKey,
      };

      final response = await http.get(url, headers: headers);
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        // Save valid API key to secure storage
        await secureStorage.write(key: 'TBA_API_KEY', value: apiKey);
        return true;
      }
      
      return false;
    } catch (e) {
      return false;
    }
  }

  // Fetch available years
  Future<List<int>> fetchYears() async {
    final response = await _authenticatedRequest('/api/years');
    List<dynamic> jsonData = json.decode(response.body);
    return jsonData.map<int>((year) => year as int).toList();
  }

  // Search events with optional filters
  Future<List<Event>> searchEvents({
    int? year,
    String? query,
    String? eventType,
  }) async {
    String endpoint = '/api/search/events?';
    
    if (year != null) {
      endpoint += 'year=$year&';
    }
    
    if (query != null && query.isNotEmpty) {
      endpoint += 'query=${Uri.encodeComponent(query)}&';
    }
    
    if (eventType != null && eventType.isNotEmpty) {
      endpoint += 'eventType=${Uri.encodeComponent(eventType)}';
    }

    final response = await _authenticatedRequest(endpoint);
    List<dynamic> jsonData = json.decode(response.body);
    return jsonData.map<Event>((event) => Event.fromJson(event)).toList();
  }

  // Get event details
  Future<Event> getEventDetails(String eventKey) async {
    final response = await _authenticatedRequest('/api/events/$eventKey');
    Map<String, dynamic> jsonData = json.decode(response.body);
    return Event.fromJson(jsonData);
  }

  // Get teams for an event
  Future<List<TeamWithStatus>> getEventTeams(String eventKey) async {
    final response = await _authenticatedRequest('/api/events/$eventKey/teams');
    List<dynamic> jsonData = json.decode(response.body);
    return jsonData.map<TeamWithStatus>((team) => TeamWithStatus.fromJson(team)).toList();
  }

  // Get team events for a year
  Future<List<Event>> getTeamEvents(int teamNumber, int year) async {
    final response = await _authenticatedRequest('/api/team/$teamNumber/events/$year');
    List<dynamic> jsonData = json.decode(response.body);
    return jsonData.map<Event>((event) => Event.fromJson(event)).toList();
  }

  // Get team achievements for a year
  Future<TeamAchievement> getTeamAchievements(int teamNumber, int year) async {
    final response = await _authenticatedRequest('/api/team/$teamNumber/achievements/$year');
    Map<String, dynamic> jsonData = json.decode(response.body);
    return TeamAchievement.fromJson(jsonData);
  }
  
  // Delete stored API key
  Future<void> deleteApiKey() async {
    await secureStorage.delete(key: 'TBA_API_KEY');
  }
}