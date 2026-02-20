#!/bin/bash

# Obuna Bot - Deploy Script
# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}  Obuna Bot Deployment Script${NC}"
echo -e "${GREEN}==================================${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root${NC}"
  exit 1
fi

# Pull latest changes
echo -e "\n${YELLOW}📥 Pulling latest changes...${NC}"
git pull origin main || git pull origin master

# Stop existing containers
echo -e "\n${YELLOW}🛑 Stopping existing containers...${NC}"
docker compose -f docker-compose.prod.yml down

# Remove old images
echo -e "\n${YELLOW}🗑️ Cleaning up old images...${NC}"
docker system prune -af --volumes

# Build new images
echo -e "\n${YELLOW}🔨 Building new images...${NC}"
docker compose -f docker-compose.prod.yml build --no-cache

# Start containers
echo -e "\n${YELLOW}🚀 Starting containers...${NC}"
docker compose -f docker-compose.prod.yml up -d

# Wait for services to start
echo -e "\n${YELLOW}⏳ Waiting for services to start...${NC}"
sleep 10

# Check status
echo -e "\n${YELLOW}📊 Container status:${NC}"
docker compose -f docker-compose.prod.yml ps

# Show logs
echo -e "\n${YELLOW}📝 Recent logs:${NC}"
docker compose -f docker-compose.prod.yml logs --tail=50 bot

echo -e "\n${GREEN}✅ Deployment completed!${NC}"
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}Bot is running at: http://$(hostname -I | awk '{print $1}'):3000${NC}"
echo -e "${GREEN}==================================${NC}"
