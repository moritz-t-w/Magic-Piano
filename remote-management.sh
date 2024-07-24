#!/bin/bash

# Load secrets from file
source .env

# Check if secrets are loaded
if [ -z "$SSH_USER" ] || [ -z "$SSH_HOST" ] || [ -z "$SSH_PORT" ]; then
	echo "Error: SSH details not found in secrets file."
	exit 1
fi

# Function to check if a command exists
command_exists() {
	command -v "$1" >/dev/null 2>&1
}

# Check if required commands exist
if ! command_exists ssh; then
	echo "Error: ssh is not installed. Please install ssh and try again."
	exit 1
fi

# SSH command with X11 forwarding
ssh_command="ssh -X -p $SSH_PORT $SSH_USER@$SSH_HOST"

# Launch qpwgraph
echo "Launching qpwgraph..."
$ssh_command "qpwgraph" &

# Launch alsa-scarlett-gui
echo "Launching alsa-scarlett-gui..."
$ssh_command "alsa-scarlett-gui" &

# Launch vmpk
echo "Launching vmpk..."
$ssh_command "vmpk" &

echo "Applications launched. Check your X11 display for the GUI windows."
