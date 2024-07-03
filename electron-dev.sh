#!/bin/bash

if command -v yarnpkg >/dev/null 2>&1; then
	alias yarn=yarnpkg
fi

RETRY_INTERVAL=1

# Function to check if a port is in use
port_in_use() {
	lsof -i :$1 >/dev/null 2>&1
	return $?
}

# Find an available port starting from 8080
port=8080
while port_in_use $port; do
	((port++))
done

echo "Predicted port: $port"

# Run yarn dev in the background
yarn dev &
yarn_pid=$!

# Function to check if the port is open
is_port_open() {
	ss -tuln | grep -q ":$1 "
	return $?
}

# Wait for the port to open
echo "Waiting for port $port to open..."
while ! is_port_open $port; do
	sleep $RETRY_INTERVAL
done

echo "Port $port is now open"

# Run electron with additional arguments
echo "Starting Electron..."
yarn electron -- "http://localhost:$port" "$@" &
electron_pid=$!

# Wait for electron to exit
wait $electron_pid

# Kill the yarn dev process
kill $yarn_pid
