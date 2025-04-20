import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_frc_tracker/models/app_state.dart';
import 'package:flutter_frc_tracker/models/event.dart';
import 'package:flutter_frc_tracker/widgets/team_filter.dart';
import 'package:flutter_frc_tracker/widgets/teams_list.dart';
import 'package:flutter_frc_tracker/widgets/status_dashboard.dart';
import 'package:flutter_frc_tracker/services/api_service.dart';
import 'package:flutter_frc_tracker/widgets/loading_indicator.dart';
import 'package:url_launcher/url_launcher.dart';

class EventDetailsScreen extends StatefulWidget {
  const EventDetailsScreen({Key? key}) : super(key: key);

  @override
  State<EventDetailsScreen> createState() => _EventDetailsScreenState();
}

class _EventDetailsScreenState extends State<EventDetailsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _statusFilter = 'all';
  String _sortBy = 'number';
  bool _isLoading = false;

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

  Future<void> _refreshData() async {
    final appState = Provider.of<AppState>(context, listen: false);
    final apiService = Provider.of<ApiService>(context, listen: false);
    final event = appState.selectedEvent;
    
    if (event == null) return;
    
    setState(() {
      _isLoading = true;
    });
    
    try {
      // Refresh teams data
      final teams = await apiService.getEventTeams(event.key);
      appState.teams = teams;
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error refreshing data: $e')),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _openEventWebsite() {
    final appState = Provider.of<AppState>(context, listen: false);
    final event = appState.selectedEvent;
    
    if (event == null) return;
    
    final url = 'https://www.thebluealliance.com/event/${event.key}';
    launchUrl(Uri.parse(url));
  }

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final event = appState.selectedEvent;
    
    if (event == null) {
      // Navigate back if no event is selected
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Navigator.pop(context);
      });
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }
    
    return Scaffold(
      appBar: AppBar(
        title: Text(event.name),
        actions: [
          IconButton(
            icon: const Icon(Icons.open_in_new),
            onPressed: _openEventWebsite,
            tooltip: 'View on The Blue Alliance',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _refreshData,
            tooltip: 'Refresh data',
          ),
        ],
      ),
      body: Column(
        children: [
          // Event information card
          Card(
            margin: const EdgeInsets.all(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Event title and type
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: _getEventTypeColor(event.eventType).withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: _getEventTypeColor(event.eventType),
                          ),
                        ),
                        child: Text(
                          _getEventTypeText(event.eventType),
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: _getEventTypeColor(event.eventType),
                          ),
                        ),
                      ),
                      if (event.isOngoing) ...[
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.green.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.green),
                          ),
                          child: const Text(
                            'Ongoing',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.green,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Event details
                  Row(
                    children: [
                      // Date information
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Dates',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              event.formattedDateRange,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                      
                      // Location information
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Location',
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              event.formattedLocation,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          
          // Status dashboard
          if (!_isLoading && appState.teams.isNotEmpty)
            StatusDashboard(teams: appState.teams),
          
          // Team filters
          if (!_isLoading && appState.teams.isNotEmpty)
            TeamFilter(
              searchController: _searchController,
              statusFilter: _statusFilter,
              sortBy: _sortBy,
              onStatusFilterChanged: _onStatusFilterChanged,
              onSortChanged: _onSortChanged,
            ),
          
          // Teams list or loading indicator
          Expanded(
            child: _isLoading
                ? const LoadingIndicator()
                : appState.teams.isEmpty
                    ? const Center(
                        child: Text(
                          'No teams found for this event',
                          style: TextStyle(fontSize: 16, color: Colors.grey),
                        ),
                      )
                    : TeamsList(
                        teams: appState.filteredTeams,
                        eventYear: event.year,
                      ),
          ),
        ],
      ),
    );
  }

  Color _getEventTypeColor(int eventType) {
    switch (eventType) {
      case 0: return Colors.blue; // Regional
      case 1: return Colors.teal; // District
      case 2: return Colors.purple; // District Championship
      case 3: return Colors.orange; // Championship Division
      case 4: return Colors.red; // Championship Finals
      case 5: return Colors.indigo; // District Championship Division
      case 6: return Colors.pink; // Festival of Champions
      case 7: return Colors.cyan; // Remote Event
      case 8: return Colors.lightBlue; // Remote Event Finals
      case 99: return Colors.amber; // Off-Season
      case 100: return Colors.grey; // Pre-Season
      default: return Colors.grey;
    }
  }

  String _getEventTypeText(int eventType) {
    switch (eventType) {
      case 0: return 'Regional';
      case 1: return 'District';
      case 2: return 'District Championship';
      case 3: return 'Championship Division';
      case 4: return 'Championship Finals';
      case 5: return 'District Championship Division';
      case 6: return 'Festival of Champions';
      case 7: return 'Remote Event';
      case 8: return 'Remote Event Finals';
      case 99: return 'Off-Season';
      case 100: return 'Pre-Season';
      default: return 'Unknown';
    }
  }
}