#!/bin/bash

# XESS Club Security Deployment Script
# Run this script on your VPS after cloning the repository

set -e

echo "Starting XESS Club Security deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}This script should not be run as root${NC}"
   exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
npm install --production

# Build application
echo -e "${YELLOW}Building application...${NC}"
npm run build

# Setup database
echo -e "${YELLOW}Setting up database...${NC}"
if command -v psql >/dev/null 2>&1; then
    echo "Testing database connection..."
    if psql -h localhost -U xess -d xess_club_security -c "SELECT 1;" >/dev/null 2>&1; then
        echo -e "${GREEN}Database connection successful${NC}"
        
        # Push schema
        echo "Creating database tables..."
        npm run db:push
        
        # Import demo data (optional)
        if [ -f "production_database.sql" ]; then
            echo "Importing demo data..."
            psql -h localhost -U xess -d xess_club_security < production_database.sql
            echo -e "${GREEN}Demo data imported${NC}"
        fi
    else
        echo -e "${RED}Database connection failed. Please check credentials and database setup.${NC}"
        exit 1
    fi
else
    echo -e "${RED}PostgreSQL client not found. Please install postgresql-client${NC}"
    exit 1
fi

# Setup PM2 if available
if command -v pm2 >/dev/null 2>&1; then
    echo -e "${YELLOW}Setting up PM2 process manager...${NC}"
    pm2 start ecosystem.config.js
    pm2 save
    echo -e "${GREEN}PM2 setup complete${NC}"
else
    echo -e "${YELLOW}PM2 not found. Install with: npm install -g pm2${NC}"
fi

# Setup Nginx configuration (if nginx is installed)
if command -v nginx >/dev/null 2>&1; then
    echo -e "${YELLOW}Nginx detected. Remember to:${NC}"
    echo "1. Copy scripts/nginx.conf to /etc/nginx/sites-available/xess-club-security"
    echo "2. Enable the site with: sudo ln -s /etc/nginx/sites-available/xess-club-security /etc/nginx/sites-enabled/"
    echo "3. Test with: sudo nginx -t"
    echo "4. Restart with: sudo systemctl restart nginx"
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure your domain in Nginx"
echo "2. Setup SSL certificate with Certbot"
echo "3. Login with demo credentials and change passwords"
echo ""
echo "Demo credentials:"
echo "- Super Admin: admin_demo / 123456"
echo "- Club Manager: club_manager_demo / 123456"
echo ""
echo "Application should be running on http://localhost:5000"