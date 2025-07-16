#!/bin/bash

# Start Redis (if not already running)
if ! pgrep -x "redis-server" > /dev/null
then
  echo "Starting Redis..."
  redis-server > /dev/null 2>&1 &
else
  echo "Redis already running."
fi

# Start Sidekiq
cd backend
echo "Starting Sidekiq..."
bundle exec sidekiq > ../sidekiq.log 2>&1 &

# Start Rails
echo "Starting Rails server..."
bundle exec rails s > ../rails.log 2>&1 &

# Return to project root for frontend
cd ..
echo "Starting React frontend..."
npm install
npm run dev
