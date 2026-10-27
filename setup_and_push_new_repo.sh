#!/usr/bin/env bash
# ==============================================================================
# KDE Connect Android - New Repository & Build Setup Script
# ==============================================================================
set -e

echo "=========================================================="
echo "  KDE Connect Android - New Repo & APK Build Setup"
echo "=========================================================="

# Check if target repository argument is provided
if [ -z "$1" ]; then
    echo "Usage: ./setup_and_push_new_repo.sh <YOUR_NEW_GITHUB_REPO_URL>"
    echo "Example: ./setup_and_push_new_repo.sh https://github.com/nexen350/kdeconnect-android.git"
    exit 1
fi

TARGET_REPO="$1"
TEMP_DIR="/tmp/kdeconnect_build_workspace"

echo "==> Step 1: Cloning upstream KDE/kdeconnect-android..."
rm -rf "$TEMP_DIR"
git clone --depth 1 https://github.com/KDE/kdeconnect-android.git "$TEMP_DIR"

echo "==> Step 2: Injecting RemoteBrowsePlugin and ChatPlugin..."
mkdir -p "$TEMP_DIR/src/main/java/org/kde/kdeconnect/plugins/remotebrowse"
mkdir -p "$TEMP_DIR/src/main/java/org/kde/kdeconnect/plugins/chat"
mkdir -p "$TEMP_DIR/.github/workflows"

# Copy custom Kotlin plugins into official source tree
cp -r src/main/java/org/kde/kdeconnect/plugins/remotebrowse/* "$TEMP_DIR/src/main/java/org/kde/kdeconnect/plugins/remotebrowse/" 2>/dev/null || true
cp -r src/main/java/org/kde/kdeconnect/plugins/chat/* "$TEMP_DIR/src/main/java/org/kde/kdeconnect/plugins/chat/" 2>/dev/null || true

# Copy GitHub Actions CI/CD with automatic Release publication
cp .github/workflows/android-build-apk.yml "$TEMP_DIR/.github/workflows/android-build-apk.yml"

echo "==> Step 3: Setting remote to $TARGET_REPO and pushing..."
cd "$TEMP_DIR"
git remote set-url origin "$TARGET_REPO"
git branch -M main

git add .
git commit -m "feat: Add Remote File Browser, Bulletin Chat & Automated Release" || true
git push -u origin main --force

echo "=========================================================="
echo "  ✅ SUCCESS! Pushed to $TARGET_REPO"
echo "  GitHub Actions will now build and publish the APK to Releases!"
echo "=========================================================="
