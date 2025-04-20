import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_frc_tracker/models/app_state.dart';
import 'package:flutter_frc_tracker/models/team.dart';
import 'package:url_launcher/url_launcher.dart';

class TeamCard extends StatelessWidget {
  final TeamWithStatus team;
  final int eventYear;

  const TeamCard({
    Key? key,
    required this.team,
    required this.eventYear,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final status = team.getQualificationStatus();
    final statusText = team.getStatusText();
    
    // Define color based on status
    Color statusColor;
    switch (status) {
      case QualificationStatus.qualified:
        statusColor = Colors.green;
        break;
      case QualificationStatus.waitlist:
        statusColor = Colors.amber;
        break;
      case QualificationStatus.notQualified:
        statusColor = Colors.red;
        break;
      default:
        statusColor = Colors.grey;
    }

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: statusColor.withOpacity(0.5),
          width: 2,
        ),
      ),
      child: InkWell(
        onTap: () => _showTeamDetails(context),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          height: 200, // Fixed height for consistent layout
          child: Column(
            children: [
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Team header row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Team ${team.team.teamNumber}',
                            style: const TextStyle(
                              fontFamily: 'Roboto Mono',
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: statusColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: statusColor),
                            ),
                            child: Text(
                              statusText,
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: statusColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      
                      const SizedBox(height: 8),
                      
                      // Team name
                      Text(
                        team.team.displayName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      
                      // Team location
                      Text(
                        team.team.formattedLocation,
                        style: TextStyle(
                          fontSize: 14,
                          color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.7),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      
                      const SizedBox(height: 12),
                      
                      // Team performance data grid
                      Expanded(
                        child: _buildTeamDataGrid(context),
                      ),
                    ],
                  ),
                ),
              ),
              
              // Bottom action bar
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Theme.of(context).brightness == Brightness.light
                      ? Colors.grey.shade100
                      : Colors.grey.shade800,
                  borderRadius: const BorderRadius.only(
                    bottomLeft: Radius.circular(12),
                    bottomRight: Radius.circular(12),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    TextButton.icon(
                      icon: const Icon(Icons.calendar_today, size: 16),
                      label: const Text('Team Season'),
                      onPressed: () => _openTeamWebsite(context),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        minimumSize: const Size(0, 32),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                    TextButton.icon(
                      icon: const Icon(Icons.bar_chart, size: 16),
                      label: const Text('Team Details'),
                      onPressed: () => _showTeamDetails(context),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        minimumSize: const Size(0, 32),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTeamDataGrid(BuildContext context) {
    final infoItems = <Map<String, String>>[];
    
    // Always show event rank and record
    infoItems.add({
      'label': 'Event Rank',
      'value': team.rank != null ? '${team.rank} of ${team.totalTeams ?? "N/A"}' : 'N/A',
    });
    
    infoItems.add({
      'label': 'Event Record',
      'value': team.record ?? 'N/A',
    });
    
    // Show qualification info based on status
    if (team.isQualified) {
      infoItems.add({
        'label': 'Championship',
        'value': team.championshipLocation ?? 'Yes',
      });
      
      infoItems.add({
        'label': 'Division',
        'value': team.division ?? 'TBD',
      });
      
      // If we have championship performance data
      if (team.championshipRank != null) {
        infoItems.add({
          'label': 'Division Rank',
          'value': '${team.championshipRank} of ${team.divisionTotalTeams ?? "N/A"}',
        });
        
        infoItems.add({
          'label': 'Division Record',
          'value': team.championshipRecord ?? 'TBD',
        });
      }
    } else if (team.waitlistPosition != null) {
      infoItems.add({
        'label': 'Waitlist',
        'value': '#${team.waitlistPosition}',
      });
    }
    
    // Finals data
    if (team.isQualified && team.finalEventKey != null) {
      infoItems.add({
        'label': 'Finals Status',
        'value': team.finalRank ?? 'Competing',
      });
      
      if (team.finalRecord != null) {
        infoItems.add({
          'label': 'Finals Record',
          'value': team.finalRecord!,
        });
      }
    }
    
    // Create grid view
    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 3.5,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: infoItems.length.clamp(0, 6), // Limit to max 6 items
      itemBuilder: (context, index) {
        final item = infoItems[index];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              item['label']!,
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context).textTheme.bodyMedium?.color?.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 2),
            Text(
              item['value']!,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        );
      },
    );
  }

  void _showTeamDetails(BuildContext context) {
    final appState = Provider.of<AppState>(context, listen: false);
    
    // Set the selected team in app state
    appState.selectedTeam = team;
    
    // Navigate to the team details screen
    Navigator.pushNamed(context, '/team-details');
  }

  void _openTeamWebsite(BuildContext context) {
    final url = 'https://www.thebluealliance.com/team/${team.team.teamNumber}/$eventYear';
    launchUrl(Uri.parse(url));
  }
}