#!/bin/bash

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file from .env.example"
fi

# Build and start containers
docker-compose up -d --build

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run backend migrations
docker-compose exec backend python manage.py migrate

# Create superuser if it doesn't exist
docker-compose exec backend python manage.py createsuperuser --noinput \
    --username admin \
    --email admin@example.com \
    || true

# Run seed script
docker-compose exec backend python scripts/seed_data.py

echo "Development environment is ready!"
echo "Access the application at:"
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000/api"
echo "Admin interface: http://localhost:8000/admin" 