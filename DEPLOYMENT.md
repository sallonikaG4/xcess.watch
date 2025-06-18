# XESS Club Security Management - Deployment Guide

## Database Migration to PostgreSQL

This project is configured to use PostgreSQL exclusively. No local storage or in-memory data is used.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Environment Setup

1. **Clone the Repository**
   ```bash
   git clone <your-repo-url>
   cd xess-club-security
   npm install
   ```

2. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb xess_club_security
   
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your database credentials
   DATABASE_URL=postgresql://username:password@localhost:5432/xess_club_security
   SESSION_SECRET=your-super-secret-session-key
   ```

3. **Database Migration**
   ```bash
   # Push schema to database (creates all tables)
   npm run db:push
   
   # Optional: Import demo data
   psql $DATABASE_URL < database_backup.sql
   ```

4. **Start Application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Database Schema

The application creates 12 tables automatically:
- `users` - User accounts with role-based permissions
- `clubs` - Venue management
- `banned_guests` - Security ban tracking
- `guestlists` - Event guest management
- `guestlist_entries` - Individual guest entries
- `user_club_assignments` - User-club relationships
- `chat_messages` - Real-time communication
- `notifications` - System alerts
- `activity_logs` - Audit trail
- `licenses` - License key management
- `security_companies` - Company information
- `session` - User session storage

## Production Deployment

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Variables (Production)
```bash
DATABASE_URL=postgresql://user:pass@db-host:5432/xess_club_security
SESSION_SECRET=very-long-random-string-for-production
NODE_ENV=production
PORT=5000
```

### Database Backup
```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql $DATABASE_URL < backup_file.sql
```

## Security Considerations

1. **Change Default Credentials**: Remove or change demo account passwords
2. **Environment Variables**: Use secure random values for SESSION_SECRET
3. **Database Access**: Restrict database access to application only
4. **HTTPS**: Enable SSL/TLS in production
5. **Rate Limiting**: Configure appropriate request limits

## Demo Data Removal (Production)

```sql
-- Remove demo accounts (optional)
DELETE FROM user_club_assignments WHERE user_id IN (
  SELECT id FROM users WHERE username LIKE '%demo%'
);
DELETE FROM users WHERE username LIKE '%demo%';

-- Remove demo club (optional)
DELETE FROM clubs WHERE name = 'Demo Club';
```

## Monitoring

- Application logs via Winston
- Database performance monitoring
- User activity tracking in `activity_logs` table
- Real-time metrics via dashboard

## Troubleshooting

### Database Connection Issues
1. Verify DATABASE_URL format
2. Check PostgreSQL service status
3. Confirm database exists and user has permissions

### Migration Issues
```bash
# Reset database (development only)
npm run db:drop
npm run db:push

# Check migration status
npm run db:check
```

### Common Errors
- **Session errors**: Check SESSION_SECRET is set
- **Permission errors**: Verify user roles and club assignments
- **Database errors**: Check PostgreSQL logs and connection

## Support

For deployment issues, check:
1. Database connection and credentials
2. Environment variable configuration
3. Network access and firewall settings
4. Application logs for specific errors