#!/bin/bash

# This script directly updates the version.ts file with deployment info
# It should be run as part of the Replit deployment process

# File path
VERSION_FILE="shared/version.ts"

# Set app version (read from package.json)
APP_VERSION=$(node -e "console.log(require('./package.json').version)")

# Generate build number based on date and count
TODAY=$(date +%Y%m%d)
BUILD_COUNT=1
BUILD_NUMBER="$TODAY.$BUILD_COUNT"

# Get the current git commit hash (short version)
if [ -n "$REPLIT_GIT_COMMIT_HASH" ]; then
  COMMIT_HASH="$REPLIT_GIT_COMMIT_HASH"
else
  if command -v git &> /dev/null; then
    COMMIT_HASH=$(git rev-parse --short HEAD)
  else
    COMMIT_HASH="unknown"
  fi
fi

# Set build date
BUILD_DATE=$(date +%Y-%m-%d)

# Set release tag - could be based on git tag or manually configured
if command -v git &> /dev/null; then
  GIT_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
  if [ -n "$GIT_TAG" ]; then
    RELEASE_TAG="$GIT_TAG"
  else
    # Default release tag based on date
    RELEASE_TAG="release-$TODAY"
  fi
else
  RELEASE_TAG="release-$TODAY"
fi

# Set environment to production for deployment
NODE_ENV="production"

echo "Updating version info for deployment in $VERSION_FILE"

# Update version.ts file directly with sed
# Update app version
sed -i "s/appVersion: '[^']*'/appVersion: '$APP_VERSION'/" "$VERSION_FILE"

# Update build number
sed -i "s/buildNumber: \`[^']*\`/buildNumber: '$BUILD_NUMBER'/" "$VERSION_FILE"

# Update commit hash
sed -i "s/commitHash: '[^']*'/commitHash: '$COMMIT_HASH'/" "$VERSION_FILE"

# Update environment
sed -i "s/environment: '[^']*'/environment: '$NODE_ENV'/" "$VERSION_FILE"

# Update build date
sed -i "s/buildDate: '[^']*'/buildDate: '$BUILD_DATE'/" "$VERSION_FILE"

# Update release tag
sed -i "s/releaseTag: '[^']*'/releaseTag: '$RELEASE_TAG'/" "$VERSION_FILE"

echo "Version info updated for deployment:"
echo "App Version: $APP_VERSION"
echo "Build Number: $BUILD_NUMBER"
echo "Commit Hash: $COMMIT_HASH"
echo "Build Date: $BUILD_DATE"
echo "Release Tag: $RELEASE_TAG"
echo "Environment: $NODE_ENV"

# Continue with deployment process
# (The actual deployment will be handled by Replit Deployments)