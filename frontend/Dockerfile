# Frontend Dockerfile for Nutmeg Task Tracker
FROM nginx:alpine

# Install curl for health check
RUN apk add --no-cache curl

# Copy static assets to nginx html directory
COPY . /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/healthz || exit 1

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
