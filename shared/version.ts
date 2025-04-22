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
  return new Date().toISOString().slice(0, 10).replace(/-/g, "");
};

// Define version object with static values that will be replaced during build
export const VERSION: VersionResponse = {
  // Application version using semantic versioning (major.minor.patch) - updated by deploy script
  appVersion: "1.0.6",

  // Build number - updated by deploy script
  buildNumber: "20250420.6",

  // Commit hash - updated by deploy script
  commitHash: "development",

  // Environment - updated by deploy script
  environment: "development",

  // Build timestamp - updated by deploy script
  buildDate: "2025-04-20",

  // Release tag - updated by deploy script
  releaseTag: "current",
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
