# Installation Guide

Complete step-by-step installation instructions for setting up Fashion AI Video Generator.

## 📋 Prerequisites

Before installing, ensure you have:

- **Node.js**: v18.0.0 or higher
- **pnpm**: v10.14.0 or higher (install with `npm install -g pnpm`)
- **Git**: For version control
- **PostgreSQL Client**: For database operations (optional but recommended)

## 🔑 Required API Keys

You'll need to obtain these API keys before running the application:

1. **Stripe** (Payment Processing)
   - Create account at [stripe.com](https://stripe.com)
   - Copy Secret Key and Publishable Key from Dashboard → API Keys
   - Generate Webhook Secret in Developers → Webhooks

2. **Fashion.ai** (Video Generation)
   - Register at [fashion.ai](https://fashion.ai)
   - Copy your API key from dashboard

3. **Neon Database** (PostgreSQL)
   - Create account at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string

## 🚀 Installation Steps

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/fashion-ai-video-generator.git
cd fashion-ai-video-generator

# Or download as ZIP and extract
```

### Step 2: Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

**Note:** This project uses pnpm as the default package manager. Using npm or yarn may result in different `lock` file formats.

### Step 3: Create Environment File

Create a `.env` file in the root directory:

```bash
cp .env.example .env  # If template exists
# OR manually create .env file
```

Add the following variables:

```env
# Database Connection (Required)
DATABASE_URL=postgresql://user:password@host:port/database

# Stripe Keys (Required)
STRIPE_SECRET_KEY=sk_test_yourkey
STRIPE_PUBLISHABLE_KEY=pk_test_yourkey
STRIPE_WEBHOOK_SECRET=whsec_yourkey

# Video Generation (Required)
FASHN_AI_API_KEY=your_api_key_here

# Email Verification (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@example.com
SMTP_SECURE=false

# CORS Configuration (Optional)
CORS_ORIGIN=*
```

**⚠️ Important:** Never commit `.env` to git. Add it to `.gitignore` (already included).

### Step 4: Database Setup

#### Option A: Neon (Recommended)

1. Go to [neon.tech](https://neon.tech)
2. Sign up and create a new project
3. In the dashboard, copy the connection string
4. Add to `.env` as `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql://neondb_owner:password@ep-xxx.region.neon.tech/neondb?sslmode=require
   ```

#### Option B: Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database:
   ```bash
   createdb fashion_ai_videos
   ```
3. Add to `.env`:
   ```env
   DATABASE_URL=postgresql://localhost/fashion_ai_videos
   ```

#### Automatic Table Creation

The application automatically creates the `videos` table on first connection. No manual setup needed.

### Step 5: Configure Stripe Keys

1. Create account at [stripe.com](https://stripe.com)
2. Go to **Developers** → **API Keys**
3. Copy your **Secret Key** (sk*test*...)
4. Copy your **Publishable Key** (pk*test*...)
5. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_xxxxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   ```

### Step 6: Get Fashion.ai API Key

1. Register at [fashion.ai](https://fashion.ai) or contact their sales
2. Copy your API key from dashboard
3. Add to `.env`:
   ```env
   FASHN_AI_API_KEY=fa_xxxxx
   ```

### Step 7: Start Development Server

```bash
# Start the development server
pnpm dev

# Server will start on http://localhost:5173
```

Open your browser to `http://localhost:5173` and you should see the application.

### Step 8: Verify Installation

Test the installation:

```bash
# In another terminal, test the API
curl http://localhost:5173/api/health

# Should return: {"status":"ok"}
```

## 📦 Project Structure After Installation

```
fashion-ai-video-generator/
├── client/                      # React frontend
├── server/                      # Express backend
├── shared/                      # Shared types
├── public/                      # Static assets
├── api/                         # Vercel serverless functions
├── netlify/                     # Netlify serverless functions
├── .env                         # Environment variables (create this)
├── package.json                 # Dependencies
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
└── README.md                    # Project documentation
```

## 🔧 Configuration Files

### .env File Variables

| Variable                 | Required | Type    | Description                        |
| ------------------------ | -------- | ------- | ---------------------------------- |
| `DATABASE_URL`           | Yes      | String  | PostgreSQL connection string       |
| `STRIPE_SECRET_KEY`      | Yes      | String  | Stripe API secret key              |
| `STRIPE_PUBLISHABLE_KEY` | Yes      | String  | Stripe API public key              |
| `STRIPE_WEBHOOK_SECRET`  | Yes      | String  | Stripe webhook signing secret      |
| `FASHN_AI_API_KEY`       | Yes      | String  | Fashion.ai API key                 |
| `SMTP_HOST`              | No       | String  | SMTP server hostname               |
| `SMTP_PORT`              | No       | Number  | SMTP server port (default: 587)    |
| `SMTP_USER`              | No       | String  | SMTP username                      |
| `SMTP_PASS`              | No       | String  | SMTP password                      |
| `SMTP_FROM`              | No       | String  | Sender email address               |
| `SMTP_SECURE`            | No       | Boolean | Use SSL/TLS (default: false)       |
| `CORS_ORIGIN`            | No       | String  | CORS allowed origins (default: \*) |

See [SMTP_SETUP.md](./SMTP_SETUP.md) for detailed email configuration.

## 🧪 Testing Your Installation

### 1. Test Frontend

```bash
# Should display the Fashion AI Video Generator homepage
# Navigate to http://localhost:5173
```

### 2. Test Backend API

```bash
# Test health endpoint
curl http://localhost:5173/api/health
# Expected response: {"status":"ok"}

# Test SMTP status
curl http://localhost:5173/api/auth/smtp-status
# Expected response: {"configured":true/false}
```

### 3. Test Database Connection

```bash
# Check if database was created
psql postgresql://user:password@host/database

# Connect and verify tables
\dt
# Should show "videos" table
```

### 4. Test Video Generation Endpoint

```bash
# Save a video config (will need base64 image)
curl -X POST http://localhost:5173/api/save-video-config \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "imageBase64": "data:image/jpeg;base64,/9j/...",
    "duration": 10,
    "resolution": "1080p"
  }'
```

## 🚫 Common Issues & Solutions

### Issue: `pnpm: command not found`

**Solution:**

```bash
# Install pnpm globally
npm install -g pnpm

# Verify installation
pnpm --version
```

### Issue: `DATABASE_URL not found`

**Solution:**

```bash
# Make sure .env file exists in root directory
# Check that DATABASE_URL is set correctly
cat .env | grep DATABASE_URL

# Verify database is accessible
psql postgresql://user:password@host/database -c "SELECT 1"
```

### Issue: `Cannot find module 'pg'`

**Solution:**

```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Issue: `Port 5173 already in use`

**Solution:**

```bash
# Use a different port
pnpm dev -- --port 3000

# Or kill the process using the port
# On macOS/Linux:
lsof -ti:5173 | xargs kill -9
# On Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Issue: `STRIPE_SECRET_KEY is not set`

**Solution:**

```bash
# 1. Create .env file if it doesn't exist
touch .env

# 2. Add Stripe keys
echo "STRIPE_SECRET_KEY=sk_test_..." >> .env
echo "STRIPE_PUBLISHABLE_KEY=pk_test_..." >> .env

# 3. Restart dev server
pnpm dev
```

### Issue: Database migration errors

**Solution:**

```bash
# The application auto-creates tables
# If you get errors, check:
1. DATABASE_URL is correct
2. Database exists and is accessible
3. User has CREATE TABLE permissions

# To manually create table:
psql $DATABASE_URL <<EOF
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  email VARCHAR(254),
  image_base64 TEXT,
  duration INTEGER,
  resolution VARCHAR(10),
  status VARCHAR(20) DEFAULT 'awaiting_payment',
  payment_intent_id VARCHAR(255),
  payment_status VARCHAR(20),
  payment_amount INTEGER,
  payment_currency VARCHAR(3),
  payment_email VARCHAR(254),
  request_id VARCHAR(255),
  video_url TEXT,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  deleted_at TIMESTAMP,
  completed_at TIMESTAMP
);
EOF
```

## 📝 Build for Production

### Build Application

```bash
# Build both client and server
pnpm build

# Output directories:
# - dist/spa/ - Frontend build
# - dist/server/ - Backend build
```

### Run Production Build Locally

```bash
# Start the production server
pnpm start

# Server will run on port 3000
```

## ✅ Verification Checklist

After installation, verify:

- [ ] `pnpm dev` starts without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] `/api/health` returns `{"status":"ok"}`
- [ ] Database connection successful
- [ ] All required environment variables set
- [ ] Stripe keys are valid
- [ ] Fashion.ai API key is valid
- [ ] SMTP configured (optional)
- [ ] No console errors in browser DevTools

## 🆘 Getting Help

If you encounter issues:

1. **Check logs**: Look at terminal output for error messages
2. **Check database**: Verify connection with `psql`
3. **Check environment variables**: Run `cat .env` to verify
4. **Check ports**: Ensure 5173 is available
5. **Restart**: Close terminal and restart `pnpm dev`
6. **Clear cache**: Delete `node_modules` and reinstall with `pnpm install`

## 🎓 Next Steps

After successful installation:

1. Read [README.md](./README.md) for feature overview
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup
3. Check [SMTP_SETUP.md](./SMTP_SETUP.md) for email configuration
4. Explore the codebase in `client/` and `server/`
5. Start developing with `pnpm dev`

## 📚 Additional Resources

- [Vercel Deployment Guide](./DEPLOYMENT.md#vercel-deployment-recommended)
- [Stripe Documentation](https://stripe.com/docs)
- [Fashion.ai API Documentation](https://fashion.ai/docs)
- [Neon Database Documentation](https://neon.tech/docs)
- [React Documentation](https://react.dev)
- [Express Documentation](https://expressjs.com)
