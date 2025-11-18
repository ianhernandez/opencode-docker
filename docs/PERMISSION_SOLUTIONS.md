# Docker Volume Permission Solutions Analysis

## 🔍 Root Cause

When using bind mounts in Docker (`./workspace:/workspace`), file permissions are **preserved from the host**. This creates a permission mismatch:

```
Host: files owned by root:root (UID 0)
  ↓ (bind mount)
Container: running as node user (UID 1000)
  ↓
Result: node user CANNOT write to root-owned files
```

The [`Dockerfile.opencode`](../Dockerfile.opencode:29) switches to `USER node`, but the volume mount at runtime **overrides** the file ownership set during `COPY --chown=node:node`.

---

## 🎯 Solution Options

### Option 1: Entrypoint Permission Fix (RECOMMENDED for Dokploy)

**Implementation:**
- Start container as root
- Fix permissions in entrypoint script
- Drop to node user before running OpenCode

**Changes Required:**
1. Remove `USER node` from Dockerfile
2. Update entrypoint to handle permission fix + user switching
3. No docker-compose.yml changes needed

**Pros:**
✅ Automatic - works on any deployment
✅ No manual intervention needed
✅ Production-ready for Dokploy
✅ Fixes permissions on every container start
✅ Compatible with CI/CD pipelines

**Cons:**
⚠️ Container must start as root (but drops to node quickly)
⚠️ Slight startup delay for chown operation
⚠️ More complex entrypoint script

**Code:**
```dockerfile
# Dockerfile.opencode - REMOVE this line:
# USER node

# Keep everything else the same
```

```bash
# docker-entrypoint.sh
#!/bin/bash
set -e

# Fix workspace permissions
echo "Fixing workspace permissions..."
chown -R node:node /workspace

# Setup auth as node user
if [ -n "$ANTHROPIC_API_KEY" ]; then
  echo "Setting up Anthropic credentials..."
  cat > /home/node/.local/share/opencode/auth.json <<EOF
{
  "anthropic": {
    "apiKey": "$ANTHROPIC_API_KEY"
  }
}
EOF
  chown node:node /home/node/.local/share/opencode/auth.json
  chmod 600 /home/node/.local/share/opencode/auth.json
fi

# Drop to node user and execute command
echo "Starting OpenCode as node user..."
exec gosu node "$@"
```

```dockerfile
# Also need to install gosu in Dockerfile:
RUN apt-get update && apt-get install -y gosu && rm -rf /var/lib/apt/lists/*
```

---

### Option 2: Named Volume Instead of Bind Mount

**Implementation:**
- Replace bind mount with Docker named volume
- Let Docker manage permissions

**Changes Required:**
```yaml
volumes:
  workspace-data:

services:
  opencode:
    volumes:
      - workspace-data:/workspace  # Named volume, not bind mount
```

**Pros:**
✅ Docker handles permissions automatically
✅ No permission conflicts
✅ Better for production

**Cons:**
❌ Can't easily access files from host
❌ Harder to develop locally
❌ Need docker cp or docker exec to view files
❌ Loses the "shared workspace" feature

**Verdict:** ❌ Not suitable - breaks the MVP's core feature of shared workspace access

---

### Option 3: Run Container as Root

**Implementation:**
- Remove `USER node` from Dockerfile
- Run everything as root

**Changes Required:**
```dockerfile
# Dockerfile.opencode - REMOVE:
# USER node
# That's it!
```

**Pros:**
✅ Simplest solution
✅ No permission issues
✅ Works immediately

**Cons:**
❌ Major security risk
❌ Bad practice for production
❌ Against Docker best practices
❌ Could compromise host if container is breached

**Verdict:** ❌ Not recommended for Dokploy production deployment

---

### Option 4: Init Container Pattern

**Implementation:**
- Add separate "init" container to fix permissions
- Main containers depend on it

**Changes Required:**
```yaml
services:
  init-permissions:
    image: alpine:latest
    command: sh -c "chown -R 1000:1000 /workspace"
    volumes:
      - ./workspace:/workspace
    networks:
      - dokploy-network

  opencode:
    depends_on:
      init-permissions:
        condition: service_completed_success
    # ... rest of config
```

**Pros:**
✅ Clean separation of concerns
✅ One-time permission fix
✅ Main container stays as node user

**Cons:**
⚠️ Requires docker-compose 2.x features
⚠️ More complex orchestration
⚠️ Init container runs every time
⚠️ May not work in all Dokploy configurations

