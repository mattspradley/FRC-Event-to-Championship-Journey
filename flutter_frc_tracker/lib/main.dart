import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_frc_tracker/services/api_service.dart';
import 'package:flutter_frc_tracker/models/app_state.dart';
import 'package:flutter_frc_tracker/themes/app_theme.dart';
import 'package:flutter_frc_tracker/screens/splash_screen.dart';
import 'package:flutter_frc_tracker/screens/home_screen.dart';
import 'package:flutter_frc_tracker/screens/team_storyboard_screen.dart';
import 'package:flutter_frc_tracker/screens/event_details_screen.dart';
import 'package:flutter_frc_tracker/screens/team_details_screen.dart';
import 'package:flutter_frc_tracker/screens/settings_screen.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  // Ensure Flutter is initialized
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize SharedPreferences
  final prefs = await SharedPreferences.getInstance();
  
  // Initialize FlutterSecureStorage for API keys
  const secureStorage = FlutterSecureStorage();
  
  // Check if API key exists
  String? apiKey = await secureStorage.read(key: 'TBA_API_KEY');
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AppState>(
          create: (_) => AppState(),
        ),
        Provider<ApiService>(
          create: (_) => ApiService(
            apiKey: apiKey,
            secureStorage: secureStorage,
          ),
        ),
        Provider<SharedPreferences>.value(value: prefs),
      ],
      child: const FRCTrackerApp(),
    ),
  );
}

class FRCTrackerApp extends StatelessWidget {
  const FRCTrackerApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FRC Championship Tracker',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      debugShowCheckedModeBanner: false,
      initialRoute: '/splash',
      routes: {
        '/splash': (context) => const SplashScreen(),
        '/home': (context) => const HomeScreen(),
        '/team-storyboard': (context) => const TeamStoryboardScreen(),
        '/event-details': (context) => const EventDetailsScreen(),
        '/team-details': (context) => const TeamDetailsScreen(),
        '/settings': (context) => const SettingsScreen(),
      },
    );
  }
}