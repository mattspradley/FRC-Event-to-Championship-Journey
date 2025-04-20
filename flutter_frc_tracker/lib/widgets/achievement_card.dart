import 'package:flutter/material.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:flutter_frc_tracker/models/team_achievement.dart';
import 'package:url_launcher/url_launcher.dart';

class AchievementCard extends StatelessWidget {
  final Achievement achievement;
  final bool isFirst;
  final bool isLast;

  const AchievementCard({
    Key? key,
    required this.achievement,
    this.isFirst = false,
    this.isLast = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final eventTypeColor = _getEventTypeColor(achievement.event.eventType);
    
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Timeline connector
          SizedBox(
            width: 40,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Vertical line
                if (!isFirst || !isLast)
                  Positioned(
                    top: isFirst ? 20 : 0,
                    bottom: isLast ? 20 : 0,
                    child: Container(
                      width: 2,
                      color: Colors.grey.withOpacity(0.3),
                    ),
                  ),
                
                // Circle indicator
                Container(
                  width: 20,
                  height: 20,
                  decoration: BoxDecoration(
                    color: eventTypeColor.withOpacity(0.2),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: eventTypeColor,
                      width: 2,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Card content
          Expanded(
            child: Card(
              margin: const EdgeInsets.only(bottom: 16, right: 8),
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Event header
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: eventTypeColor.withOpacity(0.1),
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(12),
                        topRight: Radius.circular(12),
                      ),
                      border: Border(
                        bottom: BorderSide(
                          color: eventTypeColor.withOpacity(0.3),
                          width: 1,
                        ),
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                achievement.event.name,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: eventTypeColor.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: eventTypeColor,
                                  width: 1,
                                ),
                              ),
                              child: Text(
                                _getEventTypeText(achievement.event.eventType),
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: eventTypeColor,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '${achievement.event.city ?? ""}, ${achievement.event.stateProv ?? ""}, ${achievement.event.country ?? ""}',
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          '${achievement.event.startDate} - ${achievement.event.endDate}',
                          style: const TextStyle(
                            fontSize: 14,
                            color: Colors.grey,
                          ),
                        ),
                        
                        // Award badges
                        if (achievement.awards.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: achievement.awards.map((award) {
                              return Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.amber.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(
                                    color: Colors.amber,
                                    width: 1,
                                  ),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.emoji_events,
                                      color: Colors.amber,
                                      size: 16,
                                    ),
                                    const SizedBox(width: 4),
                                    Flexible(
                                      child: Text(
                                        award.toString(),
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.amber,
                                        ),
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ],
                    ),
                  ),
                  
                  // Performance details
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Performance info grid
                        if (achievement.performance != null) ...[
                          const Text(
                            'Performance',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          GridView.count(
                            crossAxisCount: 2,
                            shrinkWrap: true,
                            childAspectRatio: 3,
                            crossAxisSpacing: 8,
                            mainAxisSpacing: 8,
                            physics: const NeverScrollableScrollPhysics(),
                            children: [
                              _buildInfoItem(
                                context,
                                'Rank',
                                '${achievement.performance!.rank} of ${achievement.performance!.totalTeams}',
                              ),
                              _buildInfoItem(
                                context,
                                'Record',
                                achievement.performance!.record,
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                        ],
                        
                        // Status HTML sections
                        if (achievement.overallStatusHtml.isNotEmpty) ...[
                          const Text(
                            'Overall Status',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Html(
                            data: achievement.overallStatusHtml,
                            style: {
                              "body": Style(
                                margin: Margins.zero,
                                padding: HtmlPaddings.zero,
                                fontSize: FontSize(14),
                              ),
                            },
                          ),
                          const SizedBox(height: 12),
                        ],
                        
                        if (achievement.allianceStatusHtml.isNotEmpty) ...[
                          const Text(
                            'Alliance Selection',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Html(
                            data: achievement.allianceStatusHtml,
                            style: {
                              "body": Style(
                                margin: Margins.zero,
                                padding: HtmlPaddings.zero,
                                fontSize: FontSize(14),
                              ),
                            },
                          ),
                        ],
                        
                        // Error message if any
                        if (achievement.error != null) ...[
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.red.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(
                                color: Colors.red.withOpacity(0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.error_outline,
                                  color: Colors.red,
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    achievement.error!,
                                    style: const TextStyle(color: Colors.red),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  
                  // Button bar
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.open_in_new),
                      label: const Text('View Event on TBA'),
                      onPressed: () => _openEventWebsite(achievement.event.key),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoItem(BuildContext context, String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Theme.of(context).hintColor,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  void _openEventWebsite(String eventKey) {
    final url = 'https://www.thebluealliance.com/event/$eventKey';
    launchUrl(Uri.parse(url));
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
}