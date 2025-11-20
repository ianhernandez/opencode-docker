# Docker Integration Plan - OpenCode with Full-Stack App

## Executive Summary

Integrating the `/www` folder applications (React Router + Hono API + PostgreSQL) into the parent Docker Compose setup, replacing the existing simple backend with a production-grade full-stack application.

## Current Architecture (Before)

```mermaid
graph TB
    subgraph "Current Root Docker"
        A[OpenCode Server<br/>Port 4096]
        B[Preview Nginx<br/>Port 8080]
        C[Backend API Express<br/>Port 3000]
        D[Workspace Volume]
    end
    
    subgraph "Separate www/docker-compose"
        E[PostgreSQL<br/>Port 5432]
        F[Hono API<br/>Port 9999]
        G[React Router Web<br/>Port 3000]
    end
    
    A -.-> D
    B -.-> D
    C -.-> D
    E --> F
    F --> G
```

## Target Architecture (After)

```mermaid
graph TB
    subgraph "Integrated Docker Compose"
        A[OpenCode Server<br/>Port 4096]
        B[Preview Nginx<br/>Port 8080]
        E[PostgreSQL<br/>Port 5432]
        F[Hono API<br/>Port 9999]
        G[React Router Web<br/>Port 3000]
        D[Workspace Volume]
        H[Postgres Data Volume]
    end
    
    A -.-> D
    B -.-> D
    E -.-> H
    E --> F
    F --> G
    F -.-> D
    
    style E fill:#336791,color:#fff
    style F fill:#E8274B,color:#fff
    style G fill:#61DAFB,color:#000
    style A fill:#4A90E2,color:#fff
    style B fill:#009639,color:#fff
```

## Services Overview

### 1. OpenCode Server (Existing - Unchanged)
- **Purpose**: AI-powered code editor
- **Port**: 4096
- **Volume**: workspace-data (shared)
- **Status**: ✅ Keep as-is

### 2. Preview Server (Existing - Unchanged)
- **Purpose**: Live preview of workspace files
- **Port**: 8080
- **Volume**: workspace-data (read-only)
- **Status**: ✅ Keep as-is

### 3. PostgreSQL Database (New)
- **Purpose**: Production database for Hono API
- **Port**: 5432
- **Image**: postgres:16-alpine
- **Volume**: postgres-data (persistent)
- **Health Check**: pg_isready
- **Status**: ➕ Add from www/docker-compose.yml

### 4. Hono API Backend (New)
- **Purpose**: Modern REST API with OpenAPI documentation
- **Port**: 9999
- **Technology**: Node.js 22, Hono, Drizzle ORM, Zod
- **Build Context**: ./www/apps/api
- **Dependencies**: PostgreSQL (health check)
- **Features**:
  - OpenAPI documentation at `/reference`
  - Database migrations on startup
  - Structured logging with Pino
  - Type-safe validation with Zod
- **Status**: ➕ Add from www/docker-compose.yml

### 5. React Router Web App (New)
- **Purpose**: Modern SSR frontend application
- **Port**: 3000 (takes over from old backend)
- **Technology**: React 19, React Router 7, TailwindCSS
- **Build Context**: ./www/apps/web
- **Dependencies**: Hono API
- **Features**:
  - Server-side rendering
  - Client-side hydration
  - API integration
- **Status**: ➕ Add from www/docker-compose.yml

### ❌ Old Backend (To Be Removed)
- **Port**: 3000 (conflicted with React Router)
- **Purpose**: Simple Express API for workspace files
- **Status**: 🗑️ Delete - replaced by Hono API

## Implementation Steps

### Phase 1: Docker Compose Integration

1. **Add PostgreSQL Service**
   ```yaml
   postgres:
     image: postgres:16-alpine
     restart: always
     ports: ["5432:5432"]
     environment:
       POSTGRES_USER: postgres
       POSTGRES_PASSWORD: postgres
       POSTGRES_DB: api_db
     volumes:
       - postgres-data:/var/lib/postgresql/data
       - ./www/apps/api/init-db.sh:/docker-entrypoint-initdb.d/init-db.sh
     healthcheck:
       test: ["CMD-SHELL", "pg_isready -U postgres"]
       interval: 10s
       timeout: 5s
       retries: 5
   ```

2. **Add Hono API Service**
   ```yaml
   api:
     build:
       context: ./www/apps/api
       dockerfile: Dockerfile
     restart: always
     ports: ["9999:9999"]
     environment:
       NODE_ENV: production
       PORT: 9999
       LOG_LEVEL: ${LOG_LEVEL:-info}
       DATABASE_URL: postgres://postgres:postgres@postgres:5432/api_db
     volumes:
       - workspace-data:/workspace  # Access to OpenCode workspace
     depends_on:
       postgres:
         condition: service_healthy
   ```

