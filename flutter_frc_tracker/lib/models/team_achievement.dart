import 'package:json_annotation/json_annotation.dart';

part 'team_achievement.g.dart';

@JsonSerializable(explicitToJson: true)
class TeamAchievement {
  final String teamKey;
  final int teamNumber;
  final String teamName;
  final String? teamNickname;
  final int? rookieYear;
  final int year;
  final List<Achievement> achievements;

  TeamAchievement({
    required this.teamKey,
    required this.teamNumber,
    required this.teamName,
    this.teamNickname,
    this.rookieYear,
    required this.year,
    required this.achievements,
  });

  factory TeamAchievement.fromJson(Map<String, dynamic> json) => _$TeamAchievementFromJson(json);

  Map<String, dynamic> toJson() => _$TeamAchievementToJson(this);

  // Get the team's display name (nickname if available, otherwise name)
  String get displayName => teamNickname != null && teamNickname!.isNotEmpty ? teamNickname! : teamName;

  // Get years of experience
  int get yearsOfExperience {
    if (rookieYear == null) return 0;
    return DateTime.now().year - rookieYear!;
  }
}

@JsonSerializable(explicitToJson: true)
class Achievement {
  final EventSummary event;
  final PerformanceData? performance;
  final dynamic status;
  final List<AwardData> awards;
  @JsonKey(name: 'allianceStatusHtml')
  final String allianceStatusHtml;
  @JsonKey(name: 'overallStatusHtml')
  final String overallStatusHtml;
  final String? error;

  Achievement({
    required this.event,
    this.performance,
    this.status,
    required this.awards,
    required this.allianceStatusHtml,
    required this.overallStatusHtml,
    this.error,
  });

  factory Achievement.fromJson(Map<String, dynamic> json) => _$AchievementFromJson(json);

  Map<String, dynamic> toJson() => _$AchievementToJson(this);
}

@JsonSerializable(explicitToJson: true)
class EventSummary {
  final String key;
  final String name;
  @JsonKey(name: 'short_name')
  final String? shortName;
  @JsonKey(name: 'startDate')
  final String startDate;
  @JsonKey(name: 'endDate')
  final String endDate;
  @JsonKey(name: 'eventType')
  final int eventType;
  @JsonKey(name: 'eventTypeString')
  final String eventTypeString;
  final String? city;
  @JsonKey(name: 'stateProv')
  final String? stateProv;
  final String? country;

  EventSummary({
    required this.key,
    required this.name,
    this.shortName,
    required this.startDate,
    required this.endDate,
    required this.eventType,
    required this.eventTypeString,
    this.city,
    this.stateProv,
    this.country,
  });

  factory EventSummary.fromJson(Map<String, dynamic> json) => _$EventSummaryFromJson(json);

  Map<String, dynamic> toJson() => _$EventSummaryToJson(this);

  // Format location for display
  String get formattedLocation {
    final parts = [city, stateProv, country].where((part) => part != null && part.isNotEmpty).toList();
    return parts.isEmpty ? 'Location TBA' : parts.join(', ');
  }

  // Get event type display name
  String get eventTypeDisplay {
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
      default: return eventTypeString;
    }
  }

  // Check if the event is a championship
  bool get isChampionship => eventType == 4;

  // Check if the event is a division
  bool get isDivision => eventType == 3;

  // Check if the event is an official event
  bool get isOfficial => eventType <= 5;
}

@JsonSerializable(explicitToJson: true)
class PerformanceData {
  final int rank;
  final int totalTeams;
  final String record;

  PerformanceData({
    required this.rank,
    required this.totalTeams,
    required this.record,
  });

  factory PerformanceData.fromJson(Map<String, dynamic> json) => _$PerformanceDataFromJson(json);

  Map<String, dynamic> toJson() => _$PerformanceDataToJson(this);

  // Calculate percentile
  double get percentile {
    return (1 - (rank / totalTeams)) * 100;
  }
}

@JsonSerializable(explicitToJson: true)
class AwardData {
  final String name;

  AwardData({
    required this.name,
  });

  factory AwardData.fromJson(Map<String, dynamic> json) => _$AwardDataFromJson(json);

  Map<String, dynamic> toJson() => _$AwardDataToJson(this);
}