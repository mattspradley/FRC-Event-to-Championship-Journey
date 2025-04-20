import 'package:json_annotation/json_annotation.dart';

part 'team.g.dart';

@JsonSerializable(explicitToJson: true)
class Team {
  final String key;
  @JsonKey(name: 'team_number')
  final int teamNumber;
  final String name;
  final String? nickname;
  final String? city;
  @JsonKey(name: 'state_prov')
  final String? stateProv;
  final String? country;
  @JsonKey(name: 'rookie_year')
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

  factory Team.fromJson(Map<String, dynamic> json) => _$TeamFromJson(json);

  Map<String, dynamic> toJson() => _$TeamToJson(this);

  // Get the team's display name (nickname if available, otherwise name)
  String get displayName => nickname != null && nickname!.isNotEmpty ? nickname! : name;

  // Format location for display
  String get formattedLocation {
    final parts = [city, stateProv, country].where((part) => part != null && part.isNotEmpty).toList();
    return parts.isEmpty ? 'Location unavailable' : parts.join(', ');
  }

  // Get years of experience
  int get yearsOfExperience {
    if (rookieYear == null) return 0;
    return DateTime.now().year - rookieYear!;
  }
}

@JsonSerializable(explicitToJson: true)
class ChampionshipAward {
  final String name;
  @JsonKey(name: 'award_type')
  final int awardType;
  @JsonKey(name: 'event_key')
  final String eventKey;
  @JsonKey(name: 'recipient_list')
  final List<AwardRecipient> recipientList;
  final int year;

  ChampionshipAward({
    required this.name,
    required this.awardType,
    required this.eventKey,
    required this.recipientList,
    required this.year,
  });

  factory ChampionshipAward.fromJson(Map<String, dynamic> json) => _$ChampionshipAwardFromJson(json);

  Map<String, dynamic> toJson() => _$ChampionshipAwardToJson(this);
}

@JsonSerializable(explicitToJson: true)
class AwardRecipient {
  @JsonKey(name: 'team_key')
  final String? teamKey;
  final String? awardee;

  AwardRecipient({
    this.teamKey,
    this.awardee,
  });

  factory AwardRecipient.fromJson(Map<String, dynamic> json) => _$AwardRecipientFromJson(json);

  Map<String, dynamic> toJson() => _$AwardRecipientToJson(this);
}

@JsonSerializable(explicitToJson: true)
class TeamWithStatus {
  final Team team;
  @JsonKey(name: 'isQualified')
  final bool isQualified;
  @JsonKey(name: 'waitlistPosition')
  final int? waitlistPosition;
  @JsonKey(name: 'championshipLocation')
  final String? championshipLocation;
  @JsonKey(name: 'division')
  final String? division;
  @JsonKey(name: 'divisionEventKey')
  final String? divisionEventKey;
  @JsonKey(name: 'championshipEventKey')
  final String? championshipEventKey;
  @JsonKey(name: 'championshipRank')
  final int? championshipRank;
  @JsonKey(name: 'championshipRecord')
  final String? championshipRecord;
  @JsonKey(name: 'championshipAwards')
  final List<ChampionshipAward>? championshipAwards;
  @JsonKey(name: 'divisionTotalTeams')
  final int? divisionTotalTeams;
  @JsonKey(name: 'finalEventKey')
  final String? finalEventKey;
  @JsonKey(name: 'finalRank')
  final String? finalRank;
  @JsonKey(name: 'finalRecord')
  final String? finalRecord;
  @JsonKey(name: 'rank')
  final int? rank;
  @JsonKey(name: 'record')
  final String? record;
  @JsonKey(name: 'totalTeams')
  final int? totalTeams;
  @JsonKey(name: 'overall_status_str')
  final String? overallStatusStr;
  @JsonKey(name: 'alliance_status_str')
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

  factory TeamWithStatus.fromJson(Map<String, dynamic> json) => _$TeamWithStatusFromJson(json);

  Map<String, dynamic> toJson() => _$TeamWithStatusToJson(this);

  // Get team's qualification status
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
        return waitlistPosition != null ? 'Waitlist #$waitlistPosition' : 'Waitlist';
      case QualificationStatus.notQualified:
        return 'Not Qualified';
      case QualificationStatus.unknown:
        return 'Unknown';
    }
  }
}

enum QualificationStatus {
  qualified,
  waitlist,
  notQualified,
  unknown,
}