# =============================================================================
# Dockerfile — webapp-client (React + Vite + TypeScript)
# Multi-stage build:
#   Stage 1 (builder): Node.js installs dependencies and compiles with Vite.
#   Stage 2 (runtime): Nginx serves the static dist/ files — no Node in prod.
# =============================================================================

# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package manifests FIRST so Docker caches the npm ci layer separately.
# This layer is only invalidated when package.json or package-lock.json change,
# not on every source code edit — making rebuilds much faster.
COPY package.json package-lock.json ./

# 'npm ci' installs exact versions from package-lock.json.
RUN npm ci

# Copy the rest of the source tree.
# A single COPY . . is safer on Windows BuildKit than using shell fallback
# tricks like "COPY public ./public 2>/dev/null || true" which fail on Windows.
COPY . .

# Build arguments injected at docker compose build time.
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Produce the optimised static bundle in /app/dist.
RUN npm run build

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runtime

RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
