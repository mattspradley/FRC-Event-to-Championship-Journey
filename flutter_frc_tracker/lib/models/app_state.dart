import 'package:flutter/foundation.dart';
import 'package:flutter_frc_tracker/models/event.dart';
import 'package:flutter_frc_tracker/models/team.dart';
import 'package:flutter_frc_tracker/models/team_achievement.dart';

class AppState extends ChangeNotifier {
  // Application global state
  bool _isLoading = false;
  String? _errorMessage;
  bool _hasApiKey = false;

  // Current user selections
  int _selectedYear = DateTime.now().year;
  Event? _selectedEvent;
  TeamWithStatus? _selectedTeam;
  TeamAchievement? _teamAchievement;

  // Filtered data
  List<Event> _events = [];
  List<TeamWithStatus> _teams = [];

  // Filter options
  String _statusFilter = 'all';
  String _sortBy = 'number';
  String _searchQuery = '';

  // Theme settings
  bool _isDarkMode = false;

  // Getters
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get hasApiKey => _hasApiKey;
  int get selectedYear => _selectedYear;
  Event? get selectedEvent => _selectedEvent;
  TeamWithStatus? get selectedTeam => _selectedTeam;
  TeamAchievement? get teamAchievement => _teamAchievement;
  List<Event> get events => _events;
  List<TeamWithStatus> get teams => _teams;
  String get statusFilter => _statusFilter;
  String get sortBy => _sortBy;
  String get searchQuery => _searchQuery;
  bool get isDarkMode => _isDarkMode;

  // Setter methods with notifyListeners()
  set isLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  set errorMessage(String? value) {
    _errorMessage = value;
    notifyListeners();
  }

  set hasApiKey(bool value) {
    _hasApiKey = value;
    notifyListeners();
  }

  set selectedYear(int value) {
    _selectedYear = value;
    notifyListeners();
  }

  set selectedEvent(Event? value) {
    _selectedEvent = value;
    notifyListeners();
  }

  set selectedTeam(TeamWithStatus? value) {
    _selectedTeam = value;
    notifyListeners();
  }

  set teamAchievement(TeamAchievement? value) {
    _teamAchievement = value;
    notifyListeners();
  }

  set events(List<Event> value) {
    _events = value;
    notifyListeners();
  }

  set teams(List<TeamWithStatus> value) {
    _teams = value;
    notifyListeners();
  }

  set statusFilter(String value) {
    _statusFilter = value;
    notifyListeners();
  }

  set sortBy(String value) {
    _sortBy = value;
    notifyListeners();
  }

  set searchQuery(String value) {
    _searchQuery = value;
    notifyListeners();
  }

  set isDarkMode(bool value) {
    _isDarkMode = value;
    notifyListeners();
  }

  // Filter teams based on the current filters
  List<TeamWithStatus> get filteredTeams {
    if (_teams.isEmpty) return [];

    return _teams.where((team) {
      // Filter by status
      if (_statusFilter != 'all') {
        switch (_statusFilter) {
          case 'qualified':
            if (!team.isQualified) return false;
            break;
          case 'waitlist':
            if (team.waitlistPosition == null) return false;
            break;
          case 'not-qualified':
            if (team.isQualified || team.waitlistPosition != null) return false;
            break;
        }
      }

      // Filter by search query
      if (_searchQuery.isNotEmpty) {
        final teamNumber = team.team.teamNumber.toString();
        final teamName = team.team.name.toLowerCase();
        final teamNickname = team.team.nickname?.toLowerCase() ?? '';
        final query = _searchQuery.toLowerCase();

        return teamNumber.contains(query) ||
            teamName.contains(query) ||
            teamNickname.contains(query);
      }

      return true;
    }).toList()
      ..sort((a, b) {
        // Sort by the selected criterion
        switch (_sortBy) {
          case 'number':
            return a.team.teamNumber.compareTo(b.team.teamNumber);
          case 'name':
            return (a.team.nickname ?? a.team.name)
                .compareTo(b.team.nickname ?? b.team.name);
          case 'rank':
            final aRank = a.rank ?? 9999;
            final bRank = b.rank ?? 9999;
            return aRank.compareTo(bRank);
          case 'status':
            final aStatus = a.getQualificationStatus().index;
            final bStatus = b.getQualificationStatus().index;
            return aStatus.compareTo(bStatus);
          default:
            return a.team.teamNumber.compareTo(b.team.teamNumber);
        }
      });
  }

  // Clear error message
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  // Reset filters
  void resetFilters() {
    _statusFilter = 'all';
    _sortBy = 'number';
    _searchQuery = '';
    notifyListeners();
  }

  // Reset state
  void reset() {
    _isLoading = false;
    _errorMessage = null;
    _selectedEvent = null;
    _selectedTeam = null;
    _teamAchievement = null;
    _events = [];
    _teams = [];
    resetFilters();
    notifyListeners();
  }
}