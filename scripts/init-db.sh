#!/bin/bash

echo "Checking if database tables exist..."

# Wait for database to be ready
sleep 5

# Check if tables exist
TABLES_EXIST=$(docker exec crs-db psql -U trader -d crs -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');" 2>/dev/null | xargs)

if [ "$TABLES_EXIST" = "f" ] || [ "$TABLES_EXIST" = "" ]; then
    echo "Tables don't exist. Initializing database schema..."
    docker exec -i crs-db psql -U trader -d crs < backend/src/utils/schema.sql
    echo "Database schema initialized."
else
    echo "Database tables already exist. Skipping initialization."
fi
