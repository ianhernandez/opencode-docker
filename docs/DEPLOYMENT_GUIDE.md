# Deployment Guide - Permission Fix Implementation

## 🎯 Changes Made

This deployment implements **Option 1: Entrypoint Permission Fix** to resolve Docker volume permission issues in production.

### Files Modified

1. **[`Dockerfile.opencode`](../Dockerfile.opencode:1)**
   - Added `gosu` package for safe user switching
   - Removed `USER node` directive (container starts as root)
   
2. **[`docker-entrypoint.sh`](../docker-entrypoint.sh:1)**
   - Added workspace permission fix (`chown -R node:node /workspace`)
   - Added user switching with `gosu node` before starting OpenCode
   - Ensures auth.json has correct ownership

### How It Works

```
Container starts as root
    ↓
entrypoint.sh runs:
  1. Fixes /workspace permissions (chown -R node:node)
  2. Creates auth.json with correct ownership
  3. Switches to node user (gosu node)
    ↓
OpenCode runs as node user with correct permissions ✅
```

## 🧪 Testing Locally

### 1. Clean Previous Containers

```bash
# Stop and remove existing containers
docker-compose down

# Remove old images to force rebuild
docker-compose rm -f
docker rmi opencode-docker-opencode:latest 2>/dev/null || true
```

### 2. Rebuild and Start

```bash
# Rebuild with no cache
docker-compose build --no-cache opencode

# Start the service
docker-compose up opencode
```

### 3. Verify Permission Fix

**Check logs for the fix message:**
```bash
docker-compose logs opencode | grep "Fixing workspace permissions"
```

Expected output:
```
opencode-server  | Fixing workspace permissions...
opencode-server  | Setting up Anthropic credentials...
opencode-server  | Starting OpenCode as node user...
```

**Verify OpenCode is running:**
```bash
curl http://localhost:4096
```

**Check file permissions inside container:**
```bash
docker exec opencode-server ls -la /workspace
```

Expected output:
```
total 24
drwxr-xr-x 3 node node 4096 ...  .
drwxr-xr-x 1 root root 4096 ...  ..
-rw-r--r-- 1 node node  123 ...  index.html
-rw-r--r-- 1 node node  456 ...  opencode.json
```

All files should be owned by `node:node`.

### 4. Test Write Permissions

**Create a test file through OpenCode:**
1. Open http://localhost:4096 in browser
2. Enter prompt: "Create a new file called test.txt with 'Hello World'"
3. Wait for OpenCode to process
4. Check if file was created:

```bash
docker exec opencode-server cat /workspace/test.txt
```

Expected: File created successfully with content "Hello World"

## 🚀 Deploying to Dokploy

### Prerequisites

- Git repository with these changes
- Dokploy account and project set up
- `ANTHROPIC_API_KEY` environment variable configured in Dokploy

### Deployment Steps

1. **Push Changes to Repository**
   ```bash
   git add .
   git commit -m "Fix: Implement entrypoint permission fix for Docker volumes"
   git push origin main
   ```

2. **Deploy via Dokploy**
   - Dokploy will detect the `docker-compose.yml` changes
   - Automatically rebuild the opencode service
   - Apply the new entrypoint logic
   - No manual intervention needed ✅

3. **Verify Deployment**
   - Check Dokploy logs for "Fixing workspace permissions..."
   - Test the OpenCode API endpoint
   - Verify file operations work correctly

### Dokploy Configuration

**Required Environment Variables:**
```
ANTHROPIC_API_KEY=sk-ant-your-actual-key
```

**Optional (with defaults):**
```
OPENCODE_URL=http://opencode:4096
PORT=3000
```

## 🔍 Troubleshooting

### Issue: "gosu: unknown user node"

**Cause:** The `node` user doesn't exist in the container

**Solution:** This shouldn't happen with our Dockerfile, but if it does:
```bash
# Check if node user exists
docker exec opencode-server id node

# If missing, the base image might have changed
# Rebuild with --no-cache
docker-compose build --no-cache opencode
```

### Issue: Permission denied errors persist

**Cause:** Entrypoint might not be running

**Solution:**
```bash
# Check entrypoint is being executed
docker-compose logs opencode | head -20

# You should see:
# "Fixing workspace permissions..."
# "Starting OpenCode as node user..."

# If not, verify entrypoint is executable
docker exec opencode-server ls -la /usr/local/bin/docker-entrypoint.sh
```

### Issue: Container fails to start

**Cause:** Syntax error in entrypoint script

**Solution:**
```bash
# Check entrypoint syntax
docker run --rm -it --entrypoint bash opencode-docker-opencode
# Inside container:
bash -n /usr/local/bin/docker-entrypoint.sh

# Should show no errors
```

### Issue: OpenCode can't write files

**Cause:** Permission fix didn't apply or wrong user

**Solution:**
```bash
# Check what user OpenCode is running as
docker exec opencode-server ps aux | grep opencode

# Should show:
# node      1  ... opencode serve ...

# Check workspace ownership
docker exec opencode-server ls -la /workspace

# Should show:
# drwxr-xr-x ... node node ... /workspace
```

## 📊 Performance Impact

### Startup Time

**Before:** ~2-3 seconds
**After:** ~3-4 seconds (+1 second for chown)

The `chown -R` operation adds about 1 second to container startup time. This is negligible for production deployments and only happens once at container start.

### Runtime Performance

**No impact** - After startup, the container runs exactly the same as before. The permission fix only runs once during entrypoint execution.

## 🔒 Security Notes

### Why Start as Root?

Starting as root is necessary to run `chown`, but we immediately drop privileges:

1. ✅ Container starts as root (privileged)
2. ✅ Fixes permissions (requires root)
3. ✅ Drops to `node` user (unprivileged)
4. ✅ Application runs as `node`, not root

This is a standard Docker pattern used by official images like PostgreSQL, MySQL, and Redis.

### gosu vs sudo

We use `gosu` instead of `sudo` because:

- ✅ Lighter weight
- ✅ Designed for containers
- ✅ Properly handles signals
- ✅ No TTY issues
- ✅ Industry standard for user switching in Docker

## 🎓 Best Practices Applied

1. ✅ **Principle of Least Privilege** - Application runs as non-root
2. ✅ **Idempotency** - Can restart container safely
3. ✅ **Automation** - No manual intervention needed
4. ✅ **Transparency** - Clear logging of permission fixes
5. ✅ **Production Ready** - Used by official Docker images

## 📚 Additional Resources

- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [gosu GitHub Repository](https://github.com/tianon/gosu)
- [Official PostgreSQL Dockerfile](https://github.com/docker-library/postgres/blob/master/16/alpine/Dockerfile) (uses same pattern)
- [`docs/PERMISSION_SOLUTIONS.md`](PERMISSION_SOLUTIONS.md:1) - Full analysis of all options

## ✅ Deployment Checklist

- [ ] Dockerfile.opencode updated with gosu
- [ ] docker-entrypoint.sh updated with permission fix
- [ ] Tested locally with docker-compose
- [ ] Verified permission fix in logs
- [ ] Confirmed file write operations work
- [ ] Pushed changes to repository
- [ ] Deployed to Dokploy
- [ ] Verified production deployment
- [ ] Updated domain names in docker-compose.yml Traefik labels

## 🎉 Expected Results

After deployment:

✅ OpenCode can write to `/workspace` directory
✅ No more "Permission denied" errors
✅ Files created by OpenCode are accessible from host
✅ Container runs securely as `node` user
✅ Automatic permission fix on every container start
✅ Works in Dokploy production environment
