import 'package:flutter/material.dart';
import 'package:flutter_frc_tracker/models/team.dart';
import 'package:flutter_frc_tracker/widgets/team_card.dart';

class TeamsList extends StatelessWidget {
  final List<TeamWithStatus> teams;
  final int eventYear;

  const TeamsList({
    Key? key,
    required this.teams,
    required this.eventYear,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (teams.isEmpty) {
      return const Center(
        child: Text(
          'No teams found',
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 12),
      itemCount: teams.length,
      itemBuilder: (context, index) {
        final team = teams[index];
        return TeamCard(
          team: team,
          eventYear: eventYear,
        );
      },
    );
  }
}