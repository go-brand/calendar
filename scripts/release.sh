#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if version type is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Version type required${NC}"
  echo ""
  echo "Usage: pnpm release <patch|minor|major>"
  echo ""
  echo "Examples:"
  echo "  pnpm release patch  # Bug fixes, docs (0.1.0 -> 0.1.1)"
  echo "  pnpm release minor  # New features (0.1.0 -> 0.2.0)"
  echo "  pnpm release major  # Breaking changes (0.1.0 -> 1.0.0)"
  exit 1
fi

VERSION_TYPE=$1

# Validate version type
if [[ ! "$VERSION_TYPE" =~ ^(patch|minor|major)$ ]]; then
  echo -e "${RED}Error: Invalid version type '$VERSION_TYPE'${NC}"
  echo "Must be one of: patch, minor, major"
  exit 1
fi

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}Error: You have uncommitted changes${NC}"
  echo "Please commit or stash your changes first"
  git status -s
  exit 1
fi

# Make sure we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo -e "${YELLOW}Warning: You are on branch '$CURRENT_BRANCH', not 'main'${NC}"
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo -e "${GREEN}Starting release process...${NC}"

# Run tests
echo "Running tests..."
pnpm test --run

# Run type check
echo "Running type check..."
pnpm typecheck

# Build
echo "Building..."
pnpm build

# Get current version from core package
CURRENT_VERSION=$(node -p "require('./packages/core/package.json').version")
echo "Current version: $CURRENT_VERSION"

# Calculate new version
case $VERSION_TYPE in
  patch)
    NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$NF = $NF + 1;} 1' | sed 's/ /./g')
    ;;
  minor)
    NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$(NF-1) = $(NF-1) + 1; $NF = 0;} 1' | sed 's/ /./g')
    ;;
  major)
    NEW_VERSION=$(echo $CURRENT_VERSION | awk -F. '{$1 = $1 + 1; $2 = 0; $NF = 0;} 1' | sed 's/ /./g')
    ;;
esac

echo -e "${GREEN}Bumping version to $NEW_VERSION${NC}"

# Update package.json files
node -e "
const fs = require('fs');
const version = '$NEW_VERSION';

// Update core package
const corePath = './packages/core/package.json';
const core = JSON.parse(fs.readFileSync(corePath, 'utf8'));
core.version = version;
fs.writeFileSync(corePath, JSON.stringify(core, null, 2) + '\n');

// Update react package
const reactPath = './packages/react/package.json';
const react = JSON.parse(fs.readFileSync(reactPath, 'utf8'));
react.version = version;
// Sync the dependency on calendar-core to the new version
react.dependencies['@gobrand/calendar-core'] = '^' + version;
fs.writeFileSync(reactPath, JSON.stringify(react, null, 2) + '\n');

console.log('Updated packages to version ' + version);
"

# Update lockfile after dependency change
echo "Updating lockfile..."
pnpm install --ignore-scripts

# Commit version bump
git add packages/*/package.json pnpm-lock.yaml
git commit -m "chore: release v$NEW_VERSION"
git tag "v$NEW_VERSION"

echo -e "${GREEN}Version bumped to v$NEW_VERSION${NC}"

# Push commit first
echo "Pushing commit to GitHub..."
git push origin main

# Then push tag separately to ensure it triggers CI
echo "Pushing tag to GitHub..."
git push origin "v$NEW_VERSION"

echo ""
echo -e "${GREEN}✓ Release complete!${NC}"
echo ""
echo "GitHub Actions will now:"
echo "  1. Run tests"
echo "  2. Build both packages"
echo "  3. Publish @gobrand/calendar-core to npm"
echo "  4. Publish @gobrand/react-calendar to npm"
echo ""
echo "Check progress at:"
echo "  https://github.com/go-brand/calendar/actions"
echo ""
echo "Once published, packages will be available at:"
echo "  https://www.npmjs.com/package/@gobrand/calendar-core"
echo "  https://www.npmjs.com/package/@gobrand/react-calendar"
