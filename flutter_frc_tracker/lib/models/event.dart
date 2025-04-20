import 'package:intl/intl.dart';

class Event {
  final String key;
  final String name;
  final String? shortName;
  final int eventType;
  final String? eventTypeString;
  final int year;
  final String? startDate;
  final String? endDate;
  final String? city;
  final String? stateProv;
  final String? country;

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
  });

  factory Event.fromJson(Map<String, dynamic> json) {
    return Event(
      key: json['key'],
      name: json['name'],
      shortName: json['short_name'],
      eventType: json['event_type'],
      eventTypeString: json['event_type_string'],
      year: json['year'],
      startDate: json['start_date'],
      endDate: json['end_date'],
      city: json['city'],
      stateProv: json['state_prov'],
      country: json['country'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'key': key,
      'name': name,
      'short_name': shortName,
      'event_type': eventType,
      'event_type_string': eventTypeString,
      'year': year,
      'start_date': startDate,
      'end_date': endDate,
      'city': city,
      'state_prov': stateProv,
      'country': country,
    };
  }

  // Gets a nicely formatted location string
  String get formattedLocation {
    final locations = [city, stateProv, country]
        .where((part) => part != null && part.isNotEmpty)
        .join(', ');
    return locations.isEmpty ? 'No location data' : locations;
  }

  // Gets a nicely formatted date range
  String get formattedDateRange {
    if (startDate == null || endDate == null) {
      return 'Dates unknown';
    }

    final start = DateFormat('yyyy-MM-dd').parse(startDate!);
    final end = DateFormat('yyyy-MM-dd').parse(endDate!);
    final formatter = DateFormat('MMM d');
    
    // If the dates are in the same month
    if (start.month == end.month && start.year == end.year) {
      return '${formatter.format(start)} - ${DateFormat('d, y').format(end)}';
    }
    
    // If the dates are in different months but the same year
    if (start.year == end.year) {
      return '${formatter.format(start)} - ${formatter.format(end)}, ${start.year}';
    }
    
    // If the dates are in different years
    return '${formatter.format(start)}, ${start.year} - ${formatter.format(end)}, ${end.year}';
  }

  // Determine if the event is ongoing
  bool get isOngoing {
    if (startDate == null || endDate == null) return false;
    
    final now = DateTime.now();
    final start = DateFormat('yyyy-MM-dd').parse(startDate!);
    final end = DateFormat('yyyy-MM-dd').parse(endDate!);
    
    // Add a day to the end date to include the full day
    final adjustedEnd = end.add(const Duration(days: 1));
    
    return now.isAfter(start) && now.isBefore(adjustedEnd);
  }

  // Determine if the event is in the future
  bool get isFuture {
    if (startDate == null) return false;
    
    final now = DateTime.now();
    final start = DateFormat('yyyy-MM-dd').parse(startDate!);
    
    return now.isBefore(start);
  }

  // Determine if the event has ended
  bool get hasEnded {
    if (endDate == null) return false;
    
    final now = DateTime.now();
    final end = DateFormat('yyyy-MM-dd').parse(endDate!);
    
    // Add a day to the end date to include the full day
    final adjustedEnd = end.add(const Duration(days: 1));
    
    return now.isAfter(adjustedEnd);
  }
}