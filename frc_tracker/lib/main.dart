import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:frc_tracker/models/app_state.dart';
import 'package:frc_tracker/screens/home_screen.dart';
import 'package:frc_tracker/screens/team_storyboard_screen.dart';
import 'package:frc_tracker/services/api_service.dart';
import 'package:frc_tracker/themes/app_theme.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AppState>(
          create: (_) => AppState(),
        ),
        Provider<ApiService>(
          create: (_) => ApiService(),
        ),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'FRC Tracker',
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      debugShowCheckedModeBanner: false,
      initialRoute: '/',
      routes: {
        '/': (context) => const HomeScreen(),
        '/team-storyboard': (context) => const TeamStoryboardScreen(),
      },
    );
  }
}