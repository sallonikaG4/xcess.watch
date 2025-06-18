# GitHub to Server Deployment Guide

## Repository Structure (Production Ready)

Your XESS Club Security Management System is now fully configured for PostgreSQL deployment:

```
xess-club-security/
├── client/                     # React frontend
├── server/                     # Express backend
├── shared/                     # Shared types and schemas
├── database_backup.sql         # Current database with demo data
├── production_database.sql     # Latest database export
├── docker-compose.yml          # Docker deployment configuration
├── Dockerfile                  # Container configuration
├── .env.example               # Environment template
├── .gitignore                 # Git ignore rules
├── CREDENTIALS.md             # All login credentials
├── DEPLOYMENT.md              # Detailed deployment guide
└── README.md                  # Project documentation
```

## GitHub Push Commands

```bash
# Initialize git repository (if not already done)
git init
git add .
git commit -m "Initial commit: XESS Club Security Management System"

# Add GitHub remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/xess-club-security.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Server Deployment Steps

### 1. Clone on Your Server
```bash
git clone https://github.com/yourusername/xess-club-security.git
cd xess-club-security
```

### 2. Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Edit with your production values
nano .env
```

Required environment variables:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/xess_club_security
SESSION_SECRET=your-super-secret-session-key-minimum-32-characters
NODE_ENV=production
PORT=5000
```

### 3. Database Setup
```bash
# Create PostgreSQL database
sudo -u postgres createdb xess_club_security
sudo -u postgres createuser xess_user

# Set password for user
sudo -u postgres psql -c "ALTER USER xess_user PASSWORD 'your_secure_password';"

# Grant permissions
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE xess_club_security TO xess_user;"

# Import database structure and demo data
psql $DATABASE_URL < production_database.sql
```

### 4. Install Dependencies and Build
```bash
# Install Node.js dependencies
npm install

# Build the application
npm run build

# Push database schema (creates tables if needed)
npm run db:push
```

### 5. Start Application
```bash
# Start in production mode
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start "npm start" --name xess-club-security
pm2 save
pm2 startup
```

## Docker Deployment (Alternative)

```bash
# Build and start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## Nginx Configuration (Recommended)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Database Verification

After deployment, verify everything is working:

```sql
-- Check tables exist
\dt

-- Verify demo users
SELECT username, role FROM users WHERE username LIKE '%demo%';

-- Check clubs
SELECT name FROM clubs;

-- Verify guestlists
SELECT name, event_date FROM guestlists;
```

## Demo Credentials (Remove in Production)

- Super Admin: `admin_demo` / `123456`
- Club Manager: `club_manager_demo` / `123456`
- Security Lead: `security_lead_demo` / `123456`
- Security Staff: `security_staff_demo` / `123456`
- Employee: `employee_demo` / `123456`

## Production Security Checklist

- [ ] Change all demo passwords
- [ ] Set strong SESSION_SECRET (32+ characters)
- [ ] Configure firewall rules
- [ ] Set up SSL/TLS certificates
- [ ] Configure database backups
- [ ] Set up monitoring and logging
- [ ] Remove demo accounts if not needed
- [ ] Configure SMTP for email notifications
- [ ] Set up SMS service for alerts

## Maintenance Commands

```bash
# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Update application
git pull origin main
npm install
npm run build
npm run db:push
pm2 restart xess-club-security

# View application logs
pm2 logs xess-club-security
```

Your XESS system is now ready for production deployment with full PostgreSQL integration!