#!/usr/bin/env bash
# ==============================================================================
# Script: scripts/prepare_kdeconnect.sh
# Prepares KDE Connect Android upstream source, custom plugins, and build configuration
# ==============================================================================
set -Eeuo pipefail

echo "=========================================================="
echo "  Preparing KDE Connect Android Project Workspace..."
echo "=========================================================="

UPSTREAM_TAG="v1.37.0"
UPSTREAM_REPO="https://github.com/KDE/kdeconnect-android.git"

# 1. Backup custom plugins from workspace if they exist
mkdir -p /tmp/kde_custom_plugins_backup
if [ -d "src/main/java/org/kde/kdeconnect/plugins/remotebrowse" ]; then
    echo "Backing up RemoteBrowsePlugin..."
    cp -r src/main/java/org/kde/kdeconnect/plugins/remotebrowse /tmp/kde_custom_plugins_backup/ 2>/dev/null || true
fi
if [ -d "src/main/java/org/kde/kdeconnect/plugins/chat" ]; then
    echo "Backing up ChatPlugin..."
    cp -r src/main/java/org/kde/kdeconnect/plugins/chat /tmp/kde_custom_plugins_backup/ 2>/dev/null || true
fi

# 2. Check if official KDE Connect Android source files are already present
if [ ! -f "gradlew" ] || [ ! -f "build.gradle.kts" ] || [ ! -d "gradle/wrapper" ]; then
    echo "Upstream project files missing. Cloning KDE Connect Android tag: ${UPSTREAM_TAG}..."
    TEMP_UPSTREAM=$(mktemp -d /tmp/kde_upstream_XXXXXX)
    git clone --depth 1 --branch "${UPSTREAM_TAG}" "${UPSTREAM_REPO}" "${TEMP_UPSTREAM}"

    echo "Synchronizing upstream files to workspace..."
    if command -v rsync >/dev/null 2>&1; then
        rsync -a --exclude='.git' --exclude='.github' --exclude='scripts' --exclude='patches' "${TEMP_UPSTREAM}/" ./
    else
        tar -C "${TEMP_UPSTREAM}" --exclude='.git' --exclude='.github' --exclude='scripts' --exclude='patches' -cf - . | tar -xf -
    fi
    rm -rf "${TEMP_UPSTREAM}"
else
    echo "KDE Connect Android core project files already present in workspace."
fi

# 3. Ensure custom plugin destination directories exist
mkdir -p src/main/java/org/kde/kdeconnect/plugins/remotebrowse
mkdir -p src/main/java/org/kde/kdeconnect/plugins/chat

# 4. Restore custom plugins to their proper location
if [ -d "/tmp/kde_custom_plugins_backup/remotebrowse" ]; then
    echo "Restoring RemoteBrowsePlugin..."
    cp -r /tmp/kde_custom_plugins_backup/remotebrowse/* src/main/java/org/kde/kdeconnect/plugins/remotebrowse/ 2>/dev/null || true
fi
if [ -d "/tmp/kde_custom_plugins_backup/chat" ]; then
    echo "Restoring ChatPlugin..."
    cp -r /tmp/kde_custom_plugins_backup/chat/* src/main/java/org/kde/kdeconnect/plugins/chat/ 2>/dev/null || true
fi
rm -rf /tmp/kde_custom_plugins_backup

# 5. Apply any feature patches if provided
PATCH_FILE="patches/0001-kdeconnect-remote-browser-and-device-chat.patch"
if [ -f "${PATCH_FILE}" ]; then
    echo "Checking patch: ${PATCH_FILE}..."
    if git apply --check "${PATCH_FILE}" 2>/dev/null; then
        echo "Applying patch cleanly..."
        git apply "${PATCH_FILE}"
    else
        echo "Patch already applied or skipped safely."
    fi
fi

# 6. Enable auto SDK download in gradle.properties
if [ -f "gradle.properties" ]; then
    if ! grep -q "android.builder.sdkDownload=true" gradle.properties; then
        echo "android.builder.sdkDownload=true" >> gradle.properties
    fi
else
    echo "android.builder.sdkDownload=true" > gradle.properties
fi

# 7. Ensure gradlew has executable permissions
if [ -f "gradlew" ]; then
    chmod +x gradlew
fi

echo "=========================================================="
echo "  ✅ Source preparation completed successfully!"
echo "=========================================================="
