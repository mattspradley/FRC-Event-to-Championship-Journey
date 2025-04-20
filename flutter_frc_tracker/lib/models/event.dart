import 'package:json_annotation/json_annotation.dart';

part 'event.g.dart';

@JsonSerializable(explicitToJson: true)
class Event {
  final String key;
  final String name;
  @JsonKey(name: 'short_name')
  final String? shortName;
  @JsonKey(name: 'event_type')
  final int eventType;
  @JsonKey(name: 'event_type_string')
  final String? eventTypeString;
  final int year;
  @JsonKey(name: 'start_date')
  final String? startDate;
  @JsonKey(name: 'end_date')
  final String? endDate;
  final String? city;
  @JsonKey(name: 'state_prov')
  final String? stateProv;
  final String? country;
  final String? address;

  Event({
    required this.key,
    required this.name,
    this.shortName,
    required this.eventType,
    this.eventTypeString,
    required this.year,
    this.startDate,
    this.endDate,
    this.city,
    this.stateProv,
    this.country,
    this.address,
  });

  factory Event.fromJson(Map<String, dynamic> json) => _$EventFromJson(json);

  Map<String, dynamic> toJson() => _$EventToJson(this);

  // Format date range for display
  String get formattedDateRange {
    if (startDate == null || endDate == null) {
      return 'Dates TBA';
    }
    return '$startDate to $endDate';
  }

  // Format location for display
  String get formattedLocation {
    final parts = [city, stateProv, country].where((part) => part != null && part.isNotEmpty).toList();
    return parts.isEmpty ? 'Location TBA' : parts.join(', ');
  }

  // Check if the event is a championship
  bool get isChampionship => eventType == 4;

  // Check if the event is a division
  bool get isDivision => eventType == 3;

  // Check if the event is an official event
  bool get isOfficial => eventType <= 5;

  // Check if the event has already taken place
  bool get hasEnded {
    if (endDate == null) return false;
    final now = DateTime.now();
    final end = DateTime.parse(endDate!);
    return end.isBefore(now);
  }

  // Check if the event is currently happening
  bool get isOngoing {
    if (startDate == null || endDate == null) return false;
    final now = DateTime.now();
    final start = DateTime.parse(startDate!);
    final end = DateTime.parse(endDate!);
    return now.isAfter(start) && now.isBefore(end.add(const Duration(days: 1)));
  }

  // Check if the event is in the future
  bool get isFuture {
    if (startDate == null) return false;
    final now = DateTime.now();
    final start = DateTime.parse(startDate!);
    return start.isAfter(now);
  }
}