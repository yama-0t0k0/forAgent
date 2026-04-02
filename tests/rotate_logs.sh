#!/bin/bash

# Configuration
LOG_DIR="/Users/yamakawamakoto/ReactNative_Expo/forAgent/tests/logs"
MAX_LOGS=5

# Ensure directory exists
if [ ! -d "$LOG_DIR" ]; then
    mkdir -p "$LOG_DIR"
    exit 0
fi

# List files by modification time, newest first
# We want to keep the 5 newest, and delete the rest
echo "🔄 Checking log rotation in $LOG_DIR..."

LOG_FILES=$(ls -t "$LOG_DIR"/*.md 2>/dev/null)
COUNT=$(echo "$LOG_FILES" | grep -v '^$' | wc -l)

if [ "$COUNT" -gt "$MAX_LOGS" ]; then
    # Skip the first 5, then delete the rest
    TO_DELETE=$(echo "$LOG_FILES" | sed -n "6,$ p")
    for FILE in $TO_DELETE; do
        echo "🗑️  Deleting old log: $(basename "$FILE")"
        rm "$FILE"
    done
else
    echo "✅ Current log count ($COUNT) is within limits ($MAX_LOGS)."
fi
