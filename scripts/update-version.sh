#!/bin/bash

# Script to update the SDK version in the version.ts file
# This should be run as part of the prepublishOnly npm script

set -e

# Get the package version from package.json using jq
VERSION=$(jq -r '.version' package.json)

if [ -z "$VERSION" ]; then
  echo "Error: Could not find version in package.json"
  exit 1
fi

# Path to version.ts file
VERSION_FILE="src/version.ts"

# Generate version file content
cat > $VERSION_FILE << EOF
/**
 * SDK version information
 * This file is automatically updated during the build process
 * Last updated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
 */

export const VERSION = '$VERSION';
EOF

echo "Successfully updated version to $VERSION in $VERSION_FILE" 