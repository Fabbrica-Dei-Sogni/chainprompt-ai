#!/bin/sh
if [ $NODE_ENV == "development" ] 
then
    echo "development mode running";
    npm install
    npm run start-dev
elif [ $NODE_ENV == "collaudo" ] 
then
    echo "collaudo mode running";
    npm run start
else
    echo "produzione mode running";
    npm run build
    npm run start:prod
fi