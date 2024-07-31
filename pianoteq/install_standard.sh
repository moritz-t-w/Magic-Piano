#!/bin/bash

# Pianoteq Standard Trial Installation Script for Ubuntu
# Based on the PKGBUILD file for Arch Linux by:
# Maintainer: Christopher Arndt <aur -at- chrisarndt -dot- de>
# Contributor: CrocoDuck <crocoduck dot oducks at gmail dot com>
# Contributor: Simon Thorpe <simon@hivetechnology.com.au>

set -e

PKGNAME="pianoteq-standard-trial"
PKGVER="8.3.1"
NAME="Pianoteq ${PKGVER%%.*}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root"
  exit 1
fi

# Install dependencies
apt-get update
apt-get install -y p7zip-full wget liboss4-salsa-asound2 libx11-6

# Download icon
wget -O pianoteq_icon_128.png "https://www.pianoteq.com/images/logo/pianoteq_icon_128.png"

# Extract archive
7z x "pianoteq_linux_trial_v${PKGVER//./}.7z"

# Determine architecture
if [ "$(uname -m)" == "x86_64" ]; then
  ARCHDIR="x86-64bit"
elif [ "$(uname -m)" == "armv7l" ]; then
  ARCHDIR="arm-32bit"
elif [ "$(uname -m)" == "aarch64" ]; then
  ARCHDIR="arm-64bit"
else
  echo "Unsupported architecture"
  exit 1
fi

cd "$NAME"

# Install executables and plugins
install -Dm 755 "$ARCHDIR/$NAME" -t "/usr/local/bin"
ln -sf "/usr/local/bin/$NAME" "/usr/local/bin/${PKGNAME}-${PKGVER%%.*}"
install -Dm 755 "$ARCHDIR/$NAME.so" -t "/usr/local/lib/vst"
install -Dm 755 "$ARCHDIR/$NAME.lv2"/*.so -t "/usr/local/lib/lv2/$NAME.lv2"
install -Dm 644 "$ARCHDIR/$NAME.lv2"/*.ttl -t "/usr/local/lib/lv2/$NAME.lv2"

# Install desktop launcher
install -Dm 644 "../pianoteq_icon_128.png" "/usr/share/pixmaps/${PKGNAME}.png"

# Create desktop file
cat > "/usr/share/applications/${PKGNAME}.desktop" << EOF
[Desktop Entry]
Type=Application
Name=$NAME
Comment=Physical modelling piano instrument standalone program, VST2 and LV2 plugin. STANDARD trial version
Exec="$NAME"
Icon=${PKGNAME}
Categories=Audio;AudioVideoEditing;Music;AudioVideo;
EOF

# Install license and documentation
install -Dm 644 *Licence* -t "/usr/share/licenses/$PKGNAME"
install -Dm 644 README_LINUX.txt Documentation/* -t "/usr/share/doc/$PKGNAME"

echo "Pianoteq Standard Trial has been installed successfully!"
