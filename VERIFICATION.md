# Verification & Testing Guide

Complete verification procedures to ensure FashionAI: Image-to-Video Generator is correctly installed and configured.

## ✅ Pre-Deployment Verification

Before deploying to production, verify these items:

### 1. Environment Variables Verification

```bash
# Check that .env file exists
ls -la .env

# Verify all required variables are set
grep -E "DATABASE_URL|STRIPE_SECRET_KEY|STRIPE_PUBLISHABLE_KEY|STRIPE_WEBHOOK_SECRET|FASHN_AI_API_KEY" .env

# Output should show 5 variables with values
# DATABASE_URL=postgresql://...
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_PUBLISHABLE_KEY=pk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# FASHN_AI_API_KEY=fa_...
```

### 2. Dependencies Installation

```bash
# Verify pnpm is installed
pnpm --version
# Output: 10.14.0 or higher ✓

# Verify node_modules exists
ls -d node_modules
# Output: node_modules (directory exists) ✓

# Verify all critical packages
pnpm list express react stripe pg
# All should show versions ✓
```

### 3. Build Verification

```bash
# Build frontend
pnpm build:client
# Output: Built successfully ✓

# Build server
pnpm build:server
# Output: Built successfully ✓

# Check dist directory
ls -la dist/
# Should have: spa/ server/ ✓
```

### 4. Database Connection

```bash
# Test database connection
psql "$DATABASE_URL" -c "SELECT 1;"
# Output: 1 ✓

# Verify videos table exists
psql "$DATABASE_URL" -c "\dt videos"
# Output: videos table listed ✓

# Check table structure
psql "$DATABASE_URL" -c "\d videos"
# Output: Shows all columns ✓
```

---

## 🧪 Local Development Verification

Run these tests in development mode.

### 1. Start Development Server

```bash
pnpm dev
# Output should show:
# VITE v7.1.2 ready in XXX ms
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

### 2. Frontend Verification

Open browser to http://localhost:5173

**Visual Checks:**

- [ ] App loads without errors
- [ ] Logo/branding visible
- [ ] Navigation menu present
- [ ] Hero section with image
- [ ] "Start Generating" button visible
- [ ] Responsive on mobile (test with DevTools)

**Console Check:**

- Open DevTools (F12)
- Go to Console tab
- Should see NO red errors
- May see normal warnings (e.g., about third-party cookies)

### 3. Backend API Verification

```bash
# Test health endpoint
curl http://localhost:5173/api/health
# Expected response: {"status":"ok"}

# Test SMTP status
curl http://localhost:5173/api/auth/smtp-status
# Expected response: {"configured":true} or {"configured":false}

# Test with Stripe keys
curl http://localhost:5173/api/health
# Should still return 200 ✓
```

### 4. Payment Form Verification

In browser:

1. Click "Start Generating" button
2. Upload a test image (JPEG or PNG)
3. Select video duration
4. Select video quality
5. Click "Continue" or "Next"
6. See payment form loaded
7. **IMPORTANT**: Should show Stripe payment interface
8. **DO NOT** enter real card details in test mode

**Stripe Test Card:**

- Number: 4242 4242 4242 4242
- Expiry: Any future date (e.g., 12/99)
- CVC: Any 3 digits (e.g., 123)
- Cardholder: Any name
- ZIP: Any 5 digits

### 5. Database Operations

Test creating a video record:

```javascript
// In browser console, test video config save
fetch("/api/save-video-config", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "test@example.com",
    imageBase64: "data:image/jpeg;base64,/9j/4AAQSkZJRgABA...",
    duration: 10,
    resolution: "1080p",
  }),
})
  .then((r) => r.json())
  .then(console.log);

// Expected response: { success: true, videoId: XX, status: 'awaiting_payment' }
```

Verify in database:

```bash
psql "$DATABASE_URL" -c "SELECT id, email, status FROM videos ORDER BY created_at DESC LIMIT 1;"
# Output: Shows the video record just created ✓
```

---

## 🌐 Production Deployment Verification

### 1. Vercel Deployment Check

```bash
# After deployment, verify deployment URL
curl https://your-app.vercel.app/api/health
# Expected: {"status":"ok"}

# Check environment variables in Vercel dashboard
# Settings → Environment Variables → Verify all 5 keys present

# Check build logs
# Deployments → Click latest → View logs → No errors
```

### 2. Stripe Webhook Configuration

```bash
# In Stripe Dashboard → Developers → Webhooks

# Verify endpoint:
# URL: https://your-app.vercel.app/api/stripe-webhook
# Method: POST
# Events: payment_intent.succeeded, payment_intent.payment_failed
# Status: Active (green)

