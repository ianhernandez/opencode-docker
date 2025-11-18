# 🚀 Quick Start Guide

Get started using your OpenCode Docker MVP in 5 minutes!

## ✅ Prerequisites

Make sure your services are running:

```bash
docker-compose ps
```

You should see three services running:
- `opencode-server` on port 4096
- `backend` on port 3000  
- `preview` on port 8080

If not running:
```bash
docker-compose up -d
```

---

## 🎯 Step 1: Test the Backend API

### Health Check
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "opencode-backend",
  "opencodeUrl": "http://opencode:4096",
  "workspacePath": "/workspace"
}
```

### List Workspace Files
```bash
curl http://localhost:3000/files
```

---

## 📝 Step 2: Create Your First File via API

Create a new file called `hello.html`:

```bash
curl -X PUT http://localhost:3000/files/hello.html \
  -H "Content-Type: application/json" \
  -d '{
    "content": "<!DOCTYPE html><html><head><title>Hello</title></head><body><h1>Created via API!</h1></body></html>"
  }'
```

### View it in the browser:
Open: http://localhost:8080/hello.html

---

## 🔄 Step 3: Update a File

Update the main `index.html`:

```bash
curl -X POST http://localhost:3000/files/index.html \
  -H "Content-Type: application/json" \
  -d '{
    "content": "<!DOCTYPE html><html><head><title>Updated</title></head><body><h1>Updated via API!</h1><p>Time: '"$(date)"'</p></body></html>"
  }'
```

### View the changes:
Open: http://localhost:8080/index.html

Refresh to see your updates!

---

## 📖 Step 4: Read File Contents

Read what's in `index.html`:

```bash
curl http://localhost:3000/files/index.html
```

Save it to a variable:
```bash
CONTENT=$(curl -s http://localhost:3000/files/index.html | jq -r '.content')
echo "$CONTENT"
```

---

## ➕ Step 5: Append to a File

Create a log file and add entries:

```bash
# Create initial log
curl -X PUT http://localhost:3000/files/activity.log \
  -H "Content-Type: application/json" \
  -d '{"content": "=== Activity Log ===\n"}'

# Append entries
curl -X PATCH http://localhost:3000/files/activity.log \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"$(date): First entry\n\"}"

curl -X PATCH http://localhost:3000/files/activity.log \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"$(date): Second entry\n\"}"

# Read the log
curl http://localhost:3000/files/activity.log
```

---

## 🤖 Step 6: Use OpenCode UI for AI Edits

While your API is great for programmatic changes, OpenCode provides AI-powered editing:

1. Open: http://localhost:4096
2. Use the chat interface to request changes like:
   - "Add a blue button to index.html"
   - "Create a CSS file with a dark theme"
   - "Add a contact form to index.html"

Changes made via OpenCode are immediately visible at http://localhost:8080!

---

## 🔗 Step 7: The Full Workflow

Combine all three interfaces:

```bash
# 1. Create a new page via API
curl -X PUT http://localhost:3000/files/contact.html \
  -H "Content-Type: application/json" \
  -d '{"content": "<!DOCTYPE html><html><body><h1>Contact</h1></body></html>"}'

# 2. View it
open http://localhost:8080/contact.html

# 3. Use OpenCode to enhance it
# Go to http://localhost:4096 and ask:
# "Add a contact form with name, email, and message fields to contact.html"

# 4. View the AI-enhanced version
open http://localhost:8080/contact.html

# 5. Read the updated content via API
curl http://localhost:3000/files/contact.html
```

---

## 🎨 Example: Build a Simple Website

Let's create a multi-page website:

### Create Home Page
```bash
curl -X PUT http://localhost:3000/files/home.html \
  -H "Content-Type: application/json" \
  -d '{
    "content": "<!DOCTYPE html><html><head><title>Home</title></head><body><nav><a href=\"home.html\">Home</a> | <a href=\"about.html\">About</a> | <a href=\"contact.html\">Contact</a></nav><h1>Welcome Home</h1></body></html>"
  }'
```

### Create About Page
```bash
curl -X PUT http://localhost:3000/files/about.html \
  -H "Content-Type: application/json" \
  -d '{
    "content": "<!DOCTYPE html><html><head><title>About</title></head><body><nav><a href=\"home.html\">Home</a> | <a href=\"about.html\">About</a> | <a href=\"contact.html\">Contact</a></nav><h1>About Us</h1><p>This site was built with OpenCode Docker MVP!</p></body></html>"
  }'
```

### Create Contact Page
```bash
curl -X PUT http://localhost:3000/files/contact.html \
  -H "Content-Type: application/json" \
  -d '{
    "content": "<!DOCTYPE html><html><head><title>Contact</title></head><body><nav><a href=\"home.html\">Home</a> | <a href=\"about.html\">About</a> | <a href=\"contact.html\">Contact</a></nav><h1>Contact Us</h1><p>Email: hello@example.com</p></body></html>"
  }'
```

### View Your Site
- Home: http://localhost:8080/home.html
- About: http://localhost:8080/about.html
- Contact: http://localhost:8080/contact.html

---

## 🔍 Troubleshooting

### Backend not responding?
```bash
# Check if running
docker-compose ps backend

# Check logs
docker-compose logs backend --tail=50

# Restart if needed
docker-compose restart backend
```

### File changes not showing?
```bash
# Hard refresh in browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Check workspace files
ls -la workspace/

# Restart preview server
docker-compose restart preview
```

### OpenCode not loading?
```bash
# Check if running
docker-compose ps opencode

# Check logs
docker-compose logs opencode --tail=50

# Restart
docker-compose restart opencode
```

---

## 📚 Next Steps

Now that you're up and running:

1. **Read the full API documentation**: [`API.md`](API.md:1)
2. **Check project structure**: [`README.md`](README.md:1)
3. **Build something amazing!**

---

## 💡 Pro Tips

### Using jq for JSON parsing
```bash
# Pretty print responses
curl http://localhost:3000/files | jq '.'

# Extract specific fields
curl -s http://localhost:3000/files/index.html | jq -r '.content'
```

### Creating a backup script
```bash
#!/bin/bash
# backup.sh - Backup all workspace files

for file in $(curl -s http://localhost:3000/files | jq -r '.files[].name'); do
  curl -s http://localhost:3000/files/$file | jq -r '.content' > "backup/$file"
  echo "Backed up: $file"
done
```

### Auto-deploying changes
```bash
#!/bin/bash
# deploy.sh - Deploy local files to workspace

for file in src/*.html; do
  filename=$(basename "$file")
  content=$(cat "$file")
  curl -X POST http://localhost:3000/files/$filename \
    -H "Content-Type: application/json" \
    -d "{\"content\": $(echo "$content" | jq -Rs .)}"
  echo "Deployed: $filename"
done
```

---

## 🎉 You're All Set!

Your OpenCode Docker MVP is fully operational. You can now:

- ✅ Manage files programmatically via REST API
- ✅ Use AI-powered editing with OpenCode UI  
- ✅ See changes instantly in the live preview
- ✅ Build and deploy with Docker Compose
- ✅ Scale to production with Dokploy

Happy coding! 🚀
