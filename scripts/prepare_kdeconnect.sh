#!/usr/bin/env bash
# ==============================================================================
# Script: scripts/prepare_kdeconnect.sh
# Prepares KDE Connect Android upstream source, custom plugins, and build configuration
# ==============================================================================
set -e

echo "=========================================================="
echo "  Preparing KDE Connect Android Project Workspace..."
echo "=========================================================="

# 1. Backup custom plugins if they exist in current workspace
mkdir -p /tmp/kde_custom_plugins
if [ -d "src/main/java/org/kde/kdeconnect/plugins" ]; then
    echo "Backing up existing custom plugins from workspace..."
    cp -r src/main/java/org/kde/kdeconnect/plugins/* /tmp/kde_custom_plugins/ 2>/dev/null || true
fi

# 2. Check if official KDE Connect Android source is already present
if [ ! -f "gradlew" ] || [ ! -f "build.gradle.kts" ]; then
    echo "Upstream project files missing. Cloning official KDE Connect Android repo..."
    rm -rf /tmp/upstream_kde
    git clone --depth 1 https://github.com/KDE/kdeconnect-android.git /tmp/upstream_kde
    echo "Syncing upstream files to workspace (preserving .git, .github, and scripts)..."
    rsync -a --exclude='.git' --exclude='.github' --exclude='scripts' /tmp/upstream_kde/ ./
    rm -rf /tmp/upstream_kde
else
    echo "KDE Connect Android core project files already present."
fi

# 3. Ensure destination plugin directories exist
mkdir -p src/main/java/org/kde/kdeconnect/plugins/remotebrowse
mkdir -p src/main/java/org/kde/kdeconnect/plugins/chat

# 4. Restore or copy custom plugins
if [ -d "/tmp/kde_custom_plugins/remotebrowse" ] && [ -n "$(ls -A /tmp/kde_custom_plugins/remotebrowse 2>/dev/null)" ]; then
    echo "Restoring RemoteBrowsePlugin..."
    cp -r /tmp/kde_custom_plugins/remotebrowse/* src/main/java/org/kde/kdeconnect/plugins/remotebrowse/ 2>/dev/null || true
fi

if [ -d "/tmp/kde_custom_plugins/chat" ] && [ -n "$(ls -A /tmp/kde_custom_plugins/chat 2>/dev/null)" ]; then
    echo "Restoring ChatPlugin..."
    cp -r /tmp/kde_custom_plugins/chat/* src/main/java/org/kde/kdeconnect/plugins/chat/ 2>/dev/null || true
fi
rm -rf /tmp/kde_custom_plugins

# 5. Apply any feature patches if provided
if [ -f "patches/0001-kdeconnect-remote-browser-and-device-chat.patch" ]; then
    echo "Applying patches/0001-kdeconnect-remote-browser-and-device-chat.patch..."
    git apply --ignore-space-change --ignore-whitespace patches/0001-kdeconnect-remote-browser-and-device-chat.patch 2>/dev/null || true
fi

# 6. Enable auto SDK download in gradle.properties
echo "android.builder.sdkDownload=true" >> gradle.properties

# 7. Adjust compileSdk and targetSdk for runner stability if needed
if grep -q "compileSdk = 37" build.gradle.kts 2>/dev/null; then
    echo "Adjusting compileSdk from 37 to 35 for runner stability..."
    sed -i 's/compileSdk = 37/compileSdk = 35/g' build.gradle.kts
    sed -i 's/targetSdk = 37/targetSdk = 35/g' build.gradle.kts
fi

# 8. Ensure gradlew is executable
if [ -f "gradlew" ]; then
    chmod +x gradlew
fi

echo "=========================================================="
echo "  ✅ Source preparation completed successfully!"
echo "=========================================================="
