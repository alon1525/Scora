# Docker Setup Guide for Scora

This guide explains how to use Docker for local development of the Scora backend.

## 📋 Prerequisites

1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Install and start Docker Desktop
   - Verify installation: `docker --version`

2. **Create `.env` file** (if you don't have one)
   - Copy your environment variables to a `.env` file in the root directory
   - Required variables:
     ```env
     SUPABASE_API_URL=your_supabase_url
     SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
     SUPABASE_PUBLISHABLE_KEY=your_publishable_key
     LEAGUE_STANDINGS_API_KEY=your_football_data_api_key
     STATS_UPDATE_SECRET=your_secret_key
     API_BASE_URL=http://localhost:3001
     STANDINGS_REFRESH_INTERVAL=3600000
     ```

## 🚀 Quick Start

### Start all services
```bash
docker-compose up -d
```

This will:
- ✅ Build the backend Docker image
- ✅ Start the backend server on port 3001
- ✅ Start the scheduler service
- ✅ Run everything in the background

### View logs
```bash
# View all logs
docker-compose logs -f

# View only backend logs
docker-compose logs -f backend

# View only scheduler logs
docker-compose logs -f scheduler
```

### Stop all services
```bash
docker-compose down
```

## 📝 Available Commands

### Using npm scripts (recommended)
```bash
npm run docker:up          # Start all services
npm run docker:down        # Stop all services
npm run docker:build       # Build images
npm run docker:logs        # View all logs
npm run docker:logs:backend    # View backend logs
npm run docker:logs:scheduler  # View scheduler logs
npm run docker:restart     # Restart all services
npm run docker:rebuild    # Rebuild and start
npm run docker:clean      # Stop and remove volumes
npm run docker:stop       # Stop services (keep containers)
npm run docker:start      # Start stopped services
```

### Using docker-compose directly
```bash
docker-compose up -d              # Start in background
docker-compose up                 # Start in foreground (see logs)
docker-compose down               # Stop and remove containers
docker-compose build              # Build images
docker-compose logs -f            # Follow logs
docker-compose restart            # Restart services
docker-compose up -d --build      # Rebuild and start
docker-compose down -v            # Stop and remove volumes
```

## 🔧 Development Workflow

### 1. First Time Setup
```bash
# Make sure you have a .env file with all required variables
# Then start Docker
npm run docker:up
```

### 2. Daily Development
```bash
# Start services
npm run docker:up

# View logs to see what's happening
npm run docker:logs

# Make code changes (hot-reload is enabled in dev mode)
# Changes will automatically reload thanks to nodemon

# Stop when done
npm run docker:down
```

### 3. After Code Changes
```bash
# If you add new dependencies, rebuild
npm run docker:rebuild
```

### 4. Troubleshooting
```bash
# If something goes wrong, clean everything and restart
npm run docker:clean
npm run docker:rebuild
```

## 🌐 Accessing Services

- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
- **API Endpoints**: http://localhost:3001/api/*

## 📊 Service Details

### Backend Service
- **Container**: `scora-backend`
- **Port**: 3001
- **Hot Reload**: Enabled (uses nodemon)
- **Health Check**: Automatic every 30 seconds

### Scheduler Service
- **Container**: `scora-scheduler`
- **Function**: Runs hourly fixtures refresh and score recalculation
- **Depends on**: Backend service (waits for it to be healthy)

## 🐛 Common Issues

### Port 3001 already in use
**Solution**: Change the port in `docker-compose.yml`:
```yaml
ports:
  - "3002:3001"  # Use 3002 on your machine, 3001 in container
```

### Environment variables not working
**Solution**: Make sure your `.env` file is in the root directory and has all required variables.

### Container won't start
**Solution**: 
```bash
# Check logs
docker-compose logs backend

# Rebuild from scratch
npm run docker:clean
npm run docker:rebuild
```

### Changes not reflecting
**Solution**: 
- Make sure you're using `Dockerfile.dev` (which is set in docker-compose.yml)
- Check that volumes are mounted correctly
- Restart the container: `npm run docker:restart`

## 🔍 Useful Docker Commands

```bash
# See running containers
docker ps

# See all containers (including stopped)
docker ps -a

# Access backend container shell
docker exec -it scora-backend sh

# Access scheduler container shell
docker exec -it scora-scheduler sh

# View container resource usage
docker stats

# Remove all stopped containers
docker container prune

# Remove unused images
docker image prune
```

## 🎯 Production vs Development

- **Development**: Uses `Dockerfile.dev` with nodemon for hot-reload
- **Production**: Uses `Dockerfile` (optimized, production dependencies only)
- **Current Setup**: Development mode (for local dev)

## 📚 Next Steps

- Add Redis service (uncomment in docker-compose.yml)
- Add PostgreSQL for local database testing
- Set up Docker for frontend (if needed)

## 💡 Tips

1. **Keep Docker Desktop running** while developing
2. **Use `docker-compose logs -f`** to debug issues
3. **Rebuild after adding dependencies** to package.json
4. **Use `.dockerignore`** to exclude unnecessary files from builds
5. **Check health status**: `docker-compose ps` shows health status

---

**Note**: This Docker setup is for local development only. Your production deployment on Vercel remains unchanged and doesn't use Docker.

