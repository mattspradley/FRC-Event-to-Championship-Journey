/**
 * FRC Championship Tracker Version Information
 * This file contains build and version information for the application.
 */

export interface ServerInfo {
  nodeVersion: string;
  uptime: number;
  serverTime: string;
}

export interface VersionResponse {
  appVersion: string;
  buildNumber: string;
  commitHash: string;
  environment: string;
  buildDate: string;
  releaseTag: string;
  server?: ServerInfo;
}

// Simple version information with hardcoded defaults for client-side
// These values will be updated by the deploy.sh script during deployment

// Get the current date in YYYYMMDD format for default build number
const getFormattedDate = (): string => {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '');
};

// Define version object with static values that will be replaced during build
export const VERSION: VersionResponse = {
  // Application version using semantic versioning (major.minor.patch)
  appVersion: "1.0.0",
  
  // Build number in format YYYYMMDD.n
  buildNumber: "20250420.1",
  
  // Commit hash from git
  commitHash: "development", 
  
  // Environment (development, staging, production)
  environment: "development",
  
  // Build timestamp
  buildDate: "2025-04-20",
  
  // Release tag
  releaseTag: "current"
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