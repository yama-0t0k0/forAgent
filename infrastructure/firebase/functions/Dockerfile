# Dockerfile for Matching Functions
# Run build from project root:
# docker build -t matching-functions -f infrastructure/firebase/functions/Dockerfile .

FROM dart:stable AS build

WORKDIR /app

# Copy shared dependencies first
COPY shared/domain_models /app/shared/domain_models
COPY shared/common_logic /app/shared/common_logic

# Copy function code
COPY infrastructure/firebase/functions /app/infrastructure/firebase/functions

WORKDIR /app/infrastructure/firebase/functions
RUN dart pub get

# Compile the server
RUN dart compile exe bin/server.dart -o bin/server

# Final runtime image
FROM debian:stable-slim

# Install CA certificates for making outbound calls (if needed)
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/infrastructure/firebase/functions/bin/server /app/bin/server

# Ensure the binary is executable
RUN chmod +x /app/bin/server

EXPOSE 8080
CMD ["/app/bin/server"]
