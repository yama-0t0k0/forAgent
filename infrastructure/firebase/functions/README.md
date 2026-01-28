# Matching Functions (Dart)

This directory contains the core matching and scoring logic implemented as a Firebase Cloud Function (via functions_framework).

## Core Function: `calculateMatch`

This function takes a `userDoc` and a `jdDoc` (in Firestore JSON format) and returns:
- `matchPoints`: Sum of points for skills that meet or exceed requirements.
- `penaltyPoints`: Negative points for required skills that the user lacks.
- `netScore`: The total combined score.
- `matchingScore`: A normalized 0-100 score for UI display.

## Local Testing

1. Get dependencies:
   ```bash
   dart pub get
   ```
2. Run unit tests:
   ```bash
   dart test test/match_test.dart
   ```
3. Run local server:
   ```bash
   dart run functions_framework --target=calculateMatch
   ```

## Deployment (Firebase / Cloud Run)

Since this is a Dart project, it is recommended to deploy using **Cloud Run** and then bridge it to Firebase Functions v2 if needed.

### 1. Build Docker Image (from project root)
```bash
docker build -t matching-functions -f infrastructure/firebase/functions/Dockerfile .
```

### 2. Push to Google Container Registry
```bash
docker tag matching-functions gcr.io/[PROJECT_ID]/matching-functions
docker push gcr.io/[PROJECT_ID]/matching-functions
```

### 3. Deploy to Cloud Run
```bash
gcloud run deploy matching-functions --image gcr.io/[PROJECT_ID]/matching-functions --platform managed
```
