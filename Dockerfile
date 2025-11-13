# Simple Nginx image to serve the static dashboard
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy site content
COPY apresentacao/apresentacao.html /usr/share/nginx/html/
COPY data/ /usr/share/nginx/html/data/
COPY index.html /usr/share/nginx/html/

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost/healthz || exit 1
