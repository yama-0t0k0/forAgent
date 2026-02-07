#!/bin/bash
# tests/utils/clear_firestore.sh

PROJECT_ID="engineer-registration-app-yama"
EMULATOR_HOST="localhost:8080"

# Check if emulator is reachable
if ! nc -z localhost 8080; then
  echo "⚠️  Firestore Emulator is NOT running on port 8080. Skipping cleanup."
  exit 0
fi

echo "🧹 Clearing Firestore Emulator data..."
# Using curl to delete all documents in the default database
response=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "http://${EMULATOR_HOST}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents")

if [ "$response" -eq 200 ]; then
  echo "✅ Firestore data cleared successfully."
else
  echo "⚠️  Failed to clear Firestore data. HTTP Status: $response"
fi
