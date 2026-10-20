FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.inc
COPY index.html /usr/share/nginx/html/index.html
COPY public/ /usr/share/nginx/html/public/
EXPOSE 80
