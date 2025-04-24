#!/bin/sh
set -e

# Create env-config.js with environment variables at runtime
cat > /usr/share/nginx/html/env-config.js << EOF
window.ENV = {
  BACKEND_URL: '${BACKEND_URL:-http://localhost:5000}'
};
EOF

# Execute the main container command
exec "$@"
