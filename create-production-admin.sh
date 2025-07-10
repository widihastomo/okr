#!/bin/bash

# Production System Owner Creator
# This script creates a system owner account for production deployment

echo "🔐 Creating production system owner account..."
echo "Running: tsx server/create-production-admin.ts"
echo ""

npx tsx server/create-production-admin.ts

echo ""
echo "✅ Production admin creation script completed!"
echo "Use the displayed credentials to log in as system owner"