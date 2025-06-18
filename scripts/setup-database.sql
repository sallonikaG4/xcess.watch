-- XESS Club Security Database Setup Script
-- Run this as postgres user: sudo -u postgres psql < setup-database.sql

-- Create database
CREATE DATABASE xess_club_security;

-- Create user with specified credentials
CREATE USER xess WITH PASSWORD 'Luc1f3r$1926';

-- Grant all privileges on database
GRANT ALL PRIVILEGES ON DATABASE xess_club_security TO xess;

-- Connect to the database
\c xess_club_security

-- Grant schema permissions
GRANT ALL ON SCHEMA public TO xess;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO xess;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO xess;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO xess;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO xess;

-- Display confirmation
SELECT 'Database xess_club_security created successfully' AS status;