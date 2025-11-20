# 🌐 OpenCode Docker Full-Stack

A complete Docker-based setup for running OpenCode with a modern full-stack application including React Router frontend, Hono API backend, and PostgreSQL database.

## 🎯 Features

- **OpenCode AI Server** - AI-powered code editing through web interface
- **Live Preview Server** - Instant preview of workspace changes
- **Modern Web App** - React Router 7 with SSR and TailwindCSS
- **Production API** - Hono REST API with OpenAPI documentation
- **PostgreSQL Database** - Production-grade data persistence
- **Shared Workspace** - Real-time file synchronization between services
- **Docker Compose** - Easy orchestration of all services
- **Dokploy Ready** - Production deployment ready

## 📁 Project Structure

```
opencode-docker/
├── docker-compose.yml          # Orchestrates all 5 services
├── Dockerfile.opencode         # OpenCode server container
├── Dockerfile.preview          # Live preview nginx server
├── .env.example                # Environment variables template
├── docs/                       # Project documentation
│   ├── INTEGRATION_PLAN.md    # Integration architecture
│   ├── DEPLOYMENT_GUIDE.md    # Deployment instructions
│   └── ...
├── workspace/                  # Shared workspace for OpenCode
│   ├── index.html             # Main HTML file (editable by AI)
│   └── opencode.json          # OpenCode configuration
└── www/                        # Full-stack application
    ├── apps/
    │   ├── api/               # Hono API Backend
    │   │   ├── src/
    │   │   │   ├── index.ts   # API entry point
    │   │   │   ├── db/        # Database layer
    │   │   │   └── features/  # Feature modules
    │   │   ├── Dockerfile
    │   │   └── package.json
    │   └── web/               # React Router Frontend
    │       ├── app/
    │       │   ├── root.tsx   # App root
    │       │   └── routes/    # Page routes
    │       ├── Dockerfile
    │       └── package.json
    └── docs/
        ├── ARCHITECTURE.md    # Full-stack architecture
        └── QUICK_START.md     # Getting started
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

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| **Web App** | 3000 | http://localhost:3000 | React Router frontend with SSR |
| **API** | 9999 | http://localhost:9999 | Hono REST API |
| **API Docs** | 9999 | http://localhost:9999/reference | Interactive OpenAPI documentation |
| **OpenCode** | 4096 | http://localhost:4096 | AI code editor interface |
| **Preview** | 8080 | http://localhost:8080 | Workspace file preview |
| **PostgreSQL** | 5432 | localhost:5432 | Database (internal) |

## 🧪 Testing the Setup

### 1. Check All Services

```bash
# Check all containers are running
docker-compose ps

# Expected output: 5 services running
# - opencode-server
# - preview
# - postgres
# - api
# - web
```

### 2. Test Web Application

Open http://localhost:3000 in your browser to see the React Router web application.

### 3. Test API

```bash
# Health check
curl http://localhost:9999/

# View interactive API documentation
open http://localhost:9999/reference
```

### 4. Test OpenCode

1. Open http://localhost:4096 in your browser
2. You'll see the OpenCode AI interface
3. Type your prompt: "Add a blue button to index.html"
4. OpenCode will modify the files in the workspace

### 5. View Changes Live

Open http://localhost:8080 in your browser to see the updated workspace files!

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       Docker Network                              │
│                                                                   │
│  ┌──────────────┐        ┌───────────────┐       ┌────────────┐ │
│  │   React      │  SSR   │   Hono API    │       │ PostgreSQL │ │
│  │   Router     │───────▶│   (Node.js)   │──────▶│    16      │ │
│  │   (web)      │ http://│   (api)       │       │            │ │
│  │              │ api:9999│               │       │            │ │
│  │   Port 3000  │        │   Port 9999   │       │ Port 5432  │ │
│  └──────────────┘        └───────┬───────┘       └────────────┘ │
│                                   │                               │
│  ┌──────────────┐        ┌───────▼───────┐                      │
│  │   Preview    │        │   Workspace   │                      │
│  │   (nginx)    │◀───────│   Volume      │◀─────┐               │
│  │   Port 8080  │        │               │      │               │
│  └──────────────┘        └───────────────┘      │               │
│                                                  │               │
│  ┌──────────────┐                               │               │
│  │   OpenCode   │                               │               │
│  │   AI Server  │───────────────────────────────┘               │
│  │   Port 4096  │                                               │
│  └──────────────┘                                               │
└───────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Web Application**: Browser → React Router (3000) → Hono API (9999) → PostgreSQL (5432)
2. **AI Editing**: Browser → OpenCode (4096) → Workspace Volume
3. **Live Preview**: Browser → Preview (8080) → Workspace Volume (read-only)
4. **API + Workspace**: Hono API (9999) can also access Workspace Volume

## 🛠️ Development

### Local API Development

```bash
cd www/apps/api
pnpm install
pnpm dev  # Runs on port 9999
```

### Local Web Development

```bash
cd www/apps/web
pnpm install
pnpm dev  # Runs on port 5173 (Vite dev server)
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | *Required* |
| `LOG_LEVEL` | API logging level | `info` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://postgres:postgres@postgres:5432/api_db` |
| `VITE_API_URL` | Frontend API URL (client-side) | `http://localhost:9999` |

## 📚 Full-Stack Application

The integrated full-stack application includes:

### Backend API (Hono)

