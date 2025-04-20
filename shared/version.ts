/**
 * FRC Championship Tracker Version Information
 * This file contains build and version information for the application.
 */

export const VERSION = {
  // Application version using semantic versioning (major.minor.patch)
  appVersion: '1.0.0',
  
  // Build number - increment this with each production build
  buildNumber: '20240420.1',
  
  // Commit hash - should be updated to match the actual git commit hash during deployment
  commitHash: 'a1b2c3d', 
  
  // Environment (development, staging, production)
  environment: process.env.NODE_ENV || 'development',
  
  // Build timestamp
  buildDate: '2024-04-20',
  
  // Release name/tag
  releaseTag: 'houston-2024',
};

/**
 * Get a formatted string with version information
 */
export function getVersionInfo(): string {
  return `v${VERSION.appVersion} (${VERSION.buildNumber}) [${VERSION.releaseTag}]`;
}

/**
 * Get detailed version information
 */
export function getDetailedVersionInfo(): string {
  return `
    Version: ${VERSION.appVersion}
    Build: ${VERSION.buildNumber}
    Commit: ${VERSION.commitHash}
    Environment: ${VERSION.environment}
    Build Date: ${VERSION.buildDate}
    Release: ${VERSION.releaseTag}
  `;
}