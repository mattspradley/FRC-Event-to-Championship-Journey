import 'package:flutter/material.dart';
import 'package:flutter_frc_tracker/models/event.dart';
import 'package:flutter_frc_tracker/models/team.dart';
import 'package:flutter_frc_tracker/models/team_achievement.dart';

class AppState extends ChangeNotifier {
  // App settings
  bool _isDarkMode = false;
  bool _hasApiKey = false;

  // Data loading state
  bool _isLoading = false;
  String? _errorMessage;

  // Year and event selection
  int _selectedYear = DateTime.now().year;
  List<Event> _events = [];
  Event? _selectedEvent;

  // Teams data
  List<TeamWithStatus> _teams = [];
  TeamWithStatus? _selectedTeam;
  String _searchQuery = '';
  String _statusFilter = 'all';
  String _sortBy = 'number';

  // Team achievements data
  TeamAchievement? _teamAchievement;

  // Getters
  bool get isDarkMode => _isDarkMode;
  bool get hasApiKey => _hasApiKey;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int get selectedYear => _selectedYear;
  List<Event> get events => _events;
  Event? get selectedEvent => _selectedEvent;
  List<TeamWithStatus> get teams => _teams;
  TeamWithStatus? get selectedTeam => _selectedTeam;
  String get searchQuery => _searchQuery;
  String get statusFilter => _statusFilter;
  String get sortBy => _sortBy;
  TeamAchievement? get teamAchievement => _teamAchievement;

  // Computed getters
  List<TeamWithStatus> get filteredTeams {
    // First filter by status if needed
    List<TeamWithStatus> filtered = _teams;
    
    if (_statusFilter != 'all') {
      filtered = _teams.where((team) {
        final status = team.getQualificationStatus();
        switch (_statusFilter) {
          case 'qualified':
            return status == QualificationStatus.qualified;
          case 'waitlist':
            return status == QualificationStatus.waitlist;
          case 'not-qualified':
            return status == QualificationStatus.notQualified || 
                   status == QualificationStatus.unknown;
          default:
            return true;
        }
      }).toList();
    }
    
    // Then filter by search query if needed
    if (_searchQuery.isNotEmpty) {
      final query = _searchQuery.toLowerCase();
      filtered = filtered.where((team) {
        return team.team.teamNumber.toString().contains(query) ||
               team.team.name.toLowerCase().contains(query) ||
               (team.team.nickname?.toLowerCase().contains(query) ?? false) ||
               (team.team.city?.toLowerCase().contains(query) ?? false) ||
               (team.team.stateProv?.toLowerCase().contains(query) ?? false) ||
               (team.team.country?.toLowerCase().contains(query) ?? false);
      }).toList();
    }
    
    // Finally sort the results
    filtered.sort((a, b) {
      switch (_sortBy) {
        case 'number':
          return a.team.teamNumber.compareTo(b.team.teamNumber);
        case 'name':
          final aName = a.team.nickname ?? a.team.name;
          final bName = b.team.nickname ?? b.team.name;
          return aName.compareTo(bName);
        case 'rank':
          // Sort by rank, but put unranked teams at the end
          if (a.rank == null && b.rank == null) {
            return 0;
          } else if (a.rank == null) {
            return 1;
          } else if (b.rank == null) {
            return -1;
          }
          return a.rank!.compareTo(b.rank!);
        case 'status':
          // Sort by qualification status: qualified -> waitlist -> not qualified -> unknown
          final aStatus = a.getQualificationStatus();
          final bStatus = b.getQualificationStatus();
          final aValue = _getStatusSortValue(aStatus);
          final bValue = _getStatusSortValue(bStatus);
          
          if (aValue == bValue) {
            // If status is the same, further sort waitlisted teams by position
            if (aStatus == QualificationStatus.waitlist && 
                bStatus == QualificationStatus.waitlist) {
              final aPos = a.waitlistPosition ?? 9999;
              final bPos = b.waitlistPosition ?? 9999;
              return aPos.compareTo(bPos);
            }
            // Default to team number for equal status
            return a.team.teamNumber.compareTo(b.team.teamNumber);
          }
          
          return aValue.compareTo(bValue);
        default:
          return a.team.teamNumber.compareTo(b.team.teamNumber);
      }
    });
    
    return filtered;
  }

  // Setters
  set isDarkMode(bool value) {
    _isDarkMode = value;
    notifyListeners();
  }
  
  set hasApiKey(bool value) {
    _hasApiKey = value;
    notifyListeners();
  }
  
  set isLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
  
  set errorMessage(String? value) {
    _errorMessage = value;
    notifyListeners();
  }
  
  set selectedYear(int value) {
    _selectedYear = value;
    notifyListeners();
  }
  
  set events(List<Event> value) {
    _events = value;
    notifyListeners();
  }
  
  set selectedEvent(Event? value) {
    _selectedEvent = value;
    notifyListeners();
  }
  
  set teams(List<TeamWithStatus> value) {
    _teams = value;
    notifyListeners();
  }
  
  set selectedTeam(TeamWithStatus? value) {
    _selectedTeam = value;
    notifyListeners();
  }
  
  set searchQuery(String value) {
    _searchQuery = value;
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
  
  set teamAchievement(TeamAchievement? value) {
    _teamAchievement = value;
    notifyListeners();
  }
  
  // Helper methods
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
  
  // Utility methods
  int _getStatusSortValue(QualificationStatus status) {
    switch (status) {
      case QualificationStatus.qualified:
        return 0;
      case QualificationStatus.waitlist:
        return 1;
      case QualificationStatus.notQualified:
        return 2;
      case QualificationStatus.unknown:
        return 3;
      default:
        return 4;
    }
  }
}