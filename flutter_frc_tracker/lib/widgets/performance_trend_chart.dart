import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_frc_tracker/models/team_achievement.dart';

class PerformanceTrendChart extends StatelessWidget {
  final List<PerformanceData> performanceData;

  const PerformanceTrendChart({
    Key? key,
    required this.performanceData,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (performanceData.isEmpty) {
      return const Center(
        child: Text('No performance data available'),
      );
    }

    // Sort data by event date
    final sortedData = List<PerformanceData>.from(performanceData);
    // Note: Assuming events are already in chronological order in the list

    // Calculate percentile ranks for each performance
    final percentileRanks = sortedData.map((perf) {
      final percentile = perf.totalTeams > 0
          ? (perf.totalTeams - perf.rank) / perf.totalTeams * 100
          : 0.0;
      return percentile;
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Chart container
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8),
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  horizontalInterval: 25,
                  drawVerticalLine: true,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withOpacity(0.3),
                      strokeWidth: 1,
                    );
                  },
                  getDrawingVerticalLine: (value) {
                    return FlLine(
                      color: Colors.grey.withOpacity(0.2),
                      strokeWidth: 1,
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 30,
                      getTitlesWidget: (value, meta) {
                        final index = value.toInt();
                        if (index < 0 || index >= sortedData.length) {
                          return const SizedBox.shrink();
                        }
                        // Use short name or compact event name for bottom titles
                        final eventName = _getShortEventName(
                          sortedData[index].eventName ?? '',
                        );
                        return Padding(
                          padding: const EdgeInsets.only(top: 5),
                          child: Text(
                            eventName,
                            style: const TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 25,
                      reservedSize: 40,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          '${value.toInt()}%',
                          style: const TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        );
                      },
                    ),
                  ),
                  rightTitles: AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  topTitles: AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                ),
                borderData: FlBorderData(
                  show: true,
                  border: Border(
                    left: BorderSide(
                      color: Colors.grey.withOpacity(0.5),
                      width: 1,
                    ),
                    bottom: BorderSide(
                      color: Colors.grey.withOpacity(0.5),
                      width: 1,
                    ),
                  ),
                ),
                minX: 0,
                maxX: sortedData.length - 1.0,
                minY: 0,
                maxY: 100,
                lineTouchData: LineTouchData(
                  touchTooltipData: LineTouchTooltipData(
                    tooltipBgColor: Colors.blueGrey.withOpacity(0.8),
                    getTooltipItems: (List<LineBarSpot> touchedSpots) {
                      return touchedSpots.map((spot) {
                        final index = spot.x.toInt();
                        final performance = sortedData[index];
                        return LineTooltipItem(
                          '${performance.eventName}\n'
                          'Rank: ${performance.rank} of ${performance.totalTeams}\n'
                          'Record: ${performance.record}',
                          const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        );
                      }).toList();
                    },
                  ),
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: List.generate(
                      percentileRanks.length,
                      (index) => FlSpot(index.toDouble(), percentileRanks[index]),
                    ),
                    isCurved: false,
                    color: Theme.of(context).colorScheme.primary,
                    barWidth: 4,
                    isStrokeCapRound: true,
                    dotData: FlDotData(
                      show: true,
                      getDotPainter: (spot, percent, barData, index) {
                        return FlDotCirclePainter(
                          radius: 6,
                          color: Theme.of(context).colorScheme.primary,
                          strokeWidth: 2,
                          strokeColor: Colors.white,
                        );
                      },
                    ),
                    belowBarData: BarAreaData(
                      show: true,
                      color: Theme.of(context).colorScheme.primary.withOpacity(0.2),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        
        // Legend
        Padding(
          padding: const EdgeInsets.only(top: 16, left: 8, right: 8),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primary,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 8),
              const Text(
                'Percentile Rank (higher is better)',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  String _getShortEventName(String fullName) {
    // Convert event names like "FIRST Robotics Competition Southwest..."
    // to shorter versions like "SW" or "STL" or use acronyms
    if (fullName.isEmpty) return "";
    
    // Try to extract location
    final words = fullName.split(' ');
    if (words.length <= 2) return fullName;
    
    // Check for common patterns
    if (fullName.contains('Regional')) {
      // Find the word before "Regional"
      final index = words.indexOf('Regional');
      if (index > 0) {
        return words[index - 1];
      }
    }
    
    if (fullName.contains('District')) {
      // Find the word before "District"
      final index = words.indexOf('District');
      if (index > 0) {
        return words[index - 1];
      }
    }
    
    if (fullName.contains('Championship')) {
      // Find the word before "Championship"
      final index = words.indexOf('Championship');
      if (index > 0) {
        return words[index - 1];
      }
    }
    
    // If we couldn't find a pattern, use the first letters of main words
    final acronym = words
        .where((word) => word.length > 3 && !_isCommonWord(word))
        .map((word) => word[0])
        .join('');
    
    if (acronym.length >= 2) {
      return acronym;
    }
    
    // Last resort: first two words
    return words.take(2).join(' ');
  }

  bool _isCommonWord(String word) {
    const commonWords = [
      'the', 'and', 'for', 'with', 'first', 'robotics', 'competition',
      'event', 'presented', 'sponsored', 'by', 'at', 'in',
    ];
    return commonWords.contains(word.toLowerCase());
  }
}