#!/bin/bash

# NovumFlow & CareFlow - VS Code Extensions Auto-Installer
# This script installs all recommended VS Code extensions for the project

echo "🚀 Installing VS Code Extensions for NovumFlow & CareFlow..."
echo ""

# Check if code command is available
if ! command -v code &> /dev/null; then
    echo "❌ Error: 'code' command not found!"
    echo ""
    echo "Please install VS Code command line tools:"
    echo "1. Open VS Code"
    echo "2. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)"
    echo "3. Type 'Shell Command: Install code command in PATH'"
    echo "4. Press Enter"
    echo ""
    exit 1
fi

# Array of extensions to install
extensions=(
    # Essential - Deno & Supabase
    "denoland.vscode-deno"
    "supabase.supabase-vscode"
    
    # Code Quality
    "dbaeumer.vscode-eslint"
    "esbenp.prettier-vscode"
    
    # React & JavaScript
    "dsznajder.es7-react-js-snippets"
    
    # Styling
    "bradlc.vscode-tailwindcss"
    
    # TypeScript
    "yoavbls.pretty-ts-errors"
    
    # Error Highlighting
    "usernamehw.errorlens"
    
    # Git
    "eamodio.gitlens"
    
    # UI Enhancements
    "pkief.material-icon-theme"
    
    # Path Autocomplete
    "christian-kohler.path-intellisense"
    
    # Auto Rename Tag
    "formulahendry.auto-rename-tag"
    
    # Database
    "mtxr.sqltools"
    "mtxr.sqltools-driver-pg"
    
    # GraphQL
    "graphql.vscode-graphql"
    "graphql.vscode-graphql-syntax"
    
    # React Native (for Capacitor)
    "msjsdiag.vscode-react-native"
    
    # Environment Variables
    "irongeek.vscode-env"
    
    # Spell Checker
    "streetsidesoftware.code-spell-checker"
)

# Install each extension
total=${#extensions[@]}
current=0

for extension in "${extensions[@]}"; do
    current=$((current + 1))
    echo "[$current/$total] Installing $extension..."
    code --install-extension "$extension" --force
done

echo ""
echo "✅ All extensions installed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Reload VS Code (Cmd+R or Ctrl+R)"
echo "2. Open workspace: code novumflow.code-workspace"
echo "3. If prompted, click 'Install' for workspace extensions"
echo "4. Trust the workspace when prompted"
echo ""
echo "🎉 You're ready to code!"
