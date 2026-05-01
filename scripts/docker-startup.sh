#!/bin/bash

# TaskHub Docker Startup Script
# This script initializes and starts all services

set -e

echo "==========================================="
echo "TaskHub Docker Environment Setup"
echo "==========================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Success: .env created. Please update it with your configuration."
    exit 1
fi

echo "Success: .env file found"
echo ""

# Check Docker and Docker Compose
echo "Checking Docker and Docker Compose..."
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Error: Docker Compose is not installed"
    exit 1
fi

echo "Success: Docker and Docker Compose are installed"
echo ""

# Start services
echo "Starting TaskHub services..."
docker-compose up -d

echo ""
echo "Waiting for services to become healthy (60 seconds)..."
sleep 30

# Wait for MongoDB master to be healthy
echo "Waiting for MongoDB Master..."
for i in {1..10}; do
    if docker exec taskhub-mongo-master mongosh -u root -p rootpassword --authenticationDatabase admin --eval "db.adminCommand('ping')" &>/dev/null; then
        echo "Success: MongoDB Master is ready"
        break
    fi
    if [ $i -eq 10 ]; then
        echo "Warning: MongoDB Master startup taking longer than expected"
    fi
    sleep 3
done

echo "Waiting for MongoDB Replicas..."
sleep 10

# Initialize replica set
echo "Initializing MongoDB Replica Set..."
docker-compose --profile init up mongo-init

echo ""
echo "==========================================="
echo "Success: TaskHub is now running!"
echo "==========================================="
echo ""
echo "Access your services at:"
echo "   App Instance 1:  http://localhost:3000"
echo "   App Instance 2:  http://localhost:3001"
echo "   App Instance 3:  http://localhost:3002"
echo "   MailCatcher UI:  http://localhost:1080"
echo ""
echo "Database connections:"
echo "   MongoDB:         localhost:27017 (user: root, pass: rootpassword)"
echo "   Redis:           localhost:6379 (pass: redispassword)"
echo "   MailCatcher:     localhost:1025 (SMTP)"
echo ""
echo "For more information, see DOCKER_SETUP.md"
echo ""
