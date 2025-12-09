#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Upgrading pip..."
pip install --upgrade pip

echo "Installing dependencies..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
elif [ -f "backend/requirements.txt" ]; then
    pip install -r backend/requirements.txt
else
    echo "Error: requirements.txt not found"
    exit 1
fi
