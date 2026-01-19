# Dockerfile for Matching Functions
# Run build from project root:
# docker build -t matching-functions -f infrastructure/firebase/functions/Dockerfile .

FROM dart:stable AS build

WORKDIR /app

# Copy shared dependencies first
COPY shared/domain_models /shared/domain_models
COPY shared/common_logic /shared/common_logic

# Copy function code
COPY infrastructure/firebase/functions /app/infrastructure/firebase/functions

WORKDIR /app/infrastructure/firebase/functions
RUN dart pub get

# Compile the server
RUN dart compile exe bin/server.dart -o bin/server

# Final runtime image
FROM scratch
COPY --from=build /runtime/ /
COPY --from=build /app/infrastructure/firebase/functions/bin/server /app/bin/server

EXPOSE 8080
CMD ["/app/bin/server"]
