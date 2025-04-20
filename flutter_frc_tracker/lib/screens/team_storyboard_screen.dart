import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_frc_tracker/models/app_state.dart';
import 'package:flutter_frc_tracker/models/team_achievement.dart';
import 'package:flutter_frc_tracker/services/api_service.dart';
import 'package:flutter_frc_tracker/widgets/achievement_card.dart';
import 'package:flutter_frc_tracker/widgets/team_info_card.dart';
import 'package:flutter_frc_tracker/widgets/loading_indicator.dart';
import 'package:flutter_frc_tracker/widgets/error_message.dart';
import 'package:flutter_frc_tracker/widgets/performance_trend_chart.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:url_launcher/url_launcher.dart';

class TeamStoryboardScreen extends StatefulWidget {
  const TeamStoryboardScreen({Key? key}) : super(key: key);

  @override
  State<TeamStoryboardScreen> createState() => _TeamStoryboardScreenState();
}

class _TeamStoryboardScreenState extends State<TeamStoryboardScreen> {
  final TextEditingController _teamNumberController = TextEditingController();
  int? _teamNumber;
  int _selectedYear = DateTime.now().year;
  bool _isLoading = false;
  String? _errorMessage;
  TeamAchievement? _teamAchievement;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _handleRouteArguments();
    });
  }

  @override
  void dispose() {
    _teamNumberController.dispose();
    super.dispose();
  }

  void _handleRouteArguments() {
    final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args != null) {
      final teamNumber = args['teamNumber'] as int?;
      final year = args['year'] as int?;
      
      if (teamNumber != null) {
        _teamNumber = teamNumber;
        _teamNumberController.text = teamNumber.toString();
      }
      
      if (year != null) {
        _selectedYear = year;
      }
      
      if (teamNumber != null) {
        _loadTeamAchievements();
      }
    }
  }

  Future<void> _loadTeamAchievements() async {
    if (_teamNumber == null) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _teamAchievement = null;
    });

    try {
      final apiService = Provider.of<ApiService>(context, listen: false);
      final achievements = await apiService.getTeamAchievements(_teamNumber!, _selectedYear);
      
      if (mounted) {
        setState(() {
          _teamAchievement = achievements;
          _isLoading = false;
        });
        
        // Also update in app state
        final appState = Provider.of<AppState>(context, listen: false);
        appState.teamAchievement = achievements;
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Error loading team achievements: $e';
        });
      }
    }
  }

  void _onYearChanged(int? year) {
    if (year != null) {
      setState(() {
        _selectedYear = year;
      });
      _loadTeamAchievements();
    }
  }

  void _onSubmitTeamNumber() {
    final teamNumber = int.tryParse(_teamNumberController.text);
    if (teamNumber != null) {
      setState(() {
        _teamNumber = teamNumber;
      });
      _loadTeamAchievements();
    } else {
      setState(() {
        _errorMessage = 'Please enter a valid team number';
      });
    }
  }

  List<PerformanceData> _getPerformanceData() {
    if (_teamAchievement == null) return [];
    
    final performanceData = <PerformanceData>[];
    for (final achievement in _teamAchievement!.achievements) {
      if (achievement.performance != null) {
        performanceData.add(achievement.performance!);
      }
    }
    return performanceData;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Team Storyboard'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadTeamAchievements,
          ),
        ],
      ),
      body: Column(
        children: [
          // Team and year selector
          Container(
            padding: const EdgeInsets.all(16),
            color: Theme.of(context).colorScheme.surface,
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: TextField(
                        controller: _teamNumberController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Team Number',
                          hintText: 'e.g. 1678',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                          suffixIcon: IconButton(
                            icon: const Icon(Icons.search),
                            onPressed: _onSubmitTeamNumber,
                          ),
                        ),
                        onSubmitted: (_) => _onSubmitTeamNumber(),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      flex: 2,
                      child: DropdownButtonFormField<int>(
                        value: _selectedYear,
                        decoration: InputDecoration(
                          labelText: 'Year',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        items: [
                          for (int year = DateTime.now().year; year >= 2021; year--)
                            DropdownMenuItem(
                              value: year,
                              child: Text(year.toString()),
                            ),
                        ],
                        onChanged: _onYearChanged,
                      ),
                    ),
                  ],
                ),
                if (_errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.error,
                        fontSize: 14,
                      ),
                    ),
                  ),
              ],
            ),
          ),
          
          // Loading indicator
          if (_isLoading)
            const Expanded(child: LoadingIndicator())
          
          // Team achievement content
          else if (_teamAchievement != null)
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Team info card
                    TeamInfoCard(
                      teamAchievement: _teamAchievement!,
                      onViewWebsite: () {
                        final url = 'https://www.thebluealliance.com/team/${_teamAchievement!.teamNumber}/${_selectedYear}';
                        launchUrl(Uri.parse(url));
                      },
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Performance trend
                    if (_getPerformanceData().isNotEmpty) ...[
                      Text(
                        'Performance Trend',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 200,
                        child: PerformanceTrendChart(
                          performanceData: _getPerformanceData(),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                    
                    // Season journey
                    Text(
                      'Season Journey',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    const SizedBox(height: 16),
                    
                    // Achievement cards
                    ListView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _teamAchievement!.achievements.length,
                      itemBuilder: (context, index) {
                        final achievement = _teamAchievement!.achievements[index];
                        return AchievementCard(
                          achievement: achievement,
                          isFirst: index == 0,
                          isLast: index == _teamAchievement!.achievements.length - 1,
                        );
                      },
                    ),
                  ],
                ),
              ),
            )
          
          // No team selected message
          else
            const Expanded(
              child: Center(
                child: Text(
                  'Enter a team number and year to view season journey',
                  style: TextStyle(fontSize: 16, color: Colors.grey),
                ),
              ),
            ),
        ],
      ),
    );
  }
}