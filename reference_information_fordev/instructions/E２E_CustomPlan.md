# Frontend Coverage and Automated Log Management

Implement a verification suite to ensure all frontend pages listed in the documentation are addressed and establish an automated logging mechanism in `tests/logs` with a rotation policy.

## User Review Required

> [!IMPORTANT]
> The document `https://design-document-site-d11f0.web.app/General/hosting_applications.html` lists several sites that are currently not fully represented by active screen components in the `apps/` directory (e.g., `fmjs-app`, `selection-progress-site`). I will map the logical sites to the available source code to verify coverage.

## Proposed Changes

### Configuration & Infrastructure

#### [NEW] [verify_coverage.mjs](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/tests/verify_coverage.mjs)
- Script to compare the list of URLs from the design document against the implemented screens in the monorepo.
- Generates the markdown report in `tests/logs`.

#### [MODIFY] [package.json](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/package.json)
- Add `test:coverage:report` command to trigger the verification and log management.

### Log Management

#### [NEW] [rotate_logs.sh](file:///Users/yamakawamakoto/ReactNative_Expo/forAgent/tests/rotate_logs.sh)
- Shell script to maintain only the 5 most recent log files in `tests/logs`.

## Verification Plan

### Automated Tests
1. Run `npm run test:coverage:report`.
2. Check `tests/logs` for the new markdown report.
3. Verify that if more than 5 logs exist, the oldest is deleted.

### Manual Verification
1. Review the generated markdown report to ensure all URLs and screen mappings are accurate.
