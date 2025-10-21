# Simple Nginx image to serve the static dashboard
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy site content
COPY apresentacao.html /usr/share/nginx/html/index.html
COPY data/ /usr/share/nginx/html/data/

# Healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ || exit 1
