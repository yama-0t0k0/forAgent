#!/bin/bash

# tests/utils/record_success.sh
# Usage: ./tests/utils/record_success.sh <test_file> <output_name>

# Ensure Java and Maestro are in PATH
export PATH="/usr/local/opt/openjdk/bin:$HOME/.maestro/bin:$PATH"
export JAVA_HOME="/usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home"

TEST_FILE=$1
OUTPUT_NAME=$2
LOG_DIR="tests/logs"

if [ -z "$TEST_FILE" ] || [ -z "$OUTPUT_NAME" ]; then
    echo "Usage: $0 <test_file> <output_name>"
    exit 1
fi

mkdir -p "$LOG_DIR"
VIDEO_PATH="$LOG_DIR/${OUTPUT_NAME}.mp4"

echo "🎥 Starting recording for $TEST_FILE..."
# Note: Maestro record starts the app and records.
maestro record --local "$TEST_FILE" "$VIDEO_PATH"
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Test Succeeded! Video saved to $VIDEO_PATH"
    # Take a final success screenshot for good measure
    SS_PATH="$LOG_DIR/${OUTPUT_NAME}_success.png"
    xcrun simctl io booted screenshot "$SS_PATH"
    echo "📸 Success screenshot saved to $SS_PATH"
else
    echo "❌ Test Failed. Deleting incomplete/failed recording..."
    rm -f "$VIDEO_PATH"
    exit 1
fi