# View recent deliveries:
# Should show test events from your payments
```

### 3. Frontend Deployment Test

Open https://your-app.vercel.app in browser:

- [ ] App loads completely
- [ ] All images load (no broken image icons)
- [ ] Styling looks correct
- [ ] Mobile responsive (test with DevTools)
- [ ] No console errors (F12)
- [ ] Navigation works
- [ ] Form interactive

### 4. End-to-End Payment Test

1. Navigate to app: https://your-app.vercel.app
2. Click "Start Generating"
3. Upload test image
4. Configure video (duration, quality)
5. Enter email: test@example.com
6. Click "Continue"
7. Enter payment details:
   - Card: 4242 4242 4242 4242 (test card)
   - Expiry: 12/99 (any future date)
   - CVC: 123 (any digits)
8. Click "Pay"
9. Wait for redirect to "Generating Video" page

**Expected behavior:**

- Payment processes without errors
- Redirected to generation page
- Spinner shows "Generating Video"
- App polls for video status
- When complete, video preview shown
- Download button available

**Check database:**

```bash
psql "$DATABASE_URL" -c "
SELECT id, email, status, payment_status, payment_amount, request_id, video_url
FROM videos
WHERE email = 'test@example.com'
ORDER BY created_at DESC
LIMIT 1;
"

# Expected output shows:
# - status: completed (or processing if still generating)
# - payment_status: succeeded
# - payment_amount: your price in cents
# - request_id: from Fashion.ai
# - video_url: generated video URL
```

---

## 🔍 Component Verification

### Video Form Component

**File:** `client/components/SmartVideoForm.tsx`

Verify:

- [ ] Form renders
- [ ] Image upload works
- [ ] Duration dropdown works
- [ ] Quality dropdown works
- [ ] Continue button works
- [ ] Error messages display on validation failure
- [ ] Form resets after submission

### Payment Form Component

**File:** `client/components/StripePaymentForm.tsx`

Verify:

- [ ] Stripe form loads
- [ ] Card input fields appear
- [ ] Pay button is enabled
- [ ] Loading state shows during payment
- [ ] Error messages display on failure
- [ ] Success redirects to generation page
- [ ] Cancelled returns to form

### Video Status Component

**File:** `client/pages/Index.tsx` (in-progress section)

Verify:

- [ ] Loading spinner shows
- [ ] "Generating Video" message displays
- [ ] Polling starts automatically
- [ ] Status updates when video ready
- [ ] Error message shows if generation fails
- [ ] Can cancel and return to upload

---

## 📊 Database Verification

### Schema Check

```bash
# Connect to database
psql "$DATABASE_URL"

# List all tables
\dt

# Show videos table structure
\d videos

# Should see columns:
# - id (SERIAL PRIMARY KEY)
# - email (VARCHAR)
# - image_base64 (TEXT)
# - duration (INTEGER)
# - resolution (VARCHAR)
# - status (VARCHAR DEFAULT 'awaiting_payment')
# - payment_intent_id (VARCHAR)
# - payment_status (VARCHAR)
# - payment_amount (INTEGER)
# - payment_currency (VARCHAR)
# - payment_email (VARCHAR)
# - request_id (VARCHAR)
# - video_url (TEXT)
# - error_message (TEXT)
# - created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
# - expires_at (TIMESTAMP)
# - deleted_at (TIMESTAMP)
# - completed_at (TIMESTAMP)
```

### Data Verification

```bash
# Count total videos
SELECT COUNT(*) FROM videos;

# Find completed videos
SELECT id, email, status FROM videos WHERE status = 'completed';

# Find failed videos
SELECT id, email, status, error_message FROM videos WHERE status = 'failed';

# Find expired videos (not yet deleted)
SELECT id FROM videos WHERE expires_at < CURRENT_TIMESTAMP AND deleted_at IS NULL;

# Check soft-deleted videos
SELECT id, email, deleted_at FROM videos WHERE deleted_at IS NOT NULL;
```

---

## 🔐 Security Verification

### Checklist

```bash
# 1. Verify .env not committed to git
git log --all -S "DATABASE_URL" -- .env
# Output: Should be empty (no .env in commits) ✓

# 2. Verify no hardcoded API keys
grep -r "sk_live\|pk_live\|sk_test\|pk_test" . --exclude-dir=node_modules
# Output: Should be empty ✓

# 3. Verify no secrets in code
grep -r "apikey\|password\|secret" src/ --exclude-dir=node_modules | wc -l
# Output: Should be low (< 5) ✓

# 4. Check HTTPS in production
curl -I https://your-domain.com/
# Output: Should show 200 and SSL certificate ✓

# 5. Verify security headers
curl -I https://your-domain.com/ | grep -i "strict-transport\|x-frame\|x-content-type"
# Output: Should show security headers ✓
```

### Stripe Security

```bash
# 1. Verify webhook URL in Stripe Dashboard
# Should be: https://your-domain.com/api/stripe-webhook ✓

# 2. Verify signing secret set in environment
# STRIPE_WEBHOOK_SECRET should be set ✓

# 3. Test webhook signature verification
# Make test payment, check logs for "✓ Signature verified" ✓
```

---

## 🚀 Performance Verification

### Page Load Time

```bash
# Test using curl with timing
curl -w "Time: %{time_total}s\n" https://your-domain.com/

