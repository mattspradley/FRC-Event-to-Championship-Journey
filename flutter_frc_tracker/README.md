# FRC Championship Tracker Mobile App

A comprehensive FIRST Robotics Competition event tracking mobile application that provides advanced performance analytics and real-time insights for teams and event organizers.

## Features

- **Championship Status Tracking**: View which teams have qualified for championships
- **Event Selection**: Browse and select from a database of FRC events
- **Team Performance Analytics**: Track team rankings, win-loss records, and more
- **Team Storyboard**: Visualize a team's journey throughout the season
- **Interactive Data Visualization**: See performance trends and metrics
- **Championship Division Information**: View division assignments and performance data

## Getting Started

### Prerequisites

- [Flutter](https://flutter.dev/docs/get-started/install) (version 2.18.0 or higher)
- [The Blue Alliance API Key](https://www.thebluealliance.com/account) (for data access)
- Android Studio / VS Code with Flutter extensions

### Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/flutter_frc_tracker.git
   ```

2. Navigate to the project directory
   ```
   cd flutter_frc_tracker
   ```

3. Install dependencies
   ```
   flutter pub get
   ```

4. Run the app in debug mode
   ```
   flutter run
   ```

### Setting Up Your API Key

The app requires an API key from The Blue Alliance to fetch data. Upon first launch:

1. You'll be asked to provide your API key
2. Visit [The Blue Alliance](https://www.thebluealliance.com/account) to create an account
3. Generate an API key in your account settings
4. Enter this key in the app when prompted

## Project Structure

```
lib/
├── models/          # Data models
├── screens/         # App screens
├── services/        # API and other services
├── widgets/         # Reusable UI components
└── main.dart        # App entry point
```

## Dependencies

- `provider` - State management
- `http` - API requests
- `fl_chart` - Data visualization
- `flutter_html` - HTML rendering for TBA status messages
- `flutter_secure_storage` - Secure API key storage
- `shared_preferences` - App settings storage
- `intl` - Date formatting
- `url_launcher` - Opening external links
- `package_info_plus` - App version information

## Related Projects

This mobile app is a companion to the [FRC Championship Tracker Web App](https://github.com/yourusername/frc-tracker), providing the same functionality in a native mobile experience.