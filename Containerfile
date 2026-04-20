# Stage 1: Build Rust Hardened Core
FROM rust:1.81-slim-bookworm AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY shared/ironclaw_core ./shared/ironclaw_core
WORKDIR /app/shared/ironclaw_core

# Build the release binary for Linux
RUN cargo build --release

# Stage 2: Runtime Environment
FROM node:20-slim-bookworm

# Install runtime dependencies (git, gh cli, etc.)
RUN apt-get update && apt-get install -y \
    git \
    ssh \
    ca-certificates \
    curl \
    && curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
    && chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
    && apt-get update \
    && apt-get install -y gh \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the built Rust binary
COPY --from=builder /app/shared/ironclaw_core/target/release/ironclaw_core /app/shared/ironclaw_core/target/release/ironclaw_core

# Copy the orchestrator and other necessary files
COPY .agent /app/.agent
COPY package.json /app/
# Note: node_modules will be installed or volume-mapped.
# In "Full Automated" mode, we should install them.
RUN npm install --only=production

# Set up the environment
ENV OLLAMA_URL=http://host.containers.internal:11434
# Mount point for the workspace will be /app/workspace (passed via -v in podman run)

ENTRYPOINT ["node", ".agent/orchestrator/pm_orchestrator.js"]
