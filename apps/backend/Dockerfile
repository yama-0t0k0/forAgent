# Use Google's official Dart image.
# https://hub.docker.com/_/dart
FROM dart:stable AS build

# Set workspace as working directory
WORKDIR /app

# Copy the entire repository to access shared libraries (monorepo support)
COPY . .

# Change to backend directory for dependency resolution and build
WORKDIR /app/apps/backend
RUN dart pub get

# Compile the server
RUN dart compile exe bin/server.dart -o bin/server

# Build minimal serving image from AOT-compiled `/server` and required system
# libraries and configuration files stored in `/runtime/` from the build stage.
FROM scratch
COPY --from=build /runtime/ /
COPY --from=build /app/apps/backend/bin/server /app/bin/

# Start server.
EXPOSE 8080
CMD ["/app/bin/server"]
