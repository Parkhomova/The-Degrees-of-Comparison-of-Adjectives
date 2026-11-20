#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "→ применяю схему БД (drizzle-kit push)"
  npx drizzle-kit push || echo "⚠ схему применить не удалось — стартую, приложение перейдёт в автономный режим"
fi

exec "$@"
