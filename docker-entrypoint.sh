#!/bin/bash
set -e

# Fix workspace permissions (running as root at this point)
echo "Fixing workspace permissions..."
chown -R node:node /workspace

# Setup Anthropic credentials
if [ -n "$ANTHROPIC_API_KEY" ]; then
  echo "Setting up Anthropic credentials..."
  mkdir -p /home/node/.local/share/opencode
  cat > /home/node/.local/share/opencode/auth.json <<EOF
{
  "anthropic": {
    "apiKey": "$ANTHROPIC_API_KEY"
  }
}
EOF
  chown -R node:node /home/node/.local/share/opencode
  chmod 600 /home/node/.local/share/opencode/auth.json
fi

# Drop to node user and execute command
echo "Starting OpenCode as node user..."
exec gosu node "$@"
