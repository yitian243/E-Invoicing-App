#!/bin/sh
set -e

# Create .env file from environment variables
cat > .env << EOF
# Backend server config
BACKEND_PORT=${BACKEND_PORT:-5000}
BACKEND_URL=${BACKEND_URL:-http://localhost:$BACKEND_PORT}

# Database Config
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_KEY=${SUPABASE_KEY}
SUPABASE_SERVICE_KEY=${SUPABASE_SERVICE_KEY}

# Email Config
GMAIL_USER=${GMAIL_USER}
GMAIL_APP_PASSWORD=${GMAIL_APP_PASSWORD}
EMAIL_FROM=${EMAIL_FROM}

# Other configs
NODE_ENV=${NODE_ENV:-production}
EOF

# Execute the main container command
exec "$@"
