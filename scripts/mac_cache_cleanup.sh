#!/bin/bash
# ==========================================
# Professional Mac Development Cache Cleanup
# (Hardened for Container/Simulators/Web)
# ==========================================
echo "🚀 Hardened Mac Cleanup System starting..."

# 1. Xcode & Simulators
echo "🗑️  Xcode: Clearing DerivedData & Unavailable Simulators..."
rm -rf ~/Library/Developer/Xcode/DerivedData/*
xcrun simctl delete unavailable 2>/dev/null
echo "✅ Xcode cleaned."

# 2. Container Engines (The major disk eaters)
echo "🗑️  Containers: Pruning Docker, Podman, and Colima..."
# Docker (if running/installed)
if command -v docker &> /dev/null; then
    docker system prune -a -f --volumes 2>/dev/null
fi
# Podman (if running/installed)
if command -v podman &> /dev/null; then
    podman system prune -a -f 2>/dev/null
fi
# Remove Legacy fragments
rm -rf ~/.colima 2>/dev/null
rm -rf ~/.lima 2>/dev/null
echo "✅ Container environments pruned."

# 3. Package Managers & Runtimes
echo "🗑️  Package Managers: NPM, Yarn, CocoaPods, Bun..."
npm cache clean --force 2>/dev/null
yarn cache clean 2>/dev/null
rm -rf ~/Library/Caches/CocoaPods 2>/dev/null
rm -rf ~/.bun/install/cache 2>/dev/null
rm -rf ~/.expo/cache 2>/dev/null
echo "✅ Package manager caches cleared."

# 4. System & Temporary files
echo "🗑️  System: Clearing Trash and Temps..."
rm -rf ~/.Trash/* 2>/dev/null
# Clear temporary folders that are safe to delete
rm -rf /private/var/folders/*/*/*/com.apple.developer.networking.* 2>/dev/null
echo "✅ Trash and system temps cleared."

# 5. Result
echo "------------------------------------------"
echo "🎉 Cleanup Finished!"
df -h /System/Volumes/Data | grep -v Filesystem
echo "------------------------------------------"
echo "Tip: If you still need space, consider deleting old runtimes in:"
echo "     /Library/Developer/CoreSimulator/Cryptex/Images/bundle/"

