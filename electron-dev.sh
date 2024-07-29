#!/bin/bash

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

echo "Starting midi player..."
jalv http://drobilla.net/plugins/mda/Piano &

# Run yarn dev in the background
yarnpkg dev &
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
echo "Waiting, just to be sure..."
sleep 5
echo "Starting Electron..."
export VITE_DEV_SERVER_URL=http://localhost:$port
yarnpkg electron . -- "$@" &
electron_pid=$!

# Wait for electron to exit
wait $electron_pid

# Kill the yarn dev process
kill $yarn_pid