**Verdict:** ⚠️ Possible but complex

---

### Option 5: Pre-deployment Manual Fix

**Implementation:**
- Fix permissions on host before deployment
- Document in deployment guide

**Command:**
```bash
sudo chown -R 1000:1000 ./workspace
```

**Pros:**
✅ Simple
✅ No code changes
✅ Works for local development

**Cons:**
❌ Requires manual intervention
❌ Not automated
❌ Breaks in CI/CD
❌ Not suitable for Dokploy automated deployments
❌ Fails when host UID doesn't match container UID

**Verdict:** ❌ Not suitable for production/Dokploy

---

### Option 6: Build-time Copy + Runtime Volume

**Implementation:**
- Copy workspace files at build time
- Use named volume for runtime persistence
- Sync changes back periodically

**Changes Required:**
- Complex multi-stage setup
- Need sync mechanism
- Volume initialization logic

**Pros:**
✅ Best security posture
✅ No permission issues

**Cons:**
❌ Very complex
❌ Hard to maintain
❌ Sync delays
❌ Over-engineered for this use case

**Verdict:** ❌ Too complex for MVP

---

## 🏆 Final Recommendation

### **Option 1: Entrypoint Permission Fix** is the best choice for Dokploy deployment

**Why:**
1. ✅ **Automated** - No manual steps needed
2. ✅ **Production-ready** - Used by many Docker images
3. ✅ **Dokploy-compatible** - Works in automated deployments
4. ✅ **Maintains security** - Drops to node user after setup
5. ✅ **Preserves functionality** - Keeps shared workspace feature

**What happens:**
```
Container starts as root
    ↓
Entrypoint fixes /workspace permissions
    ↓
Entrypoint switches to node user
    ↓
OpenCode runs as node user with correct permissions
```

---

## 📋 Implementation Plan

### Step 1: Update Dockerfile.opencode
```dockerfile
# Remove line 29:
# USER node

# Add gosu for safe user switching (after line 9):
RUN apt-get update && apt-get install -y \
  git \
  bash \
  curl \
  ca-certificates \
  gosu \
  && rm -rf /var/lib/apt/lists/*
```

### Step 2: Update docker-entrypoint.sh
```bash
#!/bin/bash
set -e

# Fix workspace permissions (running as root)
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
```

### Step 3: Test Locally
```bash
# Rebuild and test
docker-compose down
docker-compose build --no-cache opencode
docker-compose up opencode

# Verify it works
curl http://localhost:4096
```

### Step 4: Deploy to Dokploy
- Push changes to git
- Dokploy will rebuild and deploy automatically
- Permissions will be fixed on container startup

---

## 🔒 Security Considerations

**Q: Is it safe to start as root?**
A: Yes, when using the entrypoint pattern:
- Container starts as root (privileged)
- Immediately fixes permissions
- Drops to unprivileged user (`node`)
- Application runs as `node`, not root

This is a standard Docker pattern used by:
- Official PostgreSQL image
- Official MySQL image
- Official Redis image
- Many others

**Q: What if Dokploy doesn't allow root containers?**
A: Dokploy allows root containers by default. If there are restrictions, Option 4 (Init Container) would be the alternative.

---

## 📊 Comparison Matrix

| Option | Automation | Security | Complexity | Dokploy Ready | Recommended |
|--------|-----------|----------|-----------|---------------|-------------|
| 1. Entrypoint Fix | ✅ Auto | ✅ Good | 🟡 Medium | ✅ Yes | ⭐ **YES** |
| 2. Named Volume | ✅ Auto | ✅ Best | 🟡 Medium | ⚠️ Limited | ❌ No |
| 3. Run as Root | ✅ Auto | ❌ Poor | 🟢 Easy | ✅ Yes | ❌ No |
| 4. Init Container | ✅ Auto | ✅ Good | 🔴 Complex | ⚠️ Maybe | ⚠️ Maybe |
| 5. Manual Fix | ❌ Manual | ✅ Good | 🟢 Easy | ❌ No | ❌ No |
| 6. Hybrid | ✅ Auto | ✅ Best | 🔴 Very Complex | ⚠️ Maybe | ❌ No |

---

## 🚀 Next Steps

1. Review this analysis
2. Confirm Option 1 approach
3. Switch to Code mode to implement changes
4. Test locally
5. Deploy to Dokploy
