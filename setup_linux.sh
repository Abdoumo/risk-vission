#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================="
echo " Starting setup for AlgoRiskAI (Linux)..."
echo "=========================================="

# 1. Setup Python Virtual Environment
echo ""
echo ">>> Setting up Python virtual environment..."
python3 -m venv .venv
source .venv/bin/activate

# 2. Install Python dependencies
echo ""
echo ">>> Installing Python dependencies..."
if [ -f "AI_Pipeline/requirements.txt" ]; then
    pip install --upgrade pip
    pip install -r AI_Pipeline/requirements.txt
else
    echo "Warning: AI_Pipeline/requirements.txt not found!"
fi

# 3. Install Node.js dependencies for Frontend (ALGORISKAI)
echo ""
echo ">>> Installing frontend (ALGORISKAI) dependencies..."
if [ -d "ALGORISKAI" ]; then
    cd ALGORISKAI
    npm install
    cd ..
else
    echo "Warning: ALGORISKAI directory not found!"
fi

# 4. Install Node.js dependencies for Backend
echo ""
echo ">>> Installing backend dependencies..."
if [ -d "backend" ]; then
    cd backend
    npm install
    cd ..
else
    echo "Warning: backend directory not found!"
fi

echo ""
echo "=========================================="
echo " Setup completed successfully!"
echo "=========================================="
echo ""
echo "To activate the virtual environment later, run:"
echo "source .venv/bin/activate"
