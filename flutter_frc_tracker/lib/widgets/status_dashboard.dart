import 'package:flutter/material.dart';
import 'package:flutter_frc_tracker/models/team.dart';

class StatusDashboard extends StatelessWidget {
  final List<TeamWithStatus> teams;

  const StatusDashboard({
    Key? key,
    required this.teams,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final statusCounts = _getStatusCounts(teams);

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Championship Status',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _buildStatusCard(
                context,
                'Qualified',
                statusCounts['qualified'] ?? 0,
                teams.length,
                Colors.green,
              ),
              const SizedBox(width: 10),
              _buildStatusCard(
                context,
                'Waitlist',
                statusCounts['waitlist'] ?? 0,
                teams.length,
                Colors.amber,
              ),
              const SizedBox(width: 10),
              _buildStatusCard(
                context,
                'Not Qualified',
                statusCounts['not-qualified'] ?? 0,
                teams.length,
                Colors.red,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCard(
    BuildContext context,
    String title,
    int count,
    int total,
    Color color,
  ) {
    final percentage = total > 0 ? (count / total * 100).round() : 0;

    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  title == 'Qualified'
                      ? Icons.check_circle
                      : title == 'Waitlist'
                          ? Icons.hourglass_top
                          : Icons.cancel,
                  size: 18,
                  color: color,
                ),
                const SizedBox(width: 6),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: color,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              count.toString(),
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              '$percentage%',
              style: TextStyle(
                fontSize: 14,
                color: color.withOpacity(0.8),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Map<String, int> _getStatusCounts(List<TeamWithStatus> teams) {
    final Map<String, int> counts = {
      'qualified': 0,
      'waitlist': 0,
      'not-qualified': 0,
    };

    for (final team in teams) {
      final status = team.getQualificationStatus();
      switch (status) {
        case QualificationStatus.qualified:
          counts['qualified'] = (counts['qualified'] ?? 0) + 1;
          break;
        case QualificationStatus.waitlist:
          counts['waitlist'] = (counts['waitlist'] ?? 0) + 1;
          break;
        case QualificationStatus.notQualified:
          counts['not-qualified'] = (counts['not-qualified'] ?? 0) + 1;
          break;
        case QualificationStatus.unknown:
          counts['not-qualified'] = (counts['not-qualified'] ?? 0) + 1;
          break;
      }
    }

    return counts;
  }
}