# Сборка и запуск приложения (используется Render, если в корне есть Dockerfile).
FROM node:22-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# package*.json — захватывает и package.json, и package-lock.json, если он есть.
COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY . .
RUN npm run build

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start"]
