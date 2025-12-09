#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Upgrading pip..."
pip install --upgrade pip

echo "Installing dependencies..."
pip install -r backend/requirements.txt
