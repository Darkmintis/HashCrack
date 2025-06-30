#!/bin/bash

# HashCrack One-Click Deployment Script
# This script helps users deploy HashCrack to production quickly

set -e

echo "🚀 HashCrack Deployment Assistant"
echo "================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

echo "This script will help you deploy HashCrack to production."
echo ""

# Get user's GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME
if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ GitHub username is required"
    exit 1
fi

# Get Render app name (optional)
read -p "Enter your Render app name (or press Enter to use 'hashcrack-$GITHUB_USERNAME'): " RENDER_APP
if [ -z "$RENDER_APP" ]; then
    RENDER_APP="hashcrack-$GITHUB_USERNAME"
fi

echo ""
echo "📋 Deployment Plan:"
echo "  GitHub Repository: https://github.com/$GITHUB_USERNAME/HashCrack"
echo "  Frontend URL: https://$GITHUB_USERNAME.github.io/HashCrack/"
echo "  Backend URL: https://$RENDER_APP.render.com"
echo ""

read -p "Continue with deployment? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "🔧 Configuring frontend..."

# Update config.js with the correct Render URL
CONFIG_FILE="frontend/config.js"
if [ -f "$CONFIG_FILE" ]; then
    sed -i.bak "s|YOUR_RENDER_URL_HERE|https://$RENDER_APP.render.com|g" "$CONFIG_FILE"
    echo "✅ Updated frontend configuration"
else
    echo "❌ Config file not found: $CONFIG_FILE"
    exit 1
fi

# Update README with personalized URLs
README_FILE="README.md"
if [ -f "$README_FILE" ]; then
    sed -i.bak "s|yourusername|$GITHUB_USERNAME|g" "$README_FILE"
    echo "✅ Updated README with your URLs"
fi

# Commit changes
echo ""
echo "📦 Committing configuration changes..."
git add .
git commit -m "Configure HashCrack for deployment

- Updated frontend API URL to: https://$RENDER_APP.render.com
- Configured for GitHub username: $GITHUB_USERNAME
- Ready for production deployment"

echo "✅ Changes committed"

echo ""
echo "🎯 Next Steps:"
echo ""
echo "1. Push to GitHub:"
echo "   git push origin main"
echo ""
echo "2. Deploy Backend to Render:"
echo "   - Go to https://render.com"
echo "   - Create new Web Service"
echo "   - Connect this repository"
echo "   - Use app name: $RENDER_APP"
echo "   - Build command: pip install -r requirements.txt"
echo "   - Start command: python enhanced_web_interface.py"
echo ""
echo "3. Enable GitHub Pages:"
echo "   - Go to https://github.com/$GITHUB_USERNAME/HashCrack/settings/pages"
echo "   - Source: Deploy from branch"
echo "   - Branch: main"
echo "   - Folder: /frontend"
echo ""
echo "4. Access your HashCrack instance:"
echo "   - Frontend: https://$GITHUB_USERNAME.github.io/HashCrack/"
echo "   - Backend: https://$RENDER_APP.render.com"
echo ""
echo "🎉 Deployment configuration complete!"
echo "   Follow the steps above to go live in under 10 minutes!"
