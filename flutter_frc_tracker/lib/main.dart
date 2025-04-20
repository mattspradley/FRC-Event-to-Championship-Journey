import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_frc_tracker/models/app_state.dart';
import 'package:flutter_frc_tracker/services/api_service.dart';
import 'package:flutter_frc_tracker/screens/splash_screen.dart';
import 'package:flutter_frc_tracker/screens/home_screen.dart';
import 'package:flutter_frc_tracker/screens/team_details_screen.dart';
import 'package:flutter_frc_tracker/screens/team_storyboard_screen.dart';
import 'package:flutter_frc_tracker/screens/event_details_screen.dart';
import 'package:flutter_frc_tracker/screens/settings_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize services
  final prefs = await SharedPreferences.getInstance();
  const secureStorage = FlutterSecureStorage();
  
  runApp(
    MultiProvider(
      providers: [
        // App state provider
        ChangeNotifierProvider(create: (_) => AppState()),
        
        // Service providers
        Provider<SharedPreferences>.value(value: prefs),
        Provider<FlutterSecureStorage>.value(value: secureStorage),
        Provider<ApiService>(
          create: (context) => ApiService(
            baseUrl: 'https://frc-tracker.app', // This should match your production API URL
            secureStorage: secureStorage,
          ),
        ),
      ],
      child: const FRCTrackerApp(),
    ),
  );
}

class FRCTrackerApp extends StatelessWidget {
  const FRCTrackerApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isDarkMode = Provider.of<AppState>(context).isDarkMode;
    
    return MaterialApp(
      title: 'FRC Championship Tracker',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF3949AB),
          brightness: Brightness.light,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF3949AB),
          foregroundColor: Colors.white,
          elevation: 2,
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF3949AB),
          brightness: Brightness.dark,
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: Colors.grey.shade900,
          foregroundColor: Colors.white,
          elevation: 2,
        ),
      ),
      themeMode: isDarkMode ? ThemeMode.dark : ThemeMode.light,
      initialRoute: '/',
      routes: {
        '/': (context) => const SplashScreen(),
        '/home': (context) => const HomeScreen(),
        '/team-details': (context) => const TeamDetailsScreen(),
        '/team-storyboard': (context) => const TeamStoryboardScreen(),
        '/event-details': (context) => const EventDetailsScreen(),
        '/settings': (context) => const SettingsScreen(),
      },
    );
  }
}

// Custom scroll behavior that removes the glow effect on all platforms
class CustomScrollBehavior extends ScrollBehavior {
  @override
  Widget buildOverscrollIndicator(
    BuildContext context,
    Widget child,
    ScrollableDetails details,
  ) {
    return child;
  }
}