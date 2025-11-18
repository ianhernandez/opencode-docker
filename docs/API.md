# Backend API Documentation

Complete REST API reference for managing OpenCode workspace files programmatically.

## Base URL
```
http://localhost:3000
```

---

## Endpoints

### 1. Health Check

Check if the backend service is running.

**Request:**
```bash
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "service": "opencode-backend",
  "opencodeUrl": "http://opencode:4096",
  "workspacePath": "/workspace"
}
```

**Example:**
```bash
curl http://localhost:3000/health
```

---

### 2. Workspace Info

Get information about the workspace.

**Request:**
```bash
GET /workspace/info
```

**Response:**
```json
{
  "path": "/workspace",
  "opencodeUI": "http://opencode:4096",
  "preview": "http://localhost:8080",
  "message": "Files in this workspace are editable via OpenCode UI and this API"
}
```

**Example:**
```bash
curl http://localhost:3000/workspace/info
```

---

### 3. List Files

Get a list of all files in the workspace.

**Request:**
```bash
GET /files
```

**Response:**
```json
{
  "files": [
    { "name": "index.html", "type": "file" },
    { "name": "opencode.json", "type": "file" },
    { "name": "README.md", "type": "file" }
  ]
}
```

**Example:**
```bash
curl http://localhost:3000/files
```

---

### 4. Read File

Read the contents of a specific file.

**Request:**
```bash
GET /files/:filename
```

**Response (Success):**
```json
{
  "filename": "index.html",
  "content": "<!DOCTYPE html>..."
}
```

**Response (Not Found):**
```json
{
  "error": "File not found"
}
```

**Example:**
```bash
curl http://localhost:3000/files/index.html
```

---

### 5. Write/Update File

Write or completely replace the contents of a file.

**Request:**
```bash
POST /files/:filename
Content-Type: application/json

{
  "content": "Your file content here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File index.html updated successfully",
  "filename": "index.html",
  "size": 123
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/files/index.html \
  -H "Content-Type: application/json" \
  -d '{"content": "<!DOCTYPE html><html><body><h1>Hello World</h1></body></html>"}'
```

---

### 6. Create New File

Create a new file (returns error if file already exists).

**Request:**
```bash
PUT /files/:filename
Content-Type: application/json

{
  "content": "Initial content"  # Optional, defaults to empty string
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "File newfile.txt created successfully",
  "filename": "newfile.txt"
}
```

**Response (Conflict):**
```json
{
  "error": "File already exists"
}
```

**Example:**
```bash
curl -X PUT http://localhost:3000/files/newfile.txt \
  -H "Content-Type: application/json" \
  -d '{"content": "This is a new file"}'
```

---

### 7. Append to File

Append content to the end of an existing file (creates file if it doesn't exist).

**Request:**
```bash
PATCH /files/:filename
Content-Type: application/json

{
  "content": "Content to append"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Content appended to log.txt",
  "filename": "log.txt",
  "totalSize": 456
}
```

**Example:**
```bash
curl -X PATCH http://localhost:3000/files/log.txt \
  -H "Content-Type: application/json" \
  -d '{"content": "\nNew log entry"}'
```

---

## Common Use Cases

### 1. Create a New HTML Page

```bash
curl -X PUT http://localhost:3000/files/about.html \
  -H "Content-Type: application/json" \
  -d '{
    "content": "<!DOCTYPE html><html><head><title>About</title></head><body><h1>About Us</h1></body></html>"
  }'
```

### 2. Read and Update a File

```bash
# Read current content
CONTENT=$(curl -s http://localhost:3000/files/index.html | jq -r '.content')

# Modify and write back
curl -X POST http://localhost:3000/files/index.html \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"$CONTENT\n<!-- Updated -->\"}"
```

### 3. Add Log Entry

```bash
curl -X PATCH http://localhost:3000/files/activity.log \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"$(date): User action performed\n\"}"
```

### 4. Batch Create Files

```bash
# Create multiple files
for file in page1.html page2.html page3.html; do
  curl -X PUT http://localhost:3000/files/$file \
    -H "Content-Type: application/json" \
    -d '{"content": "<h1>'$file'</h1>"}'
done
```

---

## Integration Examples

### JavaScript/TypeScript

```typescript
// Read file
const response = await fetch('http://localhost:3000/files/index.html');
const data = await response.json();
console.log(data.content);

// Update file
await fetch('http://localhost:3000/files/index.html', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ content: '<h1>Updated</h1>' })
});
```

### Python

```python
import requests

# Read file
response = requests.get('http://localhost:3000/files/index.html')
content = response.json()['content']

# Update file
requests.post(
    'http://localhost:3000/files/index.html',
    json={'content': '<h1>Updated from Python</h1>'}
)
```

### Shell Script

```bash
#!/bin/bash
# Backup and update
curl -s http://localhost:3000/files/index.html | \
  jq -r '.content' > backup.html

curl -X POST http://localhost:3000/files/index.html \
  -H "Content-Type: application/json" \
  -d @new_content.json
```

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200** - Success
- **201** - Created (for PUT requests)
- **400** - Bad Request (missing required fields)
- **404** - Not Found (file doesn't exist)
- **409** - Conflict (file already exists for PUT)
- **500** - Internal Server Error

Error responses include details:
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

---

## Notes

- All file operations are performed on the `/workspace` directory
- Changes are immediately reflected in the live preview at `http://localhost:8080`
- Files can also be edited via the OpenCode UI at `http://localhost:4096`
- The workspace uses bind mounts, so files persist on your local machine
- Maximum file size is limited by available memory

---

## Testing the API

Quick test to verify all endpoints:

```bash
# 1. Check health
curl http://localhost:3000/health

# 2. List files
curl http://localhost:3000/files

# 3. Create a test file
curl -X PUT http://localhost:3000/files/test.txt \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello API!"}'

# 4. Read it back
curl http://localhost:3000/files/test.txt

# 5. Update it
curl -X POST http://localhost:3000/files/test.txt \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated content"}'

# 6. Append to it
curl -X PATCH http://localhost:3000/files/test.txt \
  -H "Content-Type: application/json" \
  -d '{"content": "\nAppended line"}'

# 7. Read final result
curl http://localhost:3000/files/test.txt
```

---

## Live Preview Integration

All file changes are immediately visible:

1. **Make API changes** → Files update in `/workspace`
2. **View in browser** → http://localhost:8080 shows updates
3. **Edit with OpenCode** → http://localhost:4096 for AI assistance

This creates a powerful workflow where you can:
- Use the API for programmatic file management
- Use OpenCode UI for AI-powered editing
- See all changes live in the preview

---

## Need Help?

- **API Issues**: Check logs with `docker-compose logs backend`
- **File Permissions**: Ensure workspace directory is writable
- **OpenCode Integration**: Use the UI at http://localhost:4096 for AI edits
