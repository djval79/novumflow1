#!/bin/bash

# PgBouncer Setup Script for CareFlow AI
# This script sets up PgBouncer connection pooling

set -e

echo "🔧 Setting up PgBouncer for CareFlow AI..."

# Update package lists
sudo apt-get update

# Install PgBouncer
sudo apt-get install -y pgbouncer

# Create PgBouncer configuration directory
sudo mkdir -p /etc/pgbouncer

# Copy configuration
sudo cp config/pgbouncer.ini /etc/pgbouncer/pgbouncer.ini

# Create user authentication file
echo "\"careflow_user\" \"$(openssl rand -base64 32)\"" | sudo tee /etc/pgbouncer/userlist.txt

# Set proper permissions
sudo chmod 640 /etc/pgbouncer/userlist.txt
sudo chown pgbouncer:pgbouncer /etc/pgbouncer/*

# Enable PgBouncer service
sudo systemctl enable pgbouncer
sudo systemctl start pgbouncer

# Check if PgBouncer is running
if sudo systemctl is-active --quiet pgbouncer; then
    echo "✅ PgBouncer is running successfully"
    echo "📊 Connection pool status:"
    echo "SHOW POOLS;" | psql -h localhost -p 6432 -U careflow_user -d pgbouncer
else
    echo "❌ PgBouncer failed to start"
    echo "📋 Checking logs:"
    sudo journalctl -u pgbouncer -n 20
    exit 1
fi

echo "🎯 PgBouncer setup complete!"
echo "📝 Configuration Summary:"
echo "   - Listen port: 6432"
echo "   - Pool mode: transaction"
echo "   - Max client connections: 100"
echo "   - Default pool size: 20"
echo "   - Min pool size: 5"