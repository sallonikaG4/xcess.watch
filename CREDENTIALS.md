# XESS Club Security Management System - Credentials

## Demo User Accounts

The system includes pre-configured demo accounts for testing all user roles:

### Super Admin Account
- **Username**: `admin_demo`
- **Password**: `123456`
- **Permissions**: Full system access, user impersonation, platform settings, license management

### Club Manager Account
- **Username**: `club_manager_demo`
- **Password**: `123456`
- **Permissions**: Club management, guestlists, banned guests, staff oversight

### Security Team Leader Account
- **Username**: `security_lead_demo`
- **Password**: `123456`
- **Permissions**: Security operations, team management, incident reporting

### Security Personnel Account
- **Username**: `security_staff_demo`
- **Password**: `123456`
- **Permissions**: Guest check-ins, ID scanning, basic security functions

### Club Employee Account
- **Username**: `employee_demo`
- **Password**: `123456`
- **Permissions**: Limited access to basic functions

## Database Information

- **Database Type**: PostgreSQL (Neon serverless)
- **Connection**: Automatically configured via DATABASE_URL environment variable
- **Backup Location**: `database_backup.sql` in project root
- **Migration Command**: `npm run db:push`

## Application Access

- **Development URL**: Available via Replit workspace
- **Port**: 5000
- **Default Route**: `/auth` (redirects to login if not authenticated)

## Super Admin Features

The super admin account (`admin_demo`) has special capabilities:
- **User Impersonation**: Click "Impersonate" button next to any user to view system from their perspective
- **Platform Settings**: Access to SMTP, security policies, and system configuration
- **License Management**: Generate and manage 16-character license keys
- **Plugin System**: Install and configure system extensions

## Demo Club Setup

- **Club Name**: Demo Club
- **Address**: 123 Demo Street, Demo City
- **License Key**: XESS-DEMO-CLUB-2024-LIVE
- **All demo users are assigned to this club**

## Security Notes

- These are demo credentials for development/testing only
- Change passwords before production deployment
- Database contains sample data for testing all features
- All demo accounts have proper role assignments and club access

## Quick Start

1. Navigate to application URL
2. Use any demo account credentials above
3. Explore features based on user role permissions
4. Super admin can impersonate other users for complete testing

For production deployment, create new secure credentials and remove demo accounts.