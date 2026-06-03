#!/bin/bash

# EventX Platform - Database Setup Script
# This script creates all required tables in PostgreSQL

set -e

# Configuration
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-Concurrency}
DB_USER=${DB_USER:-postgres}

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}EventX Platform - Database Setup${NC}"
echo "========================================"
echo "Host: $DB_HOST"
echo "Port: $DB_PORT"
echo "Database: $DB_NAME"
echo "User: $DB_USER"
echo ""

# Ask for confirmation
read -p "Do you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Setup cancelled.${NC}"
    exit 1
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if schema.sql exists
if [ ! -f "$SCRIPT_DIR/schema.sql" ]; then
    echo -e "${RED}Error: schema.sql not found in $SCRIPT_DIR${NC}"
    exit 1
fi

# Create database if it doesn't exist
echo -e "${YELLOW}Creating database (if not exists)...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true

# Run schema.sql
echo -e "${YELLOW}Creating tables...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -U "$DB_USER" -f "$SCRIPT_DIR/schema.sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database setup completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update your .env file with database credentials"
    echo "2. Run: npm install (to install dependencies)"
    echo "3. Run: npm start (to start the server)"
    echo ""
else
    echo -e "${RED}✗ Database setup failed.${NC}"
    exit 1
fi
