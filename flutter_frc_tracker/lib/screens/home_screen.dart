import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_frc_tracker/models/app_state.dart';
import 'package:flutter_frc_tracker/models/event.dart';
import 'package:flutter_frc_tracker/services/api_service.dart';
import 'package:flutter_frc_tracker/widgets/event_selector.dart';
import 'package:flutter_frc_tracker/widgets/status_dashboard.dart';
import 'package:flutter_frc_tracker/widgets/team_filter.dart';
import 'package:flutter_frc_tracker/widgets/teams_list.dart';
import 'package:flutter_frc_tracker/widgets/loading_indicator.dart';
import 'package:flutter_frc_tracker/widgets/error_message.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _statusFilter = 'all';
  String _sortBy = 'number';

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final appState = Provider.of<AppState>(context, listen: false);
    appState.searchQuery = _searchController.text;
  }

  void _onStatusFilterChanged(String value) {
    setState(() {
      _statusFilter = value;
    });
    final appState = Provider.of<AppState>(context, listen: false);
    appState.statusFilter = value;
  }

  void _onSortChanged(String value) {
    setState(() {
      _sortBy = value;
    });
    final appState = Provider.of<AppState>(context, listen: false);
    appState.sortBy = value;
  }

  Future<void> _onEventSelected(Event event) async {
    try {
      final appState = Provider.of<AppState>(context, listen: false);
      final apiService = Provider.of<ApiService>(context, listen: false);

      // Update selected event
      appState.selectedEvent = event;
      appState.isLoading = true;
      appState.clearError();

      // Fetch teams for the selected event
      final teams = await apiService.getEventTeams(event.key);
      appState.teams = teams;
      appState.isLoading = false;
    } catch (e) {
      final appState = Provider.of<AppState>(context, listen: false);
      appState.isLoading = false;
      appState.errorMessage = 'Failed to load teams: $e';
    }
  }

  Future<void> _onYearChanged(int year) async {
    try {
      final appState = Provider.of<AppState>(context, listen: false);
      final apiService = Provider.of<ApiService>(context, listen: false);

      // Update selected year
      appState.selectedYear = year;
      appState.isLoading = true;
      appState.clearError();

      // Fetch events for the selected year
      final events = await apiService.searchEvents(year: year);
      appState.events = events;
      appState.isLoading = false;
    } catch (e) {
      final appState = Provider.of<AppState>(context, listen: false);
      appState.isLoading = false;
      appState.errorMessage = 'Failed to load events: $e';
    }
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('FRC Championship Tracker'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              // Refresh current data
              if (appState.selectedEvent != null) {
                _onEventSelected(appState.selectedEvent!);
              } else {
                _onYearChanged(appState.selectedYear);
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.pushNamed(context, '/settings');
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Event selector and year dropdown
          EventSelector(
            onEventSelected: _onEventSelected,
            onYearChanged: _onYearChanged,
          ),
          
          // Status dashboard
          if (appState.selectedEvent != null && !appState.isLoading && appState.teams.isNotEmpty)
            StatusDashboard(teams: appState.teams),
          
          // Team filters
          if (appState.selectedEvent != null && !appState.isLoading && appState.teams.isNotEmpty)
            TeamFilter(
              searchController: _searchController,
              statusFilter: _statusFilter,
              sortBy: _sortBy,
              onStatusFilterChanged: _onStatusFilterChanged,
              onSortChanged: _onSortChanged,
            ),
          
          // Loading indicator
          if (appState.isLoading)
            const Expanded(child: LoadingIndicator()),
          
          // Error message
          else if (appState.errorMessage != null)
            Expanded(child: ErrorMessage(message: appState.errorMessage!)),
          
          // No event selected message
          else if (appState.selectedEvent == null)
            const Expanded(
              child: Center(
                child: Text(
                  'Select an event to view teams',
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
              ),
            ),
          
          // Teams list
          else if (appState.teams.isNotEmpty)
            Expanded(
              child: TeamsList(
                teams: appState.filteredTeams,
                eventYear: appState.selectedYear,
              ),
            ),
          
          // No teams found message
          else
            const Expanded(
              child: Center(
                child: Text(
                  'No teams found for this event',
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
              ),
            ),
        ],
      ),
      floatingActionButton: appState.selectedEvent != null && appState.teams.isNotEmpty ? FloatingActionButton(
        onPressed: () {
          // Open team storyboard search dialog
          _showTeamStoryboardDialog();
        },
        tooltip: 'View Team Storyboard',
        child: const Icon(Icons.track_changes),
      ) : null,
    );
  }

  void _showTeamStoryboardDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('View Team Storyboard'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Enter Team Number',
                hintText: 'e.g. 1678',
                border: OutlineInputBorder(),
              ),
              onSubmitted: (value) {
                final teamNumber = int.tryParse(value);
                if (teamNumber != null) {
                  Navigator.pop(context);
                  _navigateToTeamStoryboard(teamNumber);
                }
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // TODO: Get the team number from text field and navigate
            },
            child: const Text('View'),
          ),
        ],
      ),
    );
  }

  void _navigateToTeamStoryboard(int teamNumber) {
    final appState = Provider.of<AppState>(context, listen: false);
    Navigator.pushNamed(
      context,
      '/team-storyboard',
      arguments: {
        'teamNumber': teamNumber,
        'year': appState.selectedYear,
      },
    );
  }
}