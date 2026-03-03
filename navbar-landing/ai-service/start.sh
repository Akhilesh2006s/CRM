#!/bin/bash

# Start AI Service
echo "Starting AI Service..."
echo "Make sure you have installed dependencies: pip install -r requirements.txt"
echo ""

# Check if Python is available
if ! command -v python &> /dev/null; then
    echo "Error: Python is not installed or not in PATH"
    exit 1
fi

# Check if dependencies are installed
if ! python -c "import flask" 2>/dev/null; then
    echo "Warning: Flask not found. Installing dependencies..."
    pip install -r requirements.txt
fi

# Start the service
python app.py
