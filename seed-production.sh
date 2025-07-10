#!/bin/bash

# Production Data Seeder
# This script seeds all essential production data including system owner and subscription plans

echo "🚀 Starting production data seeding..."
echo "Running: tsx server/create-production-seeder.ts"
echo ""

npx tsx server/create-production-seeder.ts

echo ""
echo "✅ Production seeding completed!"
echo "System owner account and subscription plans have been created"