3. **Add React Router Web Service**
   ```yaml
   web:
     build:
       context: ./www/apps/web
       dockerfile: Dockerfile
       args:
         VITE_API_URL: ${VITE_API_URL:-http://localhost:9999}
     restart: always
     ports: ["3000:3000"]
     environment:
       API_URL: http://api:9999
     depends_on:
       - api
   ```

4. **Remove Old Backend Service**
   - Delete backend service definition from docker-compose.yml
   - Remove Dockerfile.backend
   - Remove backend/ directory

5. **Add New Volume**
   ```yaml
   volumes:
     workspace-data:
     postgres-data:  # New volume for database persistence
   ```

### Phase 2: Environment Variables

Create `.env` file with:
```bash
# Existing
ANTHROPIC_API_KEY=sk-ant-your-key-here

# New additions
LOG_LEVEL=info
DATABASE_URL=postgres://postgres:postgres@postgres:5432/api_db
VITE_API_URL=http://localhost:9999
```

### Phase 3: Cleanup

1. Remove `www/docker-compose.yml`
2. Remove `backend/` directory
3. Remove `Dockerfile.backend`
4. Update `.gitignore` if needed

### Phase 4: Documentation Updates

Update README.md with:
- New architecture diagram
- New port mappings
- New service descriptions
- Updated API endpoints
- Migration guide

## Port Mapping

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| OpenCode | 4096 | http://localhost:4096 | AI code editor |
| Preview | 8080 | http://localhost:8080 | Workspace preview |
| Web App | 3000 | http://localhost:3000 | React Router frontend |
| API | 9999 | http://localhost:9999 | Hono REST API |
| API Docs | 9999 | http://localhost:9999/reference | Interactive API documentation |
| PostgreSQL | 5432 | localhost:5432 | Database (internal) |

## Data Flow

### Workspace File Editing
```
User → OpenCode UI (4096) → Workspace Volume → Preview (8080)
                                    ↓
                            Hono API (9999) can also access
```

### Web Application Data
```
Browser → Web App (3000) → Hono API (9999) → PostgreSQL (5432)
```

### Combined Scenario
```
OpenCode → Edit workspace files
    ↓
Preview → View changes
    ↓
Web App → Fetch data from API
    ↓
API → Query database + access workspace files
```

## Benefits of Integration

1. **Unified Deployment**: Single `docker-compose up` starts everything
2. **Shared Workspace**: Hono API can access OpenCode workspace files
3. **Production-Grade**: PostgreSQL database with migrations
4. **Modern Stack**: Latest React Router, Hono, and Node.js
5. **Type Safety**: End-to-end TypeScript
6. **API Documentation**: OpenAPI docs at `/reference`
7. **SSR Support**: React Router with server-side rendering
8. **Simplified Management**: One docker-compose file to rule them all

## Potential Extensions

Once integrated, the system can:
- Allow Web App to display/edit workspace files
- Store OpenCode session history in PostgreSQL
- Provide API endpoints for workspace management
- Enable collaborative editing features
- Add authentication/authorization layers

## Migration Checklist

- [ ] Backup existing .env file
- [ ] Update docker-compose.yml with new services
- [ ] Remove old backend service and files
- [ ] Test PostgreSQL connection
- [ ] Test API health endpoint
- [ ] Test Web app loads correctly
- [ ] Test OpenCode still works
- [ ] Test Preview still works
- [ ] Verify all services can communicate
- [ ] Remove www/docker-compose.yml
- [ ] Update README.md
- [ ] Commit changes

## Rollback Plan

If issues occur:
1. Keep backup of original docker-compose.yml
2. Keep backup of .env
3. Keep www/docker-compose.yml until verified working
4. Can run services separately if needed
5. Volume data persists even if containers are removed

## Testing Strategy

After integration:
```bash
# 1. Start all services
docker-compose up --build

# 2. Check all services are healthy
docker-compose ps

# 3. Test each service
curl http://localhost:4096  # OpenCode
curl http://localhost:8080  # Preview
curl http://localhost:3000  # Web App
curl http://localhost:9999/health  # API health
curl http://localhost:9999/reference  # API docs

# 4. Test database
docker-compose exec postgres psql -U postgres -d api_db -c "\dt"

# 5. Check logs
docker-compose logs -f
```

## Success Criteria

✅ All 5 services start successfully
✅ All health checks pass
✅ No port conflicts
✅ Database migrations run successfully
✅ Web app renders correctly
✅ API documentation accessible
✅ OpenCode UI still functional
✅ Preview still shows workspace files
✅ Services can communicate on Docker network

## Timeline

- Phase 1 (Docker Compose): 30 minutes
- Phase 2 (Environment): 10 minutes
- Phase 3 (Cleanup): 10 minutes
- Phase 4 (Documentation): 30 minutes
- Testing: 20 minutes

**Total Estimated Time**: ~2 hours

---

**Next Steps**: Get approval on this plan, then switch to Code mode for implementation.
