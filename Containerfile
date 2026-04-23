# IronClaw Safety Guard — Builder Only
#
# 目的: ironclaw_core の Linux バイナリをビルドするためのコンテナ。
# オーケストレーターはホスト上で直接実行するため、ランタイムステージは不要。
# 将来、エージェントの実行を物理的に隔離する際に拡張する。
#
# 使い方:
#   podman build -t ironclaw-builder -f Containerfile .
#   podman run --rm -v ./shared/ironclaw_core/target:/app/shared/ironclaw_core/target ironclaw-builder

FROM rust:1.83-slim-bookworm AS builder

RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY shared/ironclaw_core ./shared/ironclaw_core
WORKDIR /app/shared/ironclaw_core

RUN cargo build --release
