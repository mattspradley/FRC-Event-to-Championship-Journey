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

  factory TeamAchievement.fromJson(Map<String, dynamic> json) {
    return TeamAchievement(
      teamKey: json['teamKey'],
      teamNumber: json['teamNumber'],
      teamName: json['teamName'],
      teamNickname: json['teamNickname'],
      rookieYear: json['rookieYear'],
      year: json['year'],
      achievements: (json['achievements'] as List)
          .map((achievement) => Achievement.fromJson(achievement))
          .toList(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'teamKey': teamKey,
      'teamNumber': teamNumber,
      'teamName': teamName,
      'teamNickname': teamNickname,
      'rookieYear': rookieYear,
      'year': year,
      'achievements': achievements.map((achievement) => achievement.toJson()).toList(),
    };
  }
}

class Achievement {
  final AchievementEvent event;
  final PerformanceData? performance;
  final dynamic status;
  final List<dynamic> awards;
  final String allianceStatusHtml;
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

  factory Achievement.fromJson(Map<String, dynamic> json) {
    return Achievement(
      event: AchievementEvent.fromJson(json['event']),
      performance: json['performance'] != null
          ? PerformanceData.fromJson(json['performance'])
          : null,
      status: json['status'],
      awards: json['awards'] as List<dynamic>,
      allianceStatusHtml: json['allianceStatusHtml'] ?? '',
      overallStatusHtml: json['overallStatusHtml'] ?? '',
      error: json['error'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'event': event.toJson(),
      'performance': performance?.toJson(),
      'status': status,
      'awards': awards,
      'allianceStatusHtml': allianceStatusHtml,
      'overallStatusHtml': overallStatusHtml,
      'error': error,
    };
  }
}

class AchievementEvent {
  final String key;
  final String name;
  final String? shortName;
  final String startDate;
  final String endDate;
  final int eventType;
  final String eventTypeString;
  final String? city;
  final String? stateProv;
  final String? country;

  AchievementEvent({
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

  factory AchievementEvent.fromJson(Map<String, dynamic> json) {
    return AchievementEvent(
      key: json['key'],
      name: json['name'],
      shortName: json['short_name'],
      startDate: json['startDate'],
      endDate: json['endDate'],
      eventType: json['eventType'],
      eventTypeString: json['eventTypeString'],
      city: json['city'],
      stateProv: json['stateProv'],
      country: json['country'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'key': key,
      'name': name,
      'short_name': shortName,
      'startDate': startDate,
      'endDate': endDate,
      'eventType': eventType,
      'eventTypeString': eventTypeString,
      'city': city,
      'stateProv': stateProv,
      'country': country,
    };
  }
}

class PerformanceData {
  final int rank;
  final int totalTeams;
  final String record;
  final String? eventName;

  PerformanceData({
    required this.rank,
    required this.totalTeams,
    required this.record,
    this.eventName,
  });

  factory PerformanceData.fromJson(Map<String, dynamic> json) {
    return PerformanceData(
      rank: json['rank'],
      totalTeams: json['totalTeams'],
      record: json['record'],
      eventName: json['eventName'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'rank': rank,
      'totalTeams': totalTeams,
      'record': record,
      'eventName': eventName,
    };
  }
}