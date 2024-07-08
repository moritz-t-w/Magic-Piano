#!/bin/bash

# Get the active window ID
WINDOW_ID=$(xdotool getactivewindow)

# Get the screen resolution
SCREEN_RESOLUTION=$(xrandr | grep ' connected' | grep -o '[0-9]*x[0-9]*+[0-9]*+[0-9]*' | head -n1)
SCREEN_WIDTH=$(echo $SCREEN_RESOLUTION | cut -d'x' -f1)
SCREEN_HEIGHT=$(echo $SCREEN_RESOLUTION | cut -d'x' -f2 | cut -d'+' -f1)

# Remove any fullscreen property first
wmctrl -ir $WINDOW_ID -b remove,fullscreen

# Set the window size to match the screen size
xdotool windowsize $WINDOW_ID $SCREEN_WIDTH $SCREEN_HEIGHT

# Move the window to the top-left corner
xdotool windowmove $WINDOW_ID 0 0

# Set the fullscreen property
wmctrl -ir $WINDOW_ID -b add,fullscreen
