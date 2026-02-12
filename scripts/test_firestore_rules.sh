#!/bin/bash

# scripts/test_firestore_rules.sh
# Runs Firestore Security Rules unit tests with proper Java environment

# Ensure Java is available (Required for Firestore Emulator)
export PATH="/usr/local/opt/openjdk/bin:$PATH"
export JAVA_HOME="/usr/local/opt/openjdk/libexec/openjdk.jdk/Contents/Home"

echo "☕️ Checking Java environment..."
if ! command -v java &> /dev/null; then
    echo "❌ Java not found. Please install OpenJDK."
    exit 1
fi
java -version

echo "🔥 Starting Firestore Security Rules Tests..."

# Check if emulators are already running, if so, just run jest
if nc -z localhost 8080; then
    echo "⚠️  Emulator appears to be running on port 8080."
    echo "   Running tests directly against existing emulator..."
    npx jest firestore.test.js
else
    echo "🚀 Starting Emulator & Running Tests..."
    # Run emulator and tests
    firebase emulators:exec --only firestore "npx jest firestore.test.js"
fi
