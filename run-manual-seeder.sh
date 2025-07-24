#!/bin/bash
# Manual Database Seeder Script
# Runs system owner, application settings, and subscription plans setup
# 
# Usage: 
# bash run-manual-seeder.sh
# atau
# chmod +x run-manual-seeder.sh && ./run-manual-seeder.sh

echo "🌱 Starting Manual Database Seeder..."
echo "================================================"

# Run the TypeScript seeder
npx tsx server/manual-seeder.ts

echo "================================================"
echo "✅ Manual seeder completed!"
echo ""
echo "📝 Quick Setup Guide:"
echo "• Login: admin@refokus.com"
echo "• Password: RefokusAdmin2025!"
echo "• Change password after first login"
echo ""
echo "🚀 Now you can run: npm run dev"