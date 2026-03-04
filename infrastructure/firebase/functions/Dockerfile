# Dockerfile for Matching Functions
# Run build from project root:
# docker build -t matching-functions -f infrastructure/firebase/functions/Dockerfile .

FROM dart:stable AS build

WORKDIR /app

# Create a minimal workspace root pubspec.yaml for Docker build.
# The full monorepo root pubspec.yaml includes Flutter-dependent packages (e.g. common_backend)
# which cannot be resolved in a Dart-only Docker image.
# We only include packages that matching_functions actually depends on.
RUN echo 'name: engineer_registration_app\npublish_to: none\nenvironment:\n  sdk: ">=3.6.0 <4.0.0"\nworkspace:\n  - shared/domain_models\n  - shared/common_logic\n  - infrastructure/firebase/functions' > /app/pubspec.yaml

# Copy only the required shared packages
COPY shared/domain_models /app/shared/domain_models
COPY shared/common_logic /app/shared/common_logic

# Copy function code
COPY infrastructure/firebase/functions /app/infrastructure/firebase/functions

# Resolve dependencies and compile
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
