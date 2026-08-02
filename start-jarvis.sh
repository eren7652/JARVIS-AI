#!/bin/bash
cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
    echo "Installing dependencies for the first time..."
    npm install
fi

if [ ! -d public ]; then
    echo "Building the app for the first time..."
    npm run build
fi

echo "Starting JARVIS server..."
npm start &
SERVER_PID=$!

sleep 3

if command -v open >/dev/null; then
    open http://localhost:3000
elif command -v xdg-open >/dev/null; then
    xdg-open http://localhost:3000
fi

echo "JARVIS is running (PID $SERVER_PID). Press Ctrl+C to stop it."
wait $SERVER_PID
