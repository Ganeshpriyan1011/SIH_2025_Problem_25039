# 🚀 Production Deployment Guide

This guide provides comprehensive instructions for deploying the INCOIS Ocean Hazard Reporting Platform to production environments.

## 📋 Pre-deployment Checklist

### ✅ Code Quality
- [ ] All TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Unit tests passing
- [ ] Security vulnerabilities patched
- [ ] Performance optimizations applied

### ✅ Environment Setup
- [ ] Production environment variables configured
- [ ] SSL certificates obtained
- [ ] Database connections tested
- [ ] External API keys validated
- [ ] CDN configured (if applicable)

### ✅ Security
- [ ] Secrets properly managed
- [ ] CORS policies configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] Authentication flows tested

## 🔧 Environment Configuration

### Frontend Environment Variables (.env.production)
```env
# Application Environment
NODE_ENV=production
VITE_APP_ENV=production

# API Configuration
VITE_API_BASE_URL=https://api.yourdomain.com/api
VITE_BACKEND_URL=https://api.yourdomain.com

# Google Gemini AI
VITE_GEMINI_API_KEY=your_production_gemini_key

# Azure Storage
VITE_AZURE_STORAGE_CONNECTION_STRING=your_production_azure_connection
VITE_AZURE_CONTAINER_NAME=ocean-hazard-reports-prod

# Map Configuration
VITE_DEFAULT_MAP_CENTER_LAT=20.5937
VITE_DEFAULT_MAP_CENTER_LNG=78.9629
VITE_DEFAULT_MAP_ZOOM=5

# Feature Flags
VITE_ENABLE_SOCIAL_MEDIA=true
VITE_ENABLE_AI_ANALYSIS=true
VITE_ENABLE_NOTIFICATIONS=true

# Security
VITE_ENABLE_HTTPS=true
VITE_CORS_ORIGIN=https://yourdomain.com

# Performance
VITE_ENABLE_SERVICE_WORKER=true
VITE_ENABLE_ANALYTICS=true
VITE_LOG_LEVEL=error
VITE_ENABLE_API_LOGGING=false
```

### Backend Environment Variables (.env)
```env
# Application
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=your_production_database_url
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=incois_ocean_hazard_prod
DB_USER=your_db_user
DB_PASSWORD=your_secure_db_password

# Authentication
JWT_SECRET=your_very_secure_jwt_secret_min_32_chars
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# External APIs
GEMINI_API_KEY=your_production_gemini_key
AZURE_STORAGE_CONNECTION_STRING=your_production_azure_connection

# Email Service
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASSWORD=your_smtp_password
FROM_EMAIL=noreply@yourdomain.com

# Security
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/incois-backend.log
```

## 🏗️ Build Process

### 1. Frontend Build
```bash
# Install dependencies
npm ci --production=false

# Type check
npm run type-check

# Lint code
npm run lint

# Build for production
npm run build:prod

# Verify build
npm run preview
```

### 2. Backend Build
```bash
# Navigate to backend
cd backend

# Install dependencies
npm ci --production=false

# Type check
npx tsc --noEmit

# Build TypeScript
npm run build

# Test production build
NODE_ENV=production node dist/server.js
```

## 🌐 Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend)

#### Frontend Deployment (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure environment variables in Vercel dashboard
```

#### Backend Deployment (Railway)
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### Option 2: AWS Deployment

#### Frontend (AWS S3 + CloudFront)
```bash
# Build the application
npm run build:prod

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

#### Backend (AWS EC2 + RDS)
```bash
# Create EC2 instance
# Install Node.js, PM2, and dependencies
# Set up RDS PostgreSQL instance
# Configure security groups and load balancer

# On EC2 instance:
pm2 start dist/server.js --name "incois-backend"
pm2 startup
pm2 save
```

### Option 3: Docker Deployment

#### Dockerfile (Frontend)
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build:prod

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Dockerfile (Backend)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/health || exit 1

# Start application
CMD ["node", "dist/server.js"]
```

#### Docker Compose (Production)
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/ssl/certs
    depends_on:
      - backend

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./backend/.env
    depends_on:
      - database
    restart: unless-stopped

  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: incois_ocean_hazard_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

## 🔒 Security Configuration

### SSL/TLS Setup
```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d api.yourdomain.com
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring & Logging

### Application Monitoring
```bash
# Install PM2 for process management
npm install -g pm2

# Start with monitoring
pm2 start ecosystem.config.js
pm2 monit
```

### Ecosystem Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'incois-backend',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/incois-backend-error.log',
    out_file: '/var/log/incois-backend-out.log',
    log_file: '/var/log/incois-backend.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### Health Checks
```bash
# Backend health endpoint
curl -f https://api.yourdomain.com/health

# Frontend health check
curl -f https://yourdomain.com
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow (.github/workflows/deploy.yml)
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run build

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build:prod
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@v1.0.0
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: 'incois-backend'
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check
```

#### 2. Environment Variable Issues
```bash
# Verify environment variables are loaded
node -e "console.log(process.env.NODE_ENV)"

# Check for missing variables
grep -r "process.env" src/
```

#### 3. CORS Issues
```bash
# Verify CORS configuration in backend
# Check browser network tab for preflight requests
# Ensure frontend and backend URLs match
```

#### 4. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/yourdomain.com/cert.pem -text -noout

# Renew certificates
sudo certbot renew
```

## 📈 Performance Optimization

### Frontend Optimizations
- Enable gzip compression
- Use CDN for static assets
- Implement service worker for caching
- Optimize images and assets
- Enable HTTP/2

### Backend Optimizations
- Use connection pooling for database
- Implement Redis for caching
- Enable compression middleware
- Use clustering for multiple processes
- Monitor memory usage

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS**: Always use SSL/TLS in production
3. **Headers**: Implement security headers
4. **Rate Limiting**: Protect against abuse
5. **Input Validation**: Sanitize all user inputs
6. **Dependencies**: Keep packages updated
7. **Monitoring**: Set up security monitoring

## 📞 Support

For deployment issues:
- Check logs: `pm2 logs` or `docker logs container_name`
- Monitor resources: `htop`, `df -h`
- Review error logs in `/var/log/`
- Contact DevOps team: devops@incois.gov.in

---

**Remember**: Always test deployments in a staging environment before production!
