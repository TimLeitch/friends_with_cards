#!/bin/bash

# Friends with Cards Development Setup Script

echo "🎮 Setting up Friends with Cards development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

echo "🐳 Starting PostgreSQL and Redis containers..."

# Start the services
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services started successfully!"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "🔗 Connection Details:"
    echo "   PostgreSQL: localhost:5432"
    echo "   Redis: localhost:6379"
    echo "   Backend: localhost:3000"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Copy env.example to .env and adjust if needed"
    echo "   2. Run: npm install"
    echo "   3. Run: npm run dev"
    echo ""
    echo "🛑 To stop services: docker-compose down"
else
    echo "❌ Failed to start services. Check the logs with: docker-compose logs"
    exit 1
fi
