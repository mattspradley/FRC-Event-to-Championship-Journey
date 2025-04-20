import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_frc_tracker/models/app_state.dart';
import 'package:flutter_frc_tracker/models/team.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:url_launcher/url_launcher.dart';

class TeamDetailsScreen extends StatelessWidget {
  const TeamDetailsScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final team = appState.selectedTeam;

    // Ensure we have a team to display
    if (team == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Team Details'),
        ),
        body: const Center(
          child: Text('No team selected'),
        ),
      );
    }

    final status = team.getQualificationStatus();
    final statusText = team.getStatusText();
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

    return Scaffold(
      appBar: AppBar(
        title: Text('Team ${team.team.teamNumber}'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Team header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        team.team.displayName,
                        style: Theme.of(context).textTheme.headlineMedium,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        team.team.formattedLocation,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      if (team.team.rookieYear != null) ...[
                        const SizedBox(height: 4),
                        Text(
                          'Founded: ${team.team.rookieYear}',
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                      ],
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: statusColor),
                  ),
                  child: Text(
                    statusText,
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            
            const Divider(height: 32),
            
            // Championship status section
            Text(
              'Championship Status',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            
            if (team.isQualified) 
              _buildQualifiedSection(context, team)
            else
              _buildNonQualifiedSection(context, team, status),
            
            const Divider(height: 32),
            
            // Current event performance
            Text(
              'Event Performance',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            _buildEventPerformanceSection(context, team),
            
            const Divider(height: 32),

            // Status HTML sections
            if (team.overallStatusStr != null || team.allianceStatusStr != null) ...[
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (team.overallStatusStr != null) ...[
                    Text(
                      'Overall Status',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Html(
                      data: team.overallStatusStr!,
                      style: {
                        "body": Style(
                          margin: Margins.zero,
                          padding: HtmlPaddings.zero,
                          fontSize: FontSize(14),
                        ),
                      },
                    ),
                    const SizedBox(height: 16),
                  ],
                  
                  if (team.allianceStatusStr != null) ...[
                    Text(
                      'Alliance Selection',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 8),
                    Html(
                      data: team.allianceStatusStr!,
                      style: {
                        "body": Style(
                          margin: Margins.zero,
                          padding: HtmlPaddings.zero,
                          fontSize: FontSize(14),
                        ),
                      },
                    ),
                  ],
                ],
              ),
              
              const Divider(height: 32),
            ],

            // Championship Awards
            if (team.isQualified && team.championshipAwards != null && team.championshipAwards!.isNotEmpty) ...[
              Text(
                'Championship Awards',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: team.championshipAwards!.length,
                itemBuilder: (context, index) {
                  final award = team.championshipAwards![index];
                  return ListTile(
                    leading: const Icon(Icons.emoji_events, color: Colors.amber),
                    title: Text(award.name),
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                  );
                },
              ),
            ],
          ],
        ),
      ),
      bottomNavigationBar: BottomAppBar(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  icon: const Icon(Icons.track_changes),
                  label: const Text('View Storyboard'),
                  onPressed: () {
                    Navigator.pushNamed(
                      context,
                      '/team-storyboard',
                      arguments: {
                        'teamNumber': team.team.teamNumber,
                        'year': appState.selectedYear,
                      },
                    );
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton.icon(
                  icon: const Icon(Icons.open_in_new),
                  label: const Text('View on TBA'),
                  onPressed: () {
                    final url = 'https://www.thebluealliance.com/team/${team.team.teamNumber}/${appState.selectedYear}';
                    launchUrl(Uri.parse(url));
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQualifiedSection(BuildContext context, TeamWithStatus team) {
    return Card(
      elevation: 0,
      color: Colors.green.withOpacity(0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Colors.green, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Division information
            if (team.division != null) ...[
              const Text(
                'Championship Division Performance',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.green,
                ),
              ),
              const SizedBox(height: 12),
              
              _buildInfoGrid(context, [
                {
                  'label': 'Division',
                  'value': team.division ?? 'Not Yet Assigned',
                },
                {
                  'label': 'Division Rank',
                  'value': team.championshipRank != null 
                    ? '${team.championshipRank} of ${team.divisionTotalTeams ?? "N/A"}'
                    : 'Not Yet Available',
                },
                {
                  'label': 'Division Record',
                  'value': team.championshipRecord ?? 'Not Yet Available',
                },
              ]),
            ],
            
            // Finals information
            const SizedBox(height: 16),
            const Text(
              'Championship Finals Performance',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
            const SizedBox(height: 12),
            
            _buildInfoGrid(context, [
              {
                'label': 'Finals Status',
                'value': team.finalRank ?? (team.finalEventKey != null ? 'Competing' : 'Not Yet Available'),
              },
              if (team.finalRecord != null)
                {
                  'label': 'Finals Record',
                  'value': team.finalRecord!,
                },
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildNonQualifiedSection(BuildContext context, TeamWithStatus team, QualificationStatus status) {
    final Color color = status == QualificationStatus.waitlist ? Colors.amber : Colors.grey;
    
    return Card(
      elevation: 0,
      color: color.withOpacity(0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: color, width: 1),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              status == QualificationStatus.waitlist
                ? 'Waitlist Status'
                : 'Not Qualified',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 12),
            
            if (status == QualificationStatus.waitlist) ...[
              _buildInfoGrid(context, [
                {
                  'label': 'Waitlist Position',
                  'value': team.waitlistPosition != null 
                    ? '#${team.waitlistPosition}'
                    : 'On waitlist',
                },
                {
                  'label': 'Championship',
                  'value': 'Pending',
                },
                {
                  'label': 'Division',
                  'value': 'TBD',
                },
              ]),
            ] else ...[
              const Text(
                'This team has not qualified for the Championship.',
                style: TextStyle(
                  fontSize: 14,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildEventPerformanceSection(BuildContext context, TeamWithStatus team) {
    return _buildInfoGrid(context, [
      {
        'label': 'Event Rank',
        'value': team.rank != null ? '${team.rank} of ${team.totalTeams ?? "N/A"}' : 'N/A',
      },
      {
        'label': 'Event Record',
        'value': team.record ?? 'N/A',
      },
    ]);
  }

  Widget _buildInfoGrid(BuildContext context, List<Map<String, String>> items) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 3,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: items.length,
      itemBuilder: (context, index) {
        final item = items[index];
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              item['label']!,
              style: const TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              item['value']!,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        );
      },
    );
  }
}