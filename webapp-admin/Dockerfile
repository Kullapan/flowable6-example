# =============================================================================
# Dockerfile — webapp-admin (React + Vite + TypeScript / Admin Dashboard)
# =============================================================================

# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Separate package manifest copy for Docker layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the full source tree in one instruction.
# Single COPY . . avoids Windows BuildKit issues with shell fallback syntax.
COPY . .

# Build args for the admin UI.
ARG VITE_API_BASE_URL=http://localhost:8080
ARG VITE_FLOWABLE_UI_URL=http://localhost:8086
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_FLOWABLE_UI_URL=$VITE_FLOWABLE_UI_URL

RUN npm run build

# ─── Stage 2: Runtime ────────────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runtime

RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
