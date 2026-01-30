#!/bin/bash
set -e

# verify_bundle.sh
# Checks for 'Unable to resolve module' and other bundling errors by running a dry-run export.

APPS=("apps/admin_app/expo_frontend" "apps/individual_user_app/expo_frontend" "apps/corporate_user_app/expo_frontend")
ROOT_DIR=$(pwd)

for APP_DIR in "${APPS[@]}"; do
  cd "$ROOT_DIR"
  echo "🔍 Verifying bundle integrity for $APP_DIR..."
  
  if [ ! -d "$APP_DIR" ]; then
    echo "⚠️ Skipping $APP_DIR: Directory not found."
    continue
  fi

  cd "$APP_DIR" || exit 1

  # Run expo export to a temp directory. This forces the bundler to resolve all modules.
  # Use platform 'ios' as a representative target.
  TEMP_OUT="/tmp/expo-verify-$(basename $APP_DIR)-$(date +%s)"
  OUTPUT=$(npx expo export --platform ios --output-dir "$TEMP_OUT" 2>&1)
  EXIT_CODE=$?

  # Clean up temp dir
  rm -rf "$TEMP_OUT"

  if [ $EXIT_CODE -eq 0 ] && ! echo "$OUTPUT" | grep -iq "Unable to resolve module"; then
    echo "✅ $APP_DIR: Bundle verification passed!"
  else
    echo "❌ $APP_DIR: Bundle verification failed!"
    echo "----------------------------------------"
    echo "$OUTPUT" | grep -iB 5 -A 5 "Unable to resolve module" || echo "$OUTPUT" | tail -n 20
    echo "----------------------------------------"
    exit 1
  fi
done

echo "🎉 All apps passed bundle integrity checks."
exit 0
