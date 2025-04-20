import 'package:flutter/material.dart';
import 'package:flutter_frc_tracker/models/team_achievement.dart';

class TeamInfoCard extends StatelessWidget {
  final TeamAchievement teamAchievement;
  final VoidCallback onViewWebsite;

  const TeamInfoCard({
    Key? key,
    required this.teamAchievement,
    required this.onViewWebsite,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
              border: Border(
                bottom: BorderSide(
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                  width: 1,
                ),
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Team number circle
                Container(
                  width: 60,
                  height: 60,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.primary,
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    teamAchievement.teamNumber.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                // Team info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        teamAchievement.teamName,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      if (teamAchievement.teamNickname != null &&
                          teamAchievement.teamNickname!.isNotEmpty)
                        Text(
                          teamAchievement.teamNickname!,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      const SizedBox(height: 4),
                      Text(
                        '${teamAchievement.year} Season',
                        style: TextStyle(
                          fontSize: 14,
                          color: Theme.of(context).colorScheme.primary,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Stats
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Team Overview',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _buildStatItem(
                        context,
                        'Events',
                        teamAchievement.achievements.length.toString(),
                        Icons.event,
                      ),
                    ),
                    Expanded(
                      child: _buildStatItem(
                        context,
                        'Founded',
                        teamAchievement.rookieYear?.toString() ?? 'N/A',
                        Icons.date_range,
                      ),
                    ),
                    Expanded(
                      child: _buildStatItem(
                        context,
                        'Qualified',
                        _isTeamQualified() ? 'Yes' : 'No',
                        Icons.verified,
                        color: _isTeamQualified() ? Colors.green : Colors.red,
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // Award count
                Text(
                  'Awards',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 12),
                _buildAwardCounts(context),
              ],
            ),
          ),
          
          // Button
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                icon: const Icon(Icons.open_in_new),
                label: const Text('View Team on The Blue Alliance'),
                onPressed: onViewWebsite,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(
    BuildContext context,
    String label,
    String value,
    IconData icon, {
    Color? color,
  }) {
    return Column(
      children: [
        Icon(
          icon,
          color: color ?? Theme.of(context).colorScheme.primary,
          size: 32,
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Theme.of(context).hintColor,
          ),
        ),
      ],
    );
  }

  Widget _buildAwardCounts(BuildContext context) {
    // Count awards by type
    int totalAwards = 0;
    int winnerAwards = 0;
    int finalistAwards = 0;
    int otherAwards = 0;
    
    for (final achievement in teamAchievement.achievements) {
      totalAwards += achievement.awards.length;
      
      for (final award in achievement.awards) {
        final awardName = award.toString().toLowerCase();
        if (awardName.contains('winner') || awardName.contains('champions')) {
          winnerAwards++;
        } else if (awardName.contains('finalist')) {
          finalistAwards++;
        } else {
          otherAwards++;
        }
      }
    }
    
    return Row(
      children: [
        Expanded(
          child: _buildAwardItem(
            context,
            'Total',
            totalAwards,
            Colors.blue,
          ),
        ),
        Expanded(
          child: _buildAwardItem(
            context,
            'Winner',
            winnerAwards,
            Colors.amber,
          ),
        ),
        Expanded(
          child: _buildAwardItem(
            context,
            'Finalist',
            finalistAwards,
            Colors.purple,
          ),
        ),
        Expanded(
          child: _buildAwardItem(
            context,
            'Other',
            otherAwards,
            Colors.teal,
          ),
        ),
      ],
    );
  }

  Widget _buildAwardItem(
    BuildContext context,
    String label,
    int count,
    Color color,
  ) {
    return Column(
      children: [
        Container(
          width: 40,
          height: 40,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
            border: Border.all(
              color: color,
              width: 2,
            ),
          ),
          child: Text(
            count.toString(),
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Theme.of(context).hintColor,
          ),
        ),
      ],
    );
  }

  bool _isTeamQualified() {
    for (final achievement in teamAchievement.achievements) {
      if (achievement.event.eventType == 3 || achievement.event.eventType == 4) {
        return true;
      }
    }
    return false;
  }
}