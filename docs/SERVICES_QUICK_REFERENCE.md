# Services Quick Reference

## 🚀 Starting the System

```bash
# Start all 5 services
docker-compose up --build

# Or in detached mode
docker-compose up -d --build
```

## 📍 Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Web App** | http://localhost:3000 | React Router frontend |
| **API** | http://localhost:9999 | Hono REST API |
| **API Docs** | http://localhost:9999/reference | Interactive API documentation |
| **OpenCode** | http://localhost:4096 | AI code editor |
| **Preview** | http://localhost:8080 | Workspace file preview |
| **Database** | localhost:5432 | PostgreSQL (internal) |

## 🔍 Health Checks

```bash
# Check all services
docker-compose ps

# Test API
curl http://localhost:9999/

# Test Web App
curl http://localhost:3000/

# Check database
docker-compose exec postgres pg_isready -U postgres
```

## 📝 Common Commands

```bash
# View logs for all services
docker-compose logs -f

# View logs for specific service
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f postgres

# Restart a service
docker-compose restart api

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v

# Access database shell
docker-compose exec postgres psql -U postgres -d api_db

# Run database migrations manually
docker-compose exec api pnpm drizzle-kit migrate
```

## 🏗️ Architecture Overview

```
Browser
  │
  ├─→ Web App (3000)
  │     └─→ API (9999)
  │           └─→ PostgreSQL (5432)
  │
  ├─→ OpenCode (4096)
  │     └─→ Workspace Volume
  │           └─→ Preview (8080)
  │
  └─→ API (9999)
        └─→ Workspace Volume (shared)
```

## 🔧 Development Workflow

### 1. Make changes to API
```bash
cd www/apps/api
# Edit files in src/
# Migrations run automatically on container restart
docker-compose restart api
```

### 2. Make changes to Web App
```bash
cd www/apps/web
# Edit files in app/
docker-compose restart web
```

### 3. Use OpenCode to edit workspace
1. Open http://localhost:4096
2. Give AI prompt to edit workspace files
3. View changes at http://localhost:8080

## 📦 Service Details

### OpenCode (4096)
- **Container**: opencode-server
- **Volume**: workspace-data (read/write)
- **Purpose**: AI-powered code editor

### Preview (8080)
- **Container**: preview
- **Volume**: workspace-data (read-only)
- **Purpose**: Static file server for workspace

### PostgreSQL (5432)
- **Container**: postgres
- **Image**: postgres:16-alpine
- **Volume**: postgres-data
- **Default DB**: api_db
- **Credentials**: postgres/postgres

### Hono API (9999)
- **Container**: api
- **Build**: www/apps/api/Dockerfile
- **Volumes**: workspace-data (access to OpenCode files)
- **Features**:
  - OpenAPI documentation
  - Automatic migrations
  - Zod validation
  - Drizzle ORM

### React Router Web (3000)
- **Container**: web
- **Build**: www/apps/web/Dockerfile
- **Features**:
  - Server-side rendering
  - TailwindCSS
  - API integration

## 🐛 Troubleshooting

### Services won't start
```bash
# Check for port conflicts
docker-compose down
docker-compose up --build

# View error logs
docker-compose logs
```

### Database connection failed
```bash
# Ensure PostgreSQL is healthy
docker-compose ps postgres

# View database logs
docker-compose logs postgres

# Check health
docker-compose exec postgres pg_isready
```

### API can't connect to database
```bash
# API depends on postgres health check
# Wait for postgres to be healthy first
docker-compose logs api | grep "database"
```

### Web app shows API errors
```bash
# Check API is running
curl http://localhost:9999/

# Check environment variables
docker-compose config | grep API_URL
```

## 🔄 Updating the System

```bash
# Pull latest changes
git pull

# Rebuild all containers
docker-compose down
docker-compose up --build

# Or rebuild specific service
docker-compose up -d --build api
```

## 📊 Monitoring

```bash
# Watch logs in real-time
docker-compose logs -f

# Check container resource usage
docker stats

# Check container health
docker-compose ps
```

## 🚀 Production Deployment

See [`DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) for:
- Dokploy deployment
- Environment variables
- SSL/TLS configuration
- Scaling considerations