- **Technology**: Hono, Node.js 22, TypeScript
- **Features**:
  - OpenAPI 3.1 compliant REST API
  - Automatic request/response validation with Zod
  - Type-safe database queries with Drizzle ORM
  - Automatic migrations on startup
  - Structured logging with Pino
  - Interactive API documentation with Scalar
- **Location**: [`www/apps/api`](www/apps/api/)
- **Documentation**: [`www/docs/ARCHITECTURE.md`](www/docs/ARCHITECTURE.md:1)

### Frontend Web (React Router)

- **Technology**: React 19, React Router 7, TailwindCSS 4
- **Features**:
  - Server-side rendering (SSR)
  - Client-side hydration
  - Type-safe routing
  - Modern styling with TailwindCSS
  - API integration
- **Location**: [`www/apps/web`](www/apps/web/)

### Database (PostgreSQL)

- **Version**: PostgreSQL 16 Alpine
- **Features**:
  - Persistent data storage
  - Health checks
  - Automatic test database creation
  - Production-grade reliability

## 📝 API Documentation

The Hono API provides:

- **Interactive Docs**: http://localhost:9999/reference
- **OpenAPI Spec**: Auto-generated from code
- **Type Safety**: End-to-end TypeScript
- **Validation**: Automatic request/response validation
- **Testing**: Built-in test suite

See [`www/docs/ARCHITECTURE.md`](www/docs/ARCHITECTURE.md:1) for detailed API architecture.

## 🐳 Docker Commands

### Start all services
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
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f web
```

### Rebuild containers
```bash
docker-compose up --build
```

### Remove volumes (clean slate)
```bash
docker-compose down -v
```

### Access database
```bash
docker-compose exec postgres psql -U postgres -d api_db
```

## 🚢 Deployment with Dokploy

This project is ready for deployment with Dokploy:

1. Push your code to a Git repository
2. In Dokploy, create a new application
3. Point it to your repository
4. Set environment variables:
   - `ANTHROPIC_API_KEY`
   - `VITE_API_URL` (your production API URL)
5. Deploy!

Dokploy will automatically detect [`docker-compose.yml`](docker-compose.yml:1) and deploy all services.

### Production Considerations

- All services include health checks
- Traefik labels pre-configured for SSL/TLS
- Database includes persistent volumes
- API runs database migrations on startup
- React Router provides SSR for better SEO

See [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md:1) for detailed deployment instructions.

## 🔧 Customization

### Adding More Files to Workspace

Simply add files to the [`workspace/`](workspace/) directory. They will be:
- Accessible by OpenCode for editing
- Served by the preview server at http://localhost:8080
- Accessible by the Hono API via the shared volume

### Modifying the API

The API follows a feature-based structure. To add a new feature:

1. Create a new directory in [`www/apps/api/src/features/`](www/apps/api/src/features/)
2. Define your database schema in [`www/apps/api/src/db/schema.ts`](www/apps/api/src/db/schema.ts:1)
3. Create route definitions, handlers, and tests
4. Register the routes in [`www/apps/api/src/app.ts`](www/apps/api/src/app.ts:1)

See the [`www/apps/api/docs/`](www/apps/api/docs/) for detailed guides.

### Modifying the Frontend

Add new pages by creating route files in [`www/apps/web/app/routes/`](www/apps/web/app/routes/) and registering them in [`www/apps/web/app/routes.ts`](www/apps/web/app/routes.ts:1).

### OpenCode Configuration

Edit [`workspace/opencode.json`](workspace/opencode.json:1) to change OpenCode permissions and tools.

## 🐛 Troubleshooting

### Services not starting

```bash
# Check container status
docker-compose ps

# View logs for specific service
docker-compose logs [service-name]

# Restart a specific service
docker-compose restart [service-name]
```

### Database connection issues

```bash
# Check if PostgreSQL is healthy
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Verify database is accessible
docker-compose exec postgres pg_isready -U postgres
```

### API not connecting to database

Ensure PostgreSQL health check passes before API starts. The [`docker-compose.yml`](docker-compose.yml:1) includes proper dependency management.

### Web app can't reach API

Check the `API_URL` environment variable in the web service configuration. It should use the Docker network hostname: `http://api:9999`

### Permission denied errors (OpenCode)

This project includes automatic permission fixing. If you see permission errors:

1. Check logs for permission fix message:
   ```bash
   docker-compose logs opencode | grep "Fixing workspace permissions"
   ```

2. Restart the container:
   ```bash
   docker-compose restart opencode
   ```

See [`docs/PERMISSION_SOLUTIONS.md`](docs/PERMISSION_SOLUTIONS.md:1) for full analysis.

## 📚 Documentation

- **Integration Plan**: [`docs/INTEGRATION_PLAN.md`](docs/INTEGRATION_PLAN.md:1) - How the services are integrated
- **Architecture**: [`www/docs/ARCHITECTURE.md`](www/docs/ARCHITECTURE.md:1) - Full-stack architecture details
- **API Communication**: [`www/docs/API_COMMUNICATION.md`](www/docs/API_COMMUNICATION.md:1) - Frontend-backend integration
- **Quick Start**: [`www/docs/QUICK_START.md`](www/docs/QUICK_START.md:1) - Detailed getting started guide
- **Deployment**: [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md:1) - Production deployment

## 📚 External Resources

- [OpenCode Documentation](https://docs.opencode.ai)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Hono Framework](https://hono.dev)
- [React Router](https://reactrouter.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [Docker Compose](https://docs.docker.com/compose/)
- [Dokploy](https://dokploy.com/docs)

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Feel free to open issues or submit PRs.
