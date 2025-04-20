import 'package:flutter/material.dart';

class AppTheme {
  // Colors
  static const Color primaryColor = Color(0xFF3949AB);
  static const Color accentColor = Color(0xFF5C6BC0);
  static const Color backgroundColor = Color(0xFFF5F5F5);
  static const Color cardColor = Colors.white;
  static const Color textColor = Color(0xFF333333);
  static const Color secondaryTextColor = Color(0xFF666666);
  static const Color dividerColor = Color(0xFFEEEEEE);
  
  // Status Colors
  static const Color successColor = Color(0xFF4CAF50);
  static const Color warningColor = Color(0xFFFFC107);
  static const Color errorColor = Color(0xFFF44336);
  static const Color infoColor = Color(0xFF2196F3);

  // Light Theme
  static final ThemeData lightTheme = ThemeData(
    colorScheme: ColorScheme.light(
      primary: primaryColor,
      secondary: accentColor,
      surface: cardColor,
      background: backgroundColor,
      error: errorColor,
    ),
    scaffoldBackgroundColor: backgroundColor,
    cardTheme: CardTheme(
      color: cardColor,
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
      ),
    ),
    appBarTheme: AppBarTheme(
      elevation: 0,
      backgroundColor: primaryColor,
      titleTextStyle: TextStyle(
        color: Colors.white,
        fontSize: 20,
        fontWeight: FontWeight.bold,
      ),
      iconTheme: IconThemeData(color: Colors.white),
    ),
    textTheme: TextTheme(
      headlineMedium: TextStyle(
        color: textColor,
        fontSize: 22,
        fontWeight: FontWeight.bold,
      ),
      titleLarge: TextStyle(
        color: textColor,
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
      bodyLarge: TextStyle(
        color: textColor,
        fontSize: 16,
      ),
      bodyMedium: TextStyle(
        color: secondaryTextColor,
        fontSize: 14,
      ),
    ),
    dividerTheme: DividerThemeData(
      color: dividerColor,
      thickness: 1,
    ),
    buttonTheme: ButtonThemeData(
      buttonColor: primaryColor,
      textTheme: ButtonTextTheme.primary,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: primaryColor,
        side: BorderSide(color: primaryColor),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: primaryColor,
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: accentColor,
      foregroundColor: Colors.white,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: dividerColor,
      labelStyle: TextStyle(color: textColor),
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
    ),
  );

  // Dark Theme
  static final ThemeData darkTheme = ThemeData.dark().copyWith(
    colorScheme: ColorScheme.dark(
      primary: primaryColor,
      secondary: accentColor,
      surface: Color(0xFF303030),
      background: Color(0xFF121212),
      error: errorColor,
    ),
    scaffoldBackgroundColor: Color(0xFF121212),
    cardTheme: CardTheme(
      color: Color(0xFF1E1E1E),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(10),
      ),
    ),
    appBarTheme: AppBarTheme(
      elevation: 0,
      backgroundColor: Color(0xFF1E1E1E),
      titleTextStyle: TextStyle(
        color: Colors.white,
        fontSize: 20,
        fontWeight: FontWeight.bold,
      ),
      iconTheme: IconThemeData(color: Colors.white),
    ),
    textTheme: TextTheme(
      headlineMedium: TextStyle(
        color: Colors.white,
        fontSize: 22,
        fontWeight: FontWeight.bold,
      ),
      titleLarge: TextStyle(
        color: Colors.white,
        fontSize: 18,
        fontWeight: FontWeight.bold,
      ),
      bodyLarge: TextStyle(
        color: Colors.white,
        fontSize: 16,
      ),
      bodyMedium: TextStyle(
        color: Colors.grey[300],
        fontSize: 14,
      ),
    ),
    dividerTheme: DividerThemeData(
      color: Color(0xFF424242),
      thickness: 1,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: accentColor,
        side: BorderSide(color: accentColor),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: accentColor,
      ),
    ),
    floatingActionButtonTheme: FloatingActionButtonThemeData(
      backgroundColor: accentColor,
      foregroundColor: Colors.white,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: Color(0xFF424242),
      labelStyle: TextStyle(color: Colors.white),
      padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
    ),
  );
}