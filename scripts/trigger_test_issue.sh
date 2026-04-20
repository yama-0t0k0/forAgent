#!/bin/bash

# Configuration
REPO="yama-0t0k0/forAgent"
LABEL="ready-for-agent"
TITLE="[E2E Test] Automated Podman Operation Verification"
BODY="## Test Objective
Verify that the IronClaw agent system can:
1. Detect this issue from Podman container.
2. Perform LLM inference via host-gateway.
3. Execute a simple file modification task (Self-Correction/Audit).
4. Update the issue status and labels.

## Task
Please create a new file named \`shared/ironclaw_core/TEST_SUCCESS.md\` with the content 'Podman Operation Verified' and then close this issue."

echo "--------------------------------------------------"
echo "🧪 Triggering E2E Automation Test..."
echo "--------------------------------------------------"

# Check GH CLI auth
if ! gh auth status >/dev/null 2>&1; then
    echo "❌ Error: GH CLI is not authenticated. Please run 'gh auth login' first."
    exit 1
fi

# Create the issue
echo "Creating Issue: $TITLE"
ISSUE_URL=$(gh issue create --repo "$REPO" --title "$TITLE" --body "$BODY" --label "$LABEL")

if [ $? -eq 0 ]; then
    echo "✅ Test Issue created successfully!"
    echo "🔗 URL: $ISSUE_URL"
    echo ""
    echo "Next Steps:"
    echo "1. Run './scripts/start_agent_system.sh' if not already running."
    echo "2. Watch the logs: 'tail -f .agent/orchestrator/daemon.log'"
    echo "3. Monitor GitHub for agent activity."
else
    echo "❌ Failed to create issue."
    exit 1
fi
