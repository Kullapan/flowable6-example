# =============================================================================
# Dockerfile — custom-backend (Spring Boot)
# Multi-stage build to keep the final image lean.
#
# Stage 1 (builder): Uses a full JDK image to compile the source and produce
#   the executable bootJar via Gradle.
# Stage 2 (runtime): Uses a slim JRE-only image and copies ONLY the built JAR,
#   resulting in a much smaller final image (~200 MB vs ~600 MB).
# =============================================================================

# ─── Stage 1: Build ──────────────────────────────────────────────────────────
# Use the official Eclipse Temurin JDK 17 image (smaller than openjdk).
# The 'jammy' (Ubuntu 22.04) variant is used for broad compatibility.
FROM eclipse-temurin:17-jdk-jammy AS builder

# Set the working directory inside the container.
WORKDIR /app

# ── Copy Gradle wrapper first (cache-friendly) ────────────────────────────────
# Copying the wrapper scripts and config before the source code means Docker
# can cache the dependency-download layer. It will only re-run when these
# files change (not on every source-code edit).
COPY gradlew .
COPY gradle gradle

# Fix line endings and make the Gradle wrapper executable on Linux.
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew

# Copy dependency declarations before source so the dependency layer is cached.
COPY build.gradle .
COPY settings.gradle .

# Download all dependencies declared in build.gradle.
# '--no-daemon' keeps memory usage predictable inside Docker.
RUN ./gradlew dependencies --no-daemon

# ── Copy the full source tree ─────────────────────────────────────────────────
COPY src src

# Run the bootJar task. '-x test' skips unit tests during the Docker build;
# tests should already have passed in the CI pipeline before this image is built.
RUN ./gradlew bootJar -x test --no-daemon

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
# Use a JRE-only image — no compiler, no source tools.  This is what actually
# runs in production and is much smaller than the builder image.
FROM eclipse-temurin:17-jre-jammy AS runtime

# Good practice: run the application as a non-root user for security.
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Copy ONLY the compiled JAR from the builder stage.
COPY --from=builder /app/build/libs/custom-backend.jar app.jar

# Transfer ownership to the non-root user.
RUN chown appuser:appgroup app.jar

USER appuser

# Expose the default Spring Boot port. docker-compose maps this to the host.
EXPOSE 8080

# ── Docker health check ───────────────────────────────────────────────────────
# Probes the Spring Boot Actuator health endpoint every 30 s.
# docker-compose will mark the container as 'healthy' before dependents start.
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# ── Entrypoint ────────────────────────────────────────────────────────────────
# JVM tuning flags for containers:
#   -XX:+UseContainerSupport        — respects Docker CPU/memory limits
#   -XX:MaxRAMPercentage=75.0       — uses at most 75 % of the container RAM
#   -Djava.security.egd=...         — faster startup (avoids SecureRandom block)
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
