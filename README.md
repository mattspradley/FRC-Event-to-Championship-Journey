# FIRST Robotics Championship Tracker

A comprehensive platform for tracking FIRST Robotics Competition teams and their championship qualification status.

## Features

- Select events and view all participating teams
- See team championship qualification status (qualified, waitlisted, or not qualified)
- View detailed team information and performance metrics
- Track a team's journey throughout the season with the Team Storyboard feature
- Built-in version tracking and analytics

## Deployment

This project is designed to be deployed on Replit. To deploy:

1. Click the "Deploy" button in the Replit interface
2. Replit will automatically run the deployment process:
   - The `deploy.sh` script will set version variables
   - The application will be built with `npm run build`
   - The server will start with `npm run start`

### Automatic Version Updates

The version information is automatically updated during each deployment:

- **App Version**: Read from package.json
- **Build Number**: Generated based on the current date (YYYYMMDD.n format)
- **Commit Hash**: Pulled from the Git repository
- **Build Date**: Set to the deployment date
- **Release Tag**: Based on Git tags if available, or a date-based tag

Version information can be viewed by clicking the version indicator in the header or footer of the application.

## Environment Variables

The application requires the following environment variables:

- `TBA_API_KEY`: API key for The Blue Alliance API
- `GOOGLE_ANALYTICS_ID`: (Optional) Google Analytics tracking ID

## Development

To run the application in development mode:

```bash
npm run dev
```

The application will be available at http://localhost:5000.

## License

MIT