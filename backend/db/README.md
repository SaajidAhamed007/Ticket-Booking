# EventX Platform - Database Setup Guide

This directory contains all SQL scripts needed to set up the EventX platform database.

## Files

- **schema.sql** - Complete database schema with all tables and relationships
- **seeds.sql** - Sample data for development and testing
- **setup.sh** - Automated setup script (Linux/Mac)

## Quick Setup

### Option 1: Automated Setup (Linux/Mac)

```bash
cd backend/db
chmod +x setup.sh
./setup.sh
```

This script will:
1. Create the database (if it doesn't exist)
2. Create all tables
3. Set up indexes and constraints

### Option 2: Manual Setup

#### Step 1: Create Database
```bash
psql -h localhost -U postgres -c "CREATE DATABASE Concurrency;"
```

#### Step 2: Create Tables
```bash
psql -h localhost -d Concurrency -U postgres -f backend/db/schema.sql
```

#### Step 3 (Optional): Add Sample Data
```bash
psql -h localhost -d Concurrency -U postgres -f backend/db/seeds.sql
```

### Option 3: Using PgAdmin GUI

1. Open PgAdmin
2. Connect to your PostgreSQL server
3. Create a new database named `Concurrency`
4. Open Query Tool
5. Copy the entire contents of `schema.sql`
6. Run the query
7. (Optional) Repeat steps 4-6 with `seeds.sql`

## Database Schema Overview

### Tables Created

1. **users** - User accounts (organizers and attendees)
2. **events** - Event details
3. **seat_tiers** - Pricing tiers (General, VIP, Premium)
4. **seats** - Individual seat records
5. **bookings** - Booking records
6. **booking_seats** - Junction table linking bookings to seats
7. **tickets** - Generated tickets with QR codes
8. **transactions** - Payment transaction logs

## Table Relationships

```
users (1) ──── (M) events (organizer_id)
events (1) ──── (M) seat_tiers
events (1) ──── (M) seats
seat_tiers (1) ──── (M) seats (tier_id)
events (1) ──── (M) bookings
users (1) ──── (M) bookings
bookings (1) ──── (M) booking_seats
seats (1) ──── (M) booking_seats
bookings (1) ──── (M) tickets
bookings (1) ──── (M) transactions
```

## Verify Installation

```sql
-- Connect to your database
psql -h localhost -d Concurrency -U postgres

-- List all tables
\dt

-- Count records
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'seat_tiers', COUNT(*) FROM seat_tiers
UNION ALL
SELECT 'seats', COUNT(*) FROM seats;
```

## Troubleshooting

### Connection Error: "role does not exist"
Replace `postgres` with your actual PostgreSQL user:
```bash
psql -h localhost -d Concurrency -U yourusername -f backend/db/schema.sql
```

### Connection Error: "FATAL: Ident authentication failed"
Update your `pg_hba.conf` file to use `md5` or `trust` authentication, or set password:
```bash
PGPASSWORD=yourpassword psql -h localhost -d Concurrency -U postgres -f backend/db/schema.sql
```

### Extension not found
If you see an error about `uuid-ossp` or `pgcrypto`:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

## Resetting the Database (Caution!)

To completely reset and recreate the database:

```bash
psql -h localhost -U postgres -c "DROP DATABASE IF EXISTS Concurrency;"
psql -h localhost -U postgres -f backend/db/schema.sql
```

## Environment Variables

Set these in your `.env` file:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=Concurrency
DB_USER=postgres
DB_PASSWORD=your_password
```

## Next Steps

After database setup:

1. Install dependencies: `npm install`
2. Create/update `.env` with database credentials
3. Start the server: `npm start`
4. Frontend will connect to backend APIs

## Support

For issues or questions about database setup, check the main README.md or create an issue in the repository.
