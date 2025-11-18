#!/bin/bash
set -e

# Create auth.json with the API key from environment variable
if [ -n "$ANTHROPIC_API_KEY" ]; then
  echo "Setting up Anthropic credentials..."
  cat > /home/node/.local/share/opencode/auth.json <<EOF
{
  "anthropic": {
    "apiKey": "$ANTHROPIC_API_KEY"
  }
}
EOF
  chmod 600 /home/node/.local/share/opencode/auth.json
fi

# Execute the main command
exec "$@"
