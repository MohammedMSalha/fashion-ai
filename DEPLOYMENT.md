# Deployment Guide

This guide covers deploying Fashion AI Video Generator to production on Vercel, Netlify, or self-hosted platforms.

## Quick Deployment Checklist

- [ ] Database URL configured (Neon PostgreSQL)
- [ ] Stripe API keys and webhook secret set
- [ ] Fashion.ai API key configured
- [ ] SMTP variables set (optional)
- [ ] CORS origin configured
- [ ] Domain and SSL certificate ready
- [ ] Stripe webhook URL configured
- [ ] Email verification setup (optional)

## 🔵 Vercel Deployment (Recommended)

Vercel is the recommended platform for this application as it provides the easiest setup for serverless functions and environment variables.

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Select your GitHub repository
4. Vercel auto-detects settings from `vercel.json`
5. Click "Deploy"

### Step 3: Configure Environment Variables

In Vercel Dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

```
DATABASE_URL = postgresql://user:password@host/database
STRIPE_SECRET_KEY = sk_live_your_secret_key
STRIPE_PUBLISHABLE_KEY = pk_live_your_public_key
STRIPE_WEBHOOK_SECRET = whsec_your_webhook_secret
FASHN_AI_API_KEY = your_fashion_ai_api_key
```

Optional variables:
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = your-email@gmail.com
SMTP_PASS = your-app-password
SMTP_FROM = noreply@example.com
SMTP_SECURE = false
CORS_ORIGIN = https://yourdomain.com
```

### Step 4: Configure Stripe Webhook

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click "Add Endpoint"
4. Endpoint URL: `https://your-vercel-app.vercel.app/api/stripe-webhook`
5. Events to send:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
6. Copy the "Signing secret" and add to Vercel as `STRIPE_WEBHOOK_SECRET`

### Step 5: Database Setup

#### Using Neon PostgreSQL

