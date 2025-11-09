#!/bin/bash

REDIS_HOST="127.0.0.1"
REDIS_PORT="6579"
MAX_WAIT=30
WAIT_TIME=0

echo "🔍 Verifica disponibilità Redis per Chainprompt AI..."

while [ $WAIT_TIME -lt $MAX_WAIT ]; do
  if timeout 1 bash -c "echo > /dev/tcp/$REDIS_HOST/$REDIS_PORT" 2>/dev/null; then
    echo "✅ Redis disponibile su $REDIS_HOST:$REDIS_PORT"
    exit 0
  fi
  
  echo "⏳ Attendo Redis... ($WAIT_TIME/$MAX_WAIT)"
  sleep 2
  WAIT_TIME=$((WAIT_TIME + 2))
done

echo "❌ Redis non disponibile dopo $MAX_WAIT secondi"
echo "🚀 Tentativo avvio automatico Redis..."

cd /opt/honeypot/docker && docker-compose up -d redis-ratelimit

sleep 5

if timeout 1 bash -c "echo > /dev/tcp/$REDIS_HOST/$REDIS_PORT" 2>/dev/null; then
  echo "✅ Redis avviato correttamente"
  exit 0
else
  echo "❌ Impossibile avviare Redis"
  exit 1
fi
