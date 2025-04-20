class Team {
  final String key;
  final int teamNumber;
  final String name;
  final String? nickname;
  final String? city;
  final String? stateProv;
  final String? country;
  final int? rookieYear;
  final Map<String, dynamic>? data;

  Team({
    required this.key,
    required this.teamNumber,
    required this.name,
    this.nickname,
    this.city,
    this.stateProv,
    this.country,
    this.rookieYear,
    this.data,
  });

  factory Team.fromJson(Map<String, dynamic> json) {
    return Team(
      key: json['key'],
      teamNumber: json['team_number'],
      name: json['name'],
      nickname: json['nickname'],
      city: json['city'],
      stateProv: json['state_prov'],
      country: json['country'],
      rookieYear: json['rookie_year'],
      data: json['data'] != null ? Map<String, dynamic>.from(json['data']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'key': key,
      'team_number': teamNumber,
      'name': name,
      'nickname': nickname,
      'city': city,
      'state_prov': stateProv,
      'country': country,
      'rookie_year': rookieYear,
      'data': data,
    };
  }

  // Get a nicely formatted display name
  String get displayName {
    if (nickname != null && nickname!.isNotEmpty) {
      return nickname!;
    }
    return name;
  }

  // Gets a nicely formatted location string
  String get formattedLocation {
    final locations = [city, stateProv, country]
        .where((part) => part != null && part.isNotEmpty)
        .join(', ');
    return locations.isEmpty ? 'No location data' : locations;
  }
}

class ChampionshipAward {
  final String name;
  final int awardType;
  final String eventKey;
  final List<Map<String, String?>> recipientList;
  final int year;

  ChampionshipAward({
    required this.name,
    required this.awardType,
    required this.eventKey,
    required this.recipientList,
    required this.year,
  });

  factory ChampionshipAward.fromJson(Map<String, dynamic> json) {
    List<Map<String, String?>> recipients = [];
    if (json['recipient_list'] != null) {
      recipients = (json['recipient_list'] as List)
          .map((recipient) => {
                'team_key': recipient['team_key'] as String?,
                'awardee': recipient['awardee'] as String?,
              })
          .toList();
    }

    return ChampionshipAward(
      name: json['name'],
      awardType: json['award_type'],
      eventKey: json['event_key'],
      recipientList: recipients,
      year: json['year'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'award_type': awardType,
      'event_key': eventKey,
      'recipient_list': recipientList,
      'year': year,
    };
  }
}

enum QualificationStatus {
  qualified,
  waitlist,
  notQualified,
  unknown,
}

class TeamWithStatus {
  final Team team;
  final bool isQualified;
  final int? waitlistPosition;
  final String? championshipLocation;
  final String? division;
  final String? divisionEventKey;
  final String? championshipEventKey;
  final int? championshipRank;
  final String? championshipRecord;
  final List<ChampionshipAward>? championshipAwards;
  final int? divisionTotalTeams;
  
  // Final championship event data
  final String? finalEventKey;
  final String? finalRank;
  final String? finalRecord;
  
  // Current event data
  final int? rank;
  final String? record;
  final int? totalTeams;
  
  // Status messages (HTML content)
  final String? overallStatusStr;
  final String? allianceStatusStr;

  TeamWithStatus({
    required this.team,
    required this.isQualified,
    this.waitlistPosition,
    this.championshipLocation,
    this.division,
    this.divisionEventKey,
    this.championshipEventKey,
    this.championshipRank,
    this.championshipRecord,
    this.championshipAwards,
    this.divisionTotalTeams,
    this.finalEventKey,
    this.finalRank,
    this.finalRecord,
    this.rank,
    this.record,
    this.totalTeams,
    this.overallStatusStr,
    this.allianceStatusStr,
  });

  factory TeamWithStatus.fromJson(Map<String, dynamic> json) {
    // Parse team data
    final team = Team.fromJson(json['team']);
    
    // Parse championship awards if available
    List<ChampionshipAward>? championshipAwards;
    if (json['championship_awards'] != null) {
      championshipAwards = (json['championship_awards'] as List)
          .map((award) => ChampionshipAward.fromJson(award))
          .toList();
    }

    return TeamWithStatus(
      team: team,
      isQualified: json['is_qualified'] ?? false,
      waitlistPosition: json['waitlist_position'],
      championshipLocation: json['championship_location'],
      division: json['division'],
      divisionEventKey: json['division_event_key'],
      championshipEventKey: json['championship_event_key'],
      championshipRank: json['championship_rank'],
      championshipRecord: json['championship_record'],
      championshipAwards: championshipAwards,
      divisionTotalTeams: json['division_total_teams'],
      finalEventKey: json['final_event_key'],
      finalRank: json['final_rank'],
      finalRecord: json['final_record'],
      rank: json['rank'],
      record: json['record'],
      totalTeams: json['total_teams'],
      overallStatusStr: json['overall_status_str'],
      allianceStatusStr: json['alliance_status_str'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'team': team.toJson(),
      'is_qualified': isQualified,
      'waitlist_position': waitlistPosition,
      'championship_location': championshipLocation,
      'division': division,
      'division_event_key': divisionEventKey,
      'championship_event_key': championshipEventKey,
      'championship_rank': championshipRank,
      'championship_record': championshipRecord,
      'championship_awards': championshipAwards?.map((award) => award.toJson()).toList(),
      'division_total_teams': divisionTotalTeams,
      'final_event_key': finalEventKey,
      'final_rank': finalRank,
      'final_record': finalRecord,
      'rank': rank,
      'record': record,
      'total_teams': totalTeams,
      'overall_status_str': overallStatusStr,
      'alliance_status_str': allianceStatusStr,
    };
  }

  // Get the qualification status of the team
  QualificationStatus getQualificationStatus() {
    if (isQualified) {
      return QualificationStatus.qualified;
    } else if (waitlistPosition != null) {
      return QualificationStatus.waitlist;
    } else {
      return QualificationStatus.notQualified;
    }
  }

  // Get status text for display
  String getStatusText() {
    final status = getQualificationStatus();
    
    switch (status) {
      case QualificationStatus.qualified:
        return 'Qualified';
      case QualificationStatus.waitlist:
        return waitlistPosition != null ? 'Waitlist #${waitlistPosition}' : 'Waitlist';
      case QualificationStatus.notQualified:
        return 'Not Qualified';
      case QualificationStatus.unknown:
        return 'Unknown';
    }
  }
}