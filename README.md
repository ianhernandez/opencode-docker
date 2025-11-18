# 🌐 OpenCode Docker MVP

A complete Docker-based setup for running OpenCode with live preview capabilities, deployable via Dokploy.

## 🎯 Features

- **OpenCode API Server** - AI-powered code editing through REST API
- **Live Preview Server** - Instant preview of workspace changes
- **TypeScript Backend** - Bun-powered API for sending prompts to OpenCode
- **Shared Workspace** - Real-time file synchronization between services
- **Docker Compose** - Easy orchestration of all services
- **Dokploy Ready** - Production deployment ready

## 📁 Project Structure

```
opencode-docker/
├── docker-compose.yml          # Orchestrates all services
├── Dockerfile.opencode         # OpenCode server container
├── Dockerfile.preview          # Live preview nginx server
├── Dockerfile.backend          # Node.js TypeScript backend
├── .env.example                # Environment variables template
├── backend/
│   ├── package.json           # Backend dependencies (using bun)
│   ├── tsconfig.json          # TypeScript configuration
│   └── src/
│       └── index.ts           # Backend API server
└── workspace/
    ├── index.html             # Main HTML file (editable by AI)
    ├── opencode.json          # OpenCode configuration
    └── README.md              # Workspace documentation
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose installed
- Anthropic API key ([get one here](https://console.anthropic.com/))

### Setup

1. **Clone or navigate to this directory**
   ```bash
   cd opencode-docker
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Add your Anthropic API key**
   ```bash
   # Edit .env file
   ANTHROPIC_API_KEY=sk-ant-your-api-key-here
   ```

4. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

   Or run in detached mode:
   ```bash
   docker-compose up -d --build
   ```

### Services & Ports

Once running, you can access:

- **Backend API**: http://localhost:3000
- **Live Preview**: http://localhost:8080
- **OpenCode Server**: http://localhost:4096

## 🧪 Testing the Setup

### 1. Check Service Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{"status":"ok","service":"opencode-backend"}
```

### 2. Use OpenCode Web UI

**OpenCode provides a web-based interface** instead of a REST API:

1. Open http://localhost:4096 in your browser
2. You'll see the OpenCode AI interface
3. Type your prompt: "Add a blue button to index.html"
4. OpenCode will modify the files in the workspace

### 3. View Changes Live

Open http://localhost:8080 in your browser to see the updated HTML file instantly!

**Note:** Files are shared via bind mount (`./workspace`), so changes are immediately visible.

## 🛠️ Development

### Local Backend Development

If you want to develop the backend locally without Docker:

```bash
cd backend

# Install dependencies with bun
bun install

# Run in development mode (with watch)
bun dev

# Run production mode
bun start
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | *Required* |
| `OPENCODE_URL` | OpenCode server URL | `http://opencode:4096` |
| `PORT` | Backend server port | `3000` |

## 🏗️ Architecture

```
                    ┌────────────────────────┐
                    │     Bun Backend        │
                    │  (TypeScript)          │
                    │  Port: 3000           │
                    └──────────┬─────────────┘
                               │ HTTP API
                               ▼
                    ┌────────────────────────┐
                    │   OpenCode Server      │
                    │  (AI Code Editor)      │
                    │  Port: 4096           │
                    └──────────┬─────────────┘
                               │ Shared Volume
                               ▼
                    ┌────────────────────────┐
                    │   Workspace Volume     │
                    │  index.html, etc.     │
                    └──────────┬─────────────┘
                               │
                               ▼
                    ┌────────────────────────┐
                    │    Preview Server      │
                    │  (Nginx)              │
                    │  Port: 8080           │
                    └────────────────────────┘
```

## 📝 API Reference

### POST /edit

Send a prompt to OpenCode to modify workspace files.

**Request:**
```json
{
  "prompt": "Make the background blue and add a header"
}
```

**Response (Success):**
```json
{
  "success": true,
  "sessionId": "session-uuid",
  "message": "Task sent to OpenCode"
}
```

**Response (Error):**
```json
{
  "error": "Failed to process request",
  "details": "Error message"
}
```

### GET /health

Check if the backend service is running.

**Response:**
```json
{
  "status": "ok",
  "service": "opencode-backend"
}
```

## 🐳 Docker Commands

### Start services
```bash
docker-compose up
```

### Start in background
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f
```

### Rebuild containers
```bash
docker-compose up --build
```

### Remove volumes (clean slate)
```bash
docker-compose down -v
```

## 🚢 Deployment with Dokploy

This project is ready for deployment with Dokploy:

1. Push your code to a Git repository
2. In Dokploy, create a new application
3. Point it to your repository
4. Set environment variables in Dokploy:
   - `ANTHROPIC_API_KEY`
5. Deploy!

Dokploy will automatically detect the `docker-compose.yml` and deploy all services.

## 🔧 Customization

### Adding More Files to Workspace

Simply add files to the `workspace/` directory. They will be:
- Accessible by OpenCode for editing
- Served by the preview server at http://localhost:8080

### Modifying Backend

The backend is written in TypeScript. Edit [`backend/src/index.ts`](backend/src/index.ts:1) to add new endpoints or modify behavior.

### OpenCode Configuration

Edit [`workspace/opencode.json`](workspace/opencode.json:1) to change OpenCode permissions and tools.

## 🐛 Troubleshooting

### OpenCode server not starting

- Check your API key is set correctly in `.env`
- View logs: `docker-compose logs opencode`

### Backend can't connect to OpenCode

- Ensure all services are running: `docker-compose ps`
- Check network connectivity: `docker-compose logs backend`

### Changes not appearing in preview

- Refresh your browser
- Check OpenCode logs: `docker-compose logs opencode`
- Verify the workspace volume is mounted correctly

## 📚 Resources

- [OpenCode Documentation](https://docs.opencode.ai)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [Dokploy Documentation](https://dokploy.com/docs)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Feel free to open issues or submit PRs.
