#!/bin/bash
# Script untuk menjalankan aplikasi di port 5001
# Usage: bash start-port-5001.sh

echo "🚀 Starting OKR Application on Port 5001..."
echo "📍 Setting PORT environment variable to 5001"

export PORT=5001
export NODE_ENV=development

echo "🔍 Configuration:"
echo "  - PORT: $PORT"
echo "  - NODE_ENV: $NODE_ENV"
echo "  - Working directory: $(pwd)"

echo "🚀 Starting server..."
npm run dev