1. Go to [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. In Vercel, set `DATABASE_URL` to the connection string
5. Connection string format:
   ```
   postgresql://neondb_owner:password@host/neondb?sslmode=require
   ```

### Step 6: Deploy & Test

1. Vercel auto-deploys on push to main
2. Check deployment status in Vercel Dashboard
3. Test endpoints:
   - Health: `https://your-app.vercel.app/api/health`
   - SMTP Status: `https://your-app.vercel.app/api/auth/smtp-status`

### Vercel-Specific Features

**Background Jobs:**
- Video cleanup runs every 10 minutes
- Video status polling runs every 2 minutes
- Configured in `vercel.json` under `crons`

**Environment Variables:**
- Variables are automatically available to serverless functions
- No need to rebuild for environment changes (redeploy)

**Deployment Logs:**
- View in Vercel Dashboard → Deployments → Logs
- Check function logs for debugging

## 🟠 Netlify Deployment

Netlify provides an alternative with serverless functions via `netlify/functions/api.ts`.

### Step 1: Connect GitHub Repository

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Select GitHub and authorize
4. Choose your repository
5. Select branch (main)
6. Click "Deploy site"

### Step 2: Configure Build Settings

Netlify auto-detects from `package.json`:
- Build command: `npm run build`
- Publish directory: `dist/spa`
- Functions directory: `netlify/functions`

### Step 3: Set Environment Variables

1. Go to **Site Settings** → **Build & Deploy** → **Environment**
2. Add variables:

```
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
FASHN_AI_API_KEY=...
```

### Step 4: Configure Stripe Webhook

1. Stripe Dashboard → **Developers** → **Webhooks**
2. Add Endpoint:
   - URL: `https://your-netlify-site.netlify.app/.netlify/functions/api/stripe-webhook`
   - Events: `payment_intent.succeeded`, etc.

### Step 5: Redeploy

- Push to main branch or use "Trigger deploy" in Netlify
- Monitor deployment in Netlify Dashboard

### Netlify-Specific Notes

- Environment variables are available in `netlify/functions/api.ts`
- Cold start may be slower than Vercel
- Netlify Edge Functions can be used for performance optimization
- Function logs available in Netlify Dashboard

## 🖥️ Self-Hosted (Fly.io)

For self-hosted deployment using Fly.io.

### Prerequisites

- [Flyctl CLI](https://fly.io/docs/getting-started/installing-flyctl/) installed
- GitHub repository set up
- Domain name (optional)

### Step 1: Create Fly App

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly
flyctl auth login

# Create new app
flyctl apps create fashion-ai-generator

# Or use existing fly.toml
flyctl launch
```

### Step 2: Set Environment Variables

```bash
# Set secrets for sensitive data
flyctl secrets set DATABASE_URL=postgresql://...
flyctl secrets set STRIPE_SECRET_KEY=sk_live_...
flyctl secrets set STRIPE_WEBHOOK_SECRET=whsec_...
flyctl secrets set FASHN_AI_API_KEY=...

# Optional: SMTP variables
flyctl secrets set SMTP_HOST=smtp.gmail.com
flyctl secrets set SMTP_USER=...
flyctl secrets set SMTP_PASS=...
```

### Step 3: Deploy Application

```bash
# Build and deploy
flyctl deploy

# Monitor deployment
flyctl logs
```

### Step 4: Configure Stripe Webhook

- Webhook URL: `https://your-app.fly.dev/api/stripe-webhook`
- Add to Stripe Dashboard as described in Vercel section

### Step 5: Configure Domain

```bash
# Add domain
flyctl certs create yourdomain.com

# Update DNS records to point to Fly
flyctl ips list
```

### Fly.io-Specific Notes

- `fly.toml` already configured in project
- Background jobs run directly (not via crons)
- Persistent disk optional for video storage
- Scaling configured in `fly.toml`

## 🐳 Docker Deployment

For custom container-based deployments.

### Step 1: Create Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy files
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build application
RUN pnpm build

# Expose port
EXPOSE 3000

# Start server
CMD ["pnpm", "start"]
```

### Step 2: Build Image

```bash
docker build -t fashion-ai-generator .
```

### Step 3: Run Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e STRIPE_SECRET_KEY=sk_live_... \
  -e STRIPE_WEBHOOK_SECRET=whsec_... \
  -e FASHN_AI_API_KEY=... \
  fashion-ai-generator
```

### Step 4: Push to Registry

```bash
# DockerHub
docker tag fashion-ai-generator yourusername/fashion-ai-generator:latest
docker push yourusername/fashion-ai-generator:latest

# Or deploy to Kubernetes, Docker Swarm, etc.
```

## 🗄️ Database Setup

### Neon PostgreSQL (Recommended)

1. Visit [neon.tech](https://neon.tech)
2. Create account and new project
3. Choose region close to your deployment
4. Copy connection string
5. Add to environment as `DATABASE_URL`

Connection string format:
```
postgresql://neondb_owner:password@ep-xxxxx.region.neon.tech/neondb?sslmode=require
```

### PostgreSQL (Self-Hosted)

For self-hosted PostgreSQL:

```bash
# Create database
createdb fashion_ai_videos

# Connection string format
postgresql://user:password@localhost:5432/fashion_ai_videos
```

The application auto-creates the `videos` table on first connection.

## 🔑 Environment Variables Reference

### Stripe
- `STRIPE_SECRET_KEY`: Found in Stripe Dashboard → API Keys (Secret Key)
- `STRIPE_PUBLISHABLE_KEY`: Found in Stripe Dashboard → API Keys (Publishable Key)
- `STRIPE_WEBHOOK_SECRET`: Generated when creating webhook endpoint

### Fashion.ai
- `FASHN_AI_API_KEY`: Obtained from Fashion.ai dashboard

### Database
- `DATABASE_URL`: PostgreSQL connection string (URL format)

### Email (Optional)
- `SMTP_HOST`: SMTP server (e.g., smtp.gmail.com)
- `SMTP_PORT`: SMTP port (587 for TLS, 465 for SSL)
- `SMTP_USER`: Email address or username
- `SMTP_PASS`: App-specific password (not main password)
- `SMTP_FROM`: Sender email address
- `SMTP_SECURE`: true/false for SSL/TLS

### CORS (Optional)
- `CORS_ORIGIN`: Allowed origins (default: *)

## 🧪 Testing Deployment

After deployment, test these endpoints:

### Health Check
```bash
curl https://your-domain.com/api/health
# Response: {"status":"ok"}
```

### SMTP Status
```bash
curl https://your-domain.com/api/auth/smtp-status
# Response: {"configured":true/false}
```

### Create Payment Intent
```bash
curl -X POST https://your-domain.com/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2999,
    "email": "test@example.com",
    "videoId": "123",
    "duration": "10",
    "quality": "1080p"
  }'
```

## 🔧 Troubleshooting

### Webhook Returns 404

**Solution:**
- Verify webhook URL in Stripe Dashboard
- Check that `STRIPE_WEBHOOK_SECRET` is set
- Ensure `api/[[...pathname]].ts` is deployed

### Payment Not Processing

**Solution:**
- Verify `STRIPE_SECRET_KEY` is set
- Check database connection with: `GET /api/health`
- View Stripe webhook logs: Stripe Dashboard → Developers → Webhooks

### Videos Not Generating

**Solution:**
- Check `FASHN_AI_API_KEY` is valid
- Verify database: `SELECT COUNT(*) FROM videos;`
- Check video status: `GET /api/video-status/:videoId`

### Email Verification Not Working

**Solution:**
- If SMTP not needed, skip configuration
- If needed, verify SMTP credentials
- Test with: `GET /api/auth/smtp-status`

### Database Connection Error

**Solution:**
- Verify `DATABASE_URL` format is correct
- Add `?sslmode=require` if using Neon
- Check database is accessible from deployment environment

### Cold Start Issues

**Solution:**
- Vercel: Usually < 2s
- Netlify: Usually < 5s
- Fly.io: Usually < 1s
- Optimize with persistent connections (already configured)

## 📊 Monitoring

### Vercel Dashboard
- Deployments → View logs
- Analytics → Requests/Performance
- Integrations → View connected services

### Stripe Dashboard
- Developers → Webhooks → Event logs
- Payments → Transaction history
- Customers → User list

### Database
```bash
# Connect to Neon database
psql postgresql://neondb_owner:password@host/neondb

# Check video count
SELECT COUNT(*) FROM videos;

# Check failed videos
SELECT id, error_message FROM videos WHERE status = 'failed';

# View expired videos
SELECT id FROM videos WHERE expires_at < CURRENT_TIMESTAMP AND deleted_at IS NULL;
```

## 🔐 Security Checklist

- [ ] All environment variables set securely
- [ ] No secrets in `.env` file committed to git
- [ ] SSL/HTTPS enabled on domain
- [ ] Stripe webhook signature verified
- [ ] Database connection uses SSL/TLS
- [ ] CORS origin configured appropriately
- [ ] Rate limiting enabled
- [ ] Security headers set via helmet
- [ ] Email verification optional (skip if not needed)
- [ ] Regular database backups configured

## 🚀 Next Steps

1. Test all endpoints from Troubleshooting section
2. Make test payment to verify webhook
3. Configure custom domain if needed
4. Set up monitoring and alerts
5. Configure backup strategy for database
6. Document your specific deployment URL
7. Brief team on support process