# Expected: < 2 seconds ✓
```

### API Response Time

```bash
# Test API endpoint timing
curl -w "Time: %{time_total}s\n" https://your-domain.com/api/health

# Expected: < 100ms ✓
```

### Database Connection

```bash
# Test query performance
time psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM videos;"

# Expected: < 100ms ✓
```

---

## 🧪 Test Scenarios

### Scenario 1: Complete Payment Flow

**Steps:**

1. Upload image
2. Configure video (10s, 1080p)
3. Enter email
4. Complete payment with test card
5. Wait for video generation
6. Download video

**Expected Result:**

- Payment succeeds
- Video generation starts
- Video appears in "My Videos"
- Download link works
- Downloaded file is valid MP4

### Scenario 2: Email Verification

(Only if SMTP configured)

**Steps:**

1. Go to "My Videos"
2. Enter email
3. Receive verification code
4. Enter code
5. View videos

**Expected Result:**

- Email received with code
- Code accepted
- Videos display
- Expired codes rejected

### Scenario 3: Video Expiry

**Steps:**

1. Create video
2. Wait 48+ hours
3. Try to access video
4. Run cleanup job manually

**Expected Result:**

- Video initially available
- After 48 hours, video removed from listing
- Soft-deleted in database
- Hard-deleted after cleanup

### Scenario 4: Error Handling

**Steps:**

1. Try payment without required fields
2. Try invalid email format
3. Attempt payment with invalid card (4000 0000 0000 9995)
4. Cancel payment

**Expected Result:**

- Validation errors shown
- Error messages are clear
- App doesn't crash
- Can retry payment

---

## 📋 Verification Checklist

### Pre-Launch

- [ ] .env file created with all required variables
- [ ] Database URL verified working
- [ ] Stripe keys verified working
- [ ] Fashion.ai API key verified
- [ ] `pnpm install` completed without errors
- [ ] `pnpm build` completed successfully
- [ ] `pnpm dev` starts without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] `/api/health` returns {"status":"ok"}

### Pre-Deployment

- [ ] All environment variables set correctly
- [ ] Database backups configured
- [ ] SSL certificate obtained
- [ ] Domain configured
- [ ] CORS origin set
- [ ] Error pages customized (optional)
- [ ] Analytics configured (optional)
- [ ] Support email configured
- [ ] Privacy policy added (if required)
- [ ] Terms of service added (if required)

### Post-Deployment

- [ ] App loads on production domain
- [ ] `/api/health` endpoint responds
- [ ] Payment form appears
- [ ] Test payment succeeds
- [ ] Video generation starts
- [ ] Video appears in database
- [ ] Stripe webhook deliveries show success
- [ ] No errors in production logs
- [ ] Mobile version works
- [ ] All buttons/links functional

### Security

- [ ] HTTPS/SSL enabled
- [ ] No API keys in frontend code
- [ ] No secrets in git history
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers present
- [ ] Webhook signature verified
- [ ] No debug logging in production
- [ ] Error messages don't expose sensitive data
- [ ] Database backed up

---

## 🆘 Troubleshooting Verification

### If Health Check Fails

```bash
# Check server is running
ps aux | grep node

# Check port is listening
lsof -i :5173

# Check error logs
tail -100 server.log

# Restart server
pnpm dev
```

### If Payment Fails

```bash
# Check Stripe API keys
grep STRIPE .env

# Check webhook in Stripe Dashboard
# Check recent webhook deliveries

# Check payment intent in Stripe
# Search for test email

# Check database for payment record
psql "$DATABASE_URL" -c "SELECT * FROM videos WHERE email = 'test@example.com';"
```

### If Video Generation Fails

```bash
# Check Fashion.ai API key
grep FASHN_AI_API_KEY .env

# Check request_id in database
SELECT request_id, status, error_message FROM videos ORDER BY created_at DESC LIMIT 1;

# Check Vercel logs for cron job
# Vercel Dashboard → Deployments → Logs

# Check video status endpoint
curl https://your-domain.com/api/video-status/123
```

### If Database Connection Fails

```bash
# Test connection
psql "$DATABASE_URL" -c "SELECT 1;"

# Check connection string format
echo "$DATABASE_URL"

# Check SSL requirements
# Should include: ?sslmode=require (for Neon)

# Check network connectivity
ping ep-xxxxx.neon.tech
```

---

## ✅ Sign-Off

Once all verifications pass, you can confidently deploy to production and launch publicly.

**Verification Status:**

- [ ] All pre-launch checks passed
- [ ] All pre-deployment checks passed
- [ ] All post-deployment checks passed
- [ ] All security checks passed
- [ ] Test payment successful
- [ ] Video generation working
- [ ] Team trained and ready
- [ ] Support process documented

**Date Verified:** ******\_\_\_******

**Verified By:** ******\_\_\_******

**Sign-Off:** ******\_\_\_******

See [README.md](./README.md) for more information.
