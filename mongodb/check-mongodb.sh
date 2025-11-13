#!/bin/bash

CONTAINER_NAME="chainprompt-ai-mongodb"

docker ps --filter "name=$CONTAINER_NAME" --filter "status=running" | grep $CONTAINER_NAME >/dev/null

if [ $? -eq 0 ]; then
  echo "MongoDB container is running"
  exit 0
else
  echo "MongoDB container is not running"
  exit 1
fi
