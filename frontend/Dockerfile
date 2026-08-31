# Stage 1: Build Frontend Assets with Node 22
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency specifications and install
COPY package*.json ./
RUN npm ci

# Copy source code and build production bundle
COPY . .
RUN npm run build

# Stage 2: Serve via Hardened Nginx Alpine
FROM nginx:alpine

# Install curl for health check
RUN apk add --no-cache curl

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/healthz || exit 1

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
