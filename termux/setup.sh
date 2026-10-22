#!/bin/bash
echo "Updating packages..."
pkg update && pkg upgrade -y
echo "Installing dependencies..."
pkg install -y openjdk-17 aapt ecj dx apksigner termux-api
echo "Setup complete."
