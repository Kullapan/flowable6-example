# =============================================================================
# Dockerfile — flowable-engine (Spring Boot 2.7.18 / Java 11 / Flowable 6.7.2)
#
# Multi-stage build:
#   Stage 1 (builder) — JDK 11, Gradle wrapper, compiles → bootJar
#   Stage 2 (runtime) — JRE 11 only; copies the JAR → keeps image small
#
# Why JDK 11?
#   Flowable 6.7.2 is tested against Java 11.  The pom.xml sets
#   <java.version>11</java.version>; we mirror that here.
# =============================================================================

# ─── Stage 1: Build ──────────────────────────────────────────────────────────
# Eclipse Temurin is the community distribution of OpenJDK — smaller and
# better maintained inside Docker than the legacy openjdk images.
FROM eclipse-temurin:11-jdk-jammy AS builder

WORKDIR /app

# ── Copy Gradle wrapper first (Docker cache optimisation) ─────────────────────
# If only source files change (not build scripts or wrapper), Docker reuses the
# cached dependency-download layer — dramatically speeding up rebuilds.
COPY gradlew .
COPY gradle gradle

# Fix Windows line endings that would break sh on Linux, then make executable.
RUN sed -i 's/\r$//' gradlew && chmod +x gradlew

# Copy build declarations before source to cache the dep-download step.
COPY build.gradle .
COPY settings.gradle .

# Pre-fetch all declared dependencies.
# '--no-daemon' avoids a long-lived daemon process inside the container.
RUN ./gradlew dependencies --no-daemon

# ── Copy all source code ──────────────────────────────────────────────────────
COPY src src

# Build the executable fat-JAR.
# '-x test' skips unit tests — they should pass in CI before this image builds.
RUN ./gradlew bootJar -x test --no-daemon

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
# JRE only — no compiler, no Gradle, no source files.
# eclipse-temurin:11-jre-jammy is ~220 MB vs ~600 MB for the JDK image.
FROM eclipse-temurin:11-jre-jammy AS runtime

# Security best practice: run as a non-root user.
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# Copy ONLY the built JAR from Stage 1.
COPY --from=builder /app/build/libs/flowable-engine.jar app.jar

RUN chown appuser:appgroup app.jar

USER appuser

# Flowable engine REST API runs on port 8081 (matches application.properties).
EXPOSE 8081

# ── Health check ─────────────────────────────────────────────────────────────
# Spring Boot Actuator is NOT included in this module (pure Flowable REST).
# We probe the Flowable REST ping endpoint instead.
# The endpoint is secured with Basic Auth (admin:test from application.properties).
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=5 \
  CMD curl -f -u admin:test http://localhost:8081/process-api/management/engine \
  || exit 1

# ── Entrypoint ────────────────────────────────────────────────────────────────
# Container-aware JVM flags:
#   -XX:+UseContainerSupport   — respects Docker CPU/memory limits
#   -XX:MaxRAMPercentage=75.0  — caps heap at 75 % of container RAM
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
