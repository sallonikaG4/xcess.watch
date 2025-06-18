# XESS Club Security Management System - Production Installation Guide

## Server Requirements

- Ubuntu/Debian/CentOS Linux VPS
- Node.js 18+ 
- PostgreSQL 14+
- Nginx (recommended for reverse proxy)
- PM2 (for process management)
- Git

## Step 1: System Preparation

### Update system packages
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Install PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Install PM2 globally
```bash
sudo npm install -g pm2
```

## Step 2: Database Setup

### Create database and user
```bash
sudo -u postgres psql
```

In PostgreSQL shell:
```sql
-- Create database
CREATE DATABASE xess_club_security;

-- Create user with your specified credentials
CREATE USER xess WITH PASSWORD 'Luc1f3r$1926';

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE xess_club_security TO xess;

-- Grant schema permissions
\c xess_club_security
GRANT ALL ON SCHEMA public TO xess;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO xess;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO xess;

-- Exit PostgreSQL
\q
```

### Test database connection
```bash
psql -h localhost -U xess -d xess_club_security
# Enter password: Luc1f3r$1926
# Should connect successfully, then \q to exit
```

## Step 3: Application Deployment

### Clone repository
```bash
cd /var/www
sudo git clone https://github.com/yourusername/xess-club-security.git
sudo chown -R $USER:$USER xess-club-security
cd xess-club-security
```

### Install dependencies
```bash
npm install --production
```

### Configure environment
```bash
# The .env file is already configured with your credentials
# Verify the contents:
cat .env

# Should show:
# DATABASE_URL=postgresql://xess:Luc1f3r$1926@localhost:5432/xess_club_security
# NODE_ENV=production
# PORT=5000
```

### Initialize database schema
```bash
# Push database schema (creates all tables)
npm run db:push

# Import demo data (optional)
psql -h localhost -U xess -d xess_club_security < production_database.sql
```

### Build application
```bash
npm run build
```

### Test application
```bash
# Start application temporarily to test
npm start

# In another terminal, test if it's running
curl http://localhost:5000

# Stop with Ctrl+C when confirmed working
```

## Step 4: Process Management with PM2

### Create PM2 ecosystem file
```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'xess-club-security',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/xess-club-security',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/xess-error.log',
    out_file: '/var/log/xess-out.log',
    log_file: '/var/log/xess-combined.log',
    time: true
  }]
};
EOF
```

### Start application with PM2
```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions printed by the command above

# Monitor status
pm2 status
pm2 logs xess-club-security
```

## Step 5: Nginx Reverse Proxy Setup

### Create Nginx configuration
```bash
sudo tee /etc/nginx/sites-available/xess-club-security << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

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
        proxy_read_timeout 86400;
        
        # File upload size
        client_max_body_size 50M;
    }

    # Static file serving (if needed)
    location /uploads/ {
        alias /var/www/xess-club-security/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

### Enable site and restart Nginx
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/xess-club-security /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 6: SSL Certificate (Recommended)

### Install Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
```

### Get SSL certificate
```bash
# Replace your-domain.com with your actual domain
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### Setup auto-renewal
```bash
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 7: Firewall Configuration

### Configure UFW firewall
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 5432  # PostgreSQL (only if external access needed)
sudo ufw status
```

## Step 8: Verification

### Check all services
```bash
# PostgreSQL
sudo systemctl status postgresql

# Nginx
sudo systemctl status nginx

# Application
pm2 status

# Test database connection
psql -h localhost -U xess -d xess_club_security -c "SELECT COUNT(*) FROM users;"
```

### Access your application
```
http://your-domain.com
```

### Demo Login Credentials
- **Super Admin**: `admin_demo` / `123456`
- **Club Manager**: `club_manager_demo` / `123456`
- **Security Lead**: `security_lead_demo` / `123456`
- **Security Staff**: `security_staff_demo` / `123456`
- **Employee**: `employee_demo` / `123456`

## Maintenance Commands

### View application logs
```bash
pm2 logs xess-club-security
tail -f /var/log/xess-combined.log
```

### Restart application
```bash
pm2 restart xess-club-security
```

### Update application
```bash
cd /var/www/xess-club-security
git pull origin main
npm install --production
npm run build
npm run db:push
pm2 restart xess-club-security
```

### Database backup
```bash
# Create backup
pg_dump -h localhost -U xess xess_club_security > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup (if needed)
# psql -h localhost -U xess -d xess_club_security < backup_file.sql
```

### Monitor system resources
```bash
pm2 monit
htop
df -h
```

## Security Hardening (Recommended)

### Change demo passwords immediately
1. Login as admin_demo
2. Go to User Management
3. Change all demo account passwords
4. Or delete demo accounts if not needed

### Additional security measures
```bash
# Disable password authentication for SSH (use SSH keys)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Update system regularly
sudo apt update && sudo apt upgrade -y

# Monitor logs
sudo tail -f /var/log/auth.log
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### Application won't start
```bash
# Check logs
pm2 logs xess-club-security

# Check database connection
psql -h localhost -U xess -d xess_club_security

# Check environment variables
pm2 show xess-club-security
```

### Database connection issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check if database exists
sudo -u postgres psql -l | grep xess

# Reset database permissions
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE xess_club_security TO xess;"
```

### Nginx issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log
```

Your XESS Club Security Management System is now running in production with PostgreSQL!