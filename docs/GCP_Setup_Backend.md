# GCP Setup Guide for Backend CI/CD

To enable the CI/CD pipeline for `apps/backend` (Issue #333), please perform the following setup steps in your Google Cloud Console.

## 1. Artifact Registry Setup
The pipeline requires a Docker repository to store the backend images.

### Option A: via CLI (Requires gcloud SDK)
```bash
gcloud artifacts repositories create backend-repo \
    --repository-format=docker \
    --location=asia-northeast1 \
    --description="Dart Backend Server Repository"
```

### Option B: via Google Cloud Console (Web Browser)
1.  Go to **Artifact Registry** in the console: [https://console.cloud.google.com/artifacts](https://console.cloud.google.com/artifacts)
2.  Click **CREATE REPOSITORY**.
3.  **Name**: `backend-repo`
4.  **Format**: `Docker`
5.  **Mode**: `Standard`
6.  **Location type**: `Region` -> `asia-northeast1 (Tokyo)`
7.  Click **CREATE**.

## 2. Cloud Run API
**Note:** Since `matching-functions` is already running in your project, **this API is likely already enabled.** You can verify it with the steps below.

### Verification Steps (Google Cloud Console)
1.  Open the [Google Cloud Console](https://console.cloud.google.com/).
2.  Ensure your project `flutter-frontend-21d0a` is selected in the top bar.
3.  Click the **Navigation Menu** (Hamburger icon ☰) in the top left.
4.  Navigate to **APIs & Services** > **Enabled APIs & services**.
5.  In the list of "Enabled APIs & services", search for **"Cloud Run Admin API"**.
    *   **If found**: The API is enabled. You can skip to Step 3.
    *   **If NOT found**:
        1.  Click **+ ENABLE APIS AND SERVICES** at the top of the page.
        2.  In the "Search for APIs & Services" bar, type `Cloud Run API`.
        3.  Click on the result **Cloud Run Admin API**.
        4.  Click the blue **ENABLE** button.

### Option A: via CLI (Alternative)
```bash
gcloud services enable run.googleapis.com
```

## 3. GitHub Secrets
The workflow uses `GCP_SA_KEY` to authenticate.
*   **If you are already using `deploy-matching-api.yml`**, this secret should already be configured.
*   **Verification**: Ensure the Service Account associated with this key has the following roles:
    *   `Artifact Registry Writer`
    *   `Cloud Run Admin`
    *   `Service Account User`

## 4. Triggering the Deployment
The pipeline triggers automatically on:
*   Push to `main` branch affecting `apps/backend/**` or `shared/**`.
*   Manual trigger via GitHub Actions "Run workflow" button.

## 5. First Deployment Note
The first deployment will create a new Cloud Run service named `backend-app`.
*   **Authentication**: The service is deployed with `--allow-unauthenticated` by default for public API access.
*   **Region**: `asia-northeast1` (Tokyo).
