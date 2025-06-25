#!/bin/bash

# Build the project
npm run build

# Create a temporary directory
TEMP_DIR=$(mktemp -d)

# Copy the built files to temp directory
cp -r dist/* $TEMP_DIR/

# Initialize git in temp directory
cd $TEMP_DIR
git init
git add -A
git commit -m "Deploy to GitHub Pages"

# Push to gh-pages branch
# Replace <username> and <repo> with your GitHub username and repository name
# git push -f git@github.com:<username>/<repo>.git master:gh-pages

echo "Build files are ready in: $TEMP_DIR"
echo "To deploy, uncomment the git push line and replace with your repository details"