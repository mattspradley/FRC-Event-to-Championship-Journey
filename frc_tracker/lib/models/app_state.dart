import 'package:flutter/foundation.dart';
import 'package:frc_tracker/models/event.dart';
import 'package:frc_tracker/models/team.dart';

class AppState extends ChangeNotifier {
  // Selected event
  Event? _selectedEvent;
  Event? get selectedEvent => _selectedEvent;
  set selectedEvent(Event? event) {
    _selectedEvent = event;
    notifyListeners();
  }

  // Selected year
  int _selectedYear = DateTime.now().year;
  int get selectedYear => _selectedYear;
  set selectedYear(int year) {
    _selectedYear = year;
    notifyListeners();
  }

  // Teams for the selected event
  List<TeamWithStatus> _teams = [];
  List<TeamWithStatus> get teams => _teams;
  set teams(List<TeamWithStatus> teams) {
    _teams = teams;
    notifyListeners();
  }

  // Filter status for teams
  String _statusFilter = 'all';
  String get statusFilter => _statusFilter;
  set statusFilter(String filter) {
    _statusFilter = filter;
    notifyListeners();
  }

  // Sort criteria for teams
  String _sortBy = 'number';
  String get sortBy => _sortBy;
  set sortBy(String sort) {
    _sortBy = sort;
    notifyListeners();
  }

  // Search query for teams
  String _searchQuery = '';
  String get searchQuery => _searchQuery;
  set searchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  // Currently selected team for details
  TeamWithStatus? _selectedTeam;
  TeamWithStatus? get selectedTeam => _selectedTeam;
  set selectedTeam(TeamWithStatus? team) {
    _selectedTeam = team;
    notifyListeners();
  }

  // Loading state
  bool _isLoading = false;
  bool get isLoading => _isLoading;
  set isLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  // Error message
  String? _errorMessage;
  String? get errorMessage => _errorMessage;
  set errorMessage(String? error) {
    _errorMessage = error;
    notifyListeners();
  }

  // Reset all filters
  void resetFilters() {
    _statusFilter = 'all';
    _sortBy = 'number';
    _searchQuery = '';
    notifyListeners();
  }

  // Reset the entire state
  void reset() {
    _selectedEvent = null;
    _teams = [];
    resetFilters();
    _selectedTeam = null;
    _errorMessage = null;
    _isLoading = false;
    notifyListeners();
  }
}