# Fashion AI Video Generator - Complete Platform Usage Guide

A complete guide on how to use the Fashion AI Video Generator platform, including API keys, environment variables, and step-by-step setup instructions.

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [Getting Started](#getting-started)
3. [How to Use the Platform](#how-to-use-the-platform)
4. [API Keys Management](#api-keys-management)
5. [Environment Variables](#environment-variables)
6. [Demo Mode Setup](#demo-mode-setup)
7. [User Workflow](#user-workflow)
8. [Video Generation Process](#video-generation-process)
9. [Payment Processing](#payment-processing)
10. [Accessing Your Videos](#accessing-your-videos)
11. [Troubleshooting](#troubleshooting)
12. [FAQ](#faq)

---

## Platform Overview

The Fashion AI Video Generator is a web application that allows users to:

- **Upload Images**: Add fashion product or model images
- **Configure Videos**: Set duration and quality preferences
- **Generate Videos**: Create AI-powered videos from static images
- **Pay for Videos**: Process payments through Stripe
- **Download Videos**: Save and manage generated videos
- **Access Videos**: Retrieve videos anytime within the 48-hour window

### Key Features

✅ Fast AI video generation (30-60 seconds)
✅ Multiple quality options (720p, 1080p)
✅ Multiple duration options (5s, 10s, 15s, etc.)
✅ Secure payment processing
✅ Video management and download
✅ Email-based video access
✅ Automatic video expiration (48 hours)
✅ Optional email verification

---

## Getting Started

### Prerequisites

You need access to:

1. **A modern web browser** (Chrome, Firefox, Safari, Edge)
2. **An internet connection**
3. **A payment method** (for Stripe payments)
4. **Your email address** (for video access and verification)

### First Time Setup

1. **Open the Application**
   - Navigate to the application URL (e.g., https://fashion-ai.vercel.app)
   - You'll see the home page with a video generator form

2. **Upload Your Image**
   - Click the image upload area
   - Select a fashion image (JPEG, PNG, WebP)
   - Preview appears automatically

3. **Configure Your Video**
   - Select duration (5, 10, 15, or 20 seconds)
   - Choose quality (720p or 1080p)
   - Enter your email

4. **Start Generating**
   - Click "Start Generating" button
   - Proceed to payment

5. **Complete Payment**
   - Enter card details (or use Apple Pay/Google Pay)
   - Payment is processed securely by Stripe
   - Video generation starts automatically

6. **Wait for Your Video**
   - You'll see a loading screen
   - Video typically ready in 30-60 seconds
   - Download link appears automatically

---

## How to Use the Platform

### Step 1: Upload Your Image

**Where**: Main page, image upload section
**What**: Select a fashion image for video generation

```
Click the upload area → Select image file → Image preview shows
```

**Supported Formats**:

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)

**Image Requirements**:

- Minimum size: 100x100px
- Maximum size: 10MB
- Fashion/model focused images work best

### Step 2: Configure Video Settings

**Where**: Video configuration form
**What**: Set video parameters

**Duration Options**:

- 5 seconds (fast preview)
- 10 seconds (standard)
- 15 seconds (extended)
- 20 seconds (full showcase)

**Quality Options**:

- 720p (faster generation, smaller file)
- 1080p (better quality, larger file)
- 2K (ultra HD, requires more time)

**Example Configuration**:

```
Image: fashion-model.jpg
Duration: 10 seconds
Quality: 1080p
Email: your@email.com
```

### Step 3: Start Generating

**Where**: Bottom of the form
**What**: Begin the video generation process

```
1. Click "Start Generating" button
2. Review your selection
3. Proceed to payment
```

### Step 4: Complete Payment

**Where**: Payment form (appears after clicking Start Generating)
**What**: Pay for your video

**Payment Methods Accepted**:

- Credit/Debit cards (Visa, Mastercard, Amex)
- Apple Pay
- Google Pay
- Bank transfers (depending on location)

**What's Included in Price**:
✓ Video generation
✓ Cloud storage (48 hours)
✓ Download access
✓ Professional quality output

**Payment Security**:

- PCI DSS compliant (Stripe)
- Your card info never touches our servers
- Encrypted transactions
- Fraud protection included

### Step 5: Video Generation

**Duration**: 30-60 seconds typically

**What's Happening**:

1. Your image is sent to Fashion.ai API
2. AI analyzes the image
3. Video is generated with effects
4. Video is stored securely
5. Download link is created

**Status Tracking**:

- Loading screen shows progress
- Status updates every 5 seconds
- Real-time feedback on generation

### Step 6: Download Your Video

**Where**: Video preview page
**What**: Download the generated video

```
Click "Download Video" button → File saved to your device
```

**Video Details**:

- Format: MP4 (H.264)
- Duration: As configured
- Quality: As selected
- Ready to use immediately

**Availability**: Your video is available for 48 hours after generation

---

## API Keys Management

This section covers all aspects of API key management for the platform.

### What Are API Keys?

API keys are authentication tokens that allow the application to:

- Call the Fashion.ai service for video generation
- Process payments through Stripe
- Access databases and services

### System API Keys vs User-Provided Keys

#### System API Keys (Default)

**What**: Built-in API keys provided by the platform owner

**Configuration**:

```env
FASHN_AI_API_KEY=your_system_key_here
STRIPE_SECRET_KEY=your_stripe_key_here
```

**Usage**: Users don't need to provide keys; the system uses built-in credentials

**Advantages**:

- ✓ No user configuration needed
- ✓ Centralized key management
- ✓ Consistent performance
- ✓ Easier for end users

**When to Use**:

- Running the platform in production
- Multi-user SaaS environment
- When you want to manage costs centrally

#### User-Provided API Keys (Demo Mode)

**What**: Users can provide their own Fashion.ai API key

**When Available**: When `DEMO` environment variable is set to `true`

**Configuration**:

```env
DEMO=true
```

**How It Works**:

1. User clicks "Start Generating"
2. API Key modal appears
3. User enters their Fashion.ai API key
4. Video generation uses their key
5. Costs are charged to their account

**Advantages**:

- ✓ Users pay for their own usage
- ✓ No platform cost for generation
- ✓ Good for testing/demo purposes
- ✓ Flexible API key management

**When to Use**:

- Demo/testing environment
- Free tier with user-provided keys
- Development environment
- Freemium model (free users provide own keys)

---

## Environment Variables

Complete reference for all environment variables used by the platform.

### Database Configuration

```env
# PostgreSQL connection string (Required)
DATABASE_URL=postgresql://user:password@host:port/database

# Alternative name used in some deployments
fashion_DATABASE_URL=postgresql://user:password@host:port/database
```

**Example (Neon PostgreSQL)**:

```env
DATABASE_URL=postgresql://neondb_owner:npg_abc123@ep-example.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

**How to Get**:

1. Go to Neon dashboard (https://neon.tech)
2. Create a PostgreSQL database
3. Copy the connection string
4. Paste into DATABASE_URL

---

### Stripe Configuration

```env
# Stripe API Keys (Required for payments)
STRIPE_SECRET_KEY=sk_test_your_key_or_sk_live_your_key

# Stripe Publishable Key (Required for frontend)
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_or_pk_live_your_key

# Stripe Webhook Secret (Required for webhook verification)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

**How to Get**:

1. Sign up at https://stripe.com
2. Go to Developers → API Keys
3. Copy Secret Key → STRIPE_SECRET_KEY
4. Copy Publishable Key → STRIPE_PUBLISHABLE_KEY
5. Go to Webhooks → Add endpoint
6. Set URL to: `https://your-domain.com/api/stripe-webhook`
7. Select events: `payment_intent.succeeded`
8. Copy Signing Secret → STRIPE_WEBHOOK_SECRET

**Key Types**:

- `sk_test_*` = Test mode (for development)
- `sk_live_*` = Production mode (real money)
- `pk_test_*` = Test mode publishable
- `pk_live_*` = Production publishable

**Important**: Never use live keys in development!

---

### Fashion.ai Configuration

```env
# Fashion.ai API Key (Required for video generation)
FASHN_AI_API_KEY=fa-your_api_key_here
```

**How to Get**:

1. Sign up at https://fashion.ai
2. Go to API settings
3. Generate API key
4. Copy key to environment variable

**Usage in Code**:

- Stored securely on backend
- Never exposed to frontend
- Used for all video generation requests

---

### Demo Mode Configuration

```env
# Enable user-provided API keys (Optional)
DEMO=true  # Enable demo mode with user keys
DEMO=false # Disable demo mode (use system keys)
```

**Effect When DEMO=true**:

- 🔑 API Key modal appears when generating
- 📝 Users can enter their Fashion.ai key
- 💰 Generation uses their key
- ⚠️ Users responsible for costs

**Effect When DEMO=false**:

- 🔑 No API key modal
- 🔐 System key used automatically
- 💳 Platform pays for generation
- ✅ Seamless for users

---

### Email Configuration (Optional)

```env
# SMTP Server Details (Optional - email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@example.com
SMTP_SECURE=false
```

**When Email is Optional**:

- If SMTP variables not set, email verification is skipped
- Users can access videos without email code
- Clean experience for demo/testing

**Gmail Setup Example**:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx  # App password (16 chars with spaces)
SMTP_FROM=your-gmail@gmail.com
SMTP_SECURE=false
```

**SendGrid Setup Example**:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_sendgrid_key
SMTP_FROM=noreply@yourcompany.com
SMTP_SECURE=false
```

**Mailgun Setup Example**:

```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
SMTP_FROM=noreply@your-domain.mailgun.org
SMTP_SECURE=false
```

---

### Other Configuration

```env
# Node Environment
NODE_ENV=development  # or production

# CORS Configuration (Optional)
CORS_ORIGIN=*  # Allow all origins, or specific domain

# Port (for local development)
PORT=3000  # Server port
```

---

## Setting Environment Variables

### Local Development

**Method 1: Create .env file**

1. In project root, create `.env` file
2. Add all variables (see templates below)
3. Save file
4. Restart dev server: `pnpm dev`

**.env Template**:

```env
# Database
DATABASE_URL=postgresql://neondb_owner:password@host/neondb?sslmode=require

# Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret

# Fashion.ai
FASHN_AI_API_KEY=fa-your_api_key

# Demo Mode
DEMO=false

# Optional: Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
SMTP_FROM=noreply@example.com
SMTP_SECURE=false
```

**Method 2: Using DevServerControl (If Available)**

```
DevServerControl → set_env_variable
  Name: DATABASE_URL
  Value: postgresql://...
```

### Vercel Deployment

**Step 1**: Go to Vercel Dashboard
**Step 2**: Select your project
**Step 3**: Settings → Environment Variables
**Step 4**: Add each variable:

| Key                    | Value                  | Environments                     |
| ---------------------- | ---------------------- | -------------------------------- |
| DATABASE_URL           | your_connection_string | Production, Preview, Development |
| STRIPE_SECRET_KEY      | sk*test*...            | Production, Preview, Development |
| STRIPE_PUBLISHABLE_KEY | pk*test*...            | Production, Preview, Development |
| STRIPE_WEBHOOK_SECRET  | whsec\_...             | Production, Preview, Development |
| FASHN_AI_API_KEY       | fa\_...                | Production, Preview, Development |
| DEMO                   | false                  | Production, Preview, Development |

**Step 5**: Redeploy
**Step 6**: Verify in logs

### Netlify Deployment

**Step 1**: Go to Netlify Dashboard
**Step 2**: Site settings → Build & deploy
**Step 3**: Environment → Edit variables
**Step 4**: Add each variable and value
**Step 5**: Redeploy site

### Fly.io Deployment

```bash
# Set single variable
flyctl secrets set DATABASE_URL="postgresql://..."

# Set multiple variables
flyctl secrets set \
  DATABASE_URL="postgresql://..." \
  STRIPE_SECRET_KEY="sk_test_..." \
  STRIPE_PUBLISHABLE_KEY="pk_test_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  FASHN_AI_API_KEY="fa_..." \
  DEMO="false"

# View all secrets
flyctl secrets list

# Remove a secret
flyctl secrets unset VARIABLE_NAME
```

---

## Demo Mode Setup

### What is Demo Mode?

Demo mode allows users to provide their own Fashion.ai API key instead of using the platform's system key.

**Use Cases**:

- ✓ Free tier with user-provided keys
- ✓ Demo environment for testing
- ✓ Educational/tutorial setup
- ✓ Freemium model

### Enabling Demo Mode

**Step 1**: Set Environment Variable

Local development (`.env`):

```env
DEMO=true
```

Vercel:

- Go to Settings → Environment Variables
- Add: `DEMO` = `true`
- Redeploy

Netlify:

- Go to Build & deploy → Environment
- Add: `DEMO` = `true`
- Redeploy

**Step 2**: Restart Application

```bash
pnpm dev  # Local
```

Or redeploy to Vercel/Netlify

**Step 3**: Verify Demo Mode

1. Open application
2. Click "Start Generating"
3. Modal should appear asking for API key
4. User enters their Fashion.ai key
5. Video generates using their key

### Disabling Demo Mode

**Step 1**: Set Environment Variable

```env
DEMO=false
```

**Step 2**: Restart/Redeploy

Now users won't see the API key modal and system key is used automatically.

### Demo Mode User Experience

**When DEMO=true**:

```
1. User clicks "Start Generating"
   ↓
2. API Key Modal Appears
   "Please enter your Fashion.ai API Key (Demo Mode)"
   [Input field]
   [Continue button]
   ↓
3. User enters their key
   ↓
4. Video generation uses their key
   ↓
5. User charged for generation on their Fashion.ai account
```

**When DEMO=false**:

```
1. User clicks "Start Generating"
   ↓
2. Proceeds directly to payment
   (No API key modal)
   ↓
3. Video generation uses system key
   ↓
4. Platform charged for generation
```

---

## User Workflow

### Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. UPLOAD IMAGE                                                 │
│    User clicks image upload → Selects fashion image             │
│    Image preview shows automatically                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. CONFIGURE VIDEO                                              │
│    Select Duration (5s, 10s, 15s, 20s)                          │
│    Select Quality (720p, 1080p, 2K)                             │
│    Enter Email                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. CLICK "START GENERATING"                                     │
│    (If DEMO=true)                                               │
│    - API Key Modal appears                                      │
│    - User enters Fashion.ai key                                 │
│    (If DEMO=false)                                              │
│    - Skips directly to payment                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. ENTER PAYMENT DETAILS                                        │
│    Card number, expiry, CVC                                     │
│    Or use Apple Pay / Google Pay                                │
│    Billing address (if required)                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. COMPLETE PAYMENT                                             │
│    Stripe processes payment securely                            │
│    Payment confirmation sent                                    │
│    Video generation starts automatically                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. LOADING SCREEN                                               │
│    "Generating Your Video..."                                   │
│    Progress indicator                                           │
│    Status updates every 5 seconds                               │
│    Estimated time: 30-60 seconds                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────��────────────────────────────────────────────────┐
│ 7. VIDEO READY                                                  │
│    Video preview shows on page                                  │
│    Download button appears                                      │
│    Video ready for download                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. ACCESS VIDEOS                                                │
│    Go to "My Videos" page                                       │
│    Enter email to retrieve videos                               │
│    View all your generated videos                               │
│    Download anytime (within 48 hours)                           │
└───────────────────────────────��─────────────────────────────────┘
```

---

## Video Generation Process

### Behind the Scenes

When you click "Start Generating", here's what happens:

**Step 1: Configuration Saved** (Instant)

```
Your image + settings stored in database
You receive a unique video ID
Ready for payment
```

**Step 2: Payment Processed** (5-30 seconds)

```
Your card is charged
Payment confirmed by Stripe
Webhook notifies backend
Video generation begins
```

**Step 3: AI Processing** (30-60 seconds)

```
Fashion.ai analyzes your image
AI applies effects and transitions
Creates video with configured duration
Encodes to MP4 format
Uploads to storage
```

**Step 4: Availability** (Immediate)

```
Video link created
Frontend notified
Download link appears
Video accessible for 48 hours
```

**Step 5: Auto-Cleanup** (48 hours later)

```
Video expires
Automatically deleted from storage
History preserved in database
Space freed for new videos
```

### Monitoring Progress

The loading screen shows:

- Spinner animation
- "Generating Your Video..." message
- Time indicator (usually 30-60 seconds)
- Live status updates

**What You'll See**:

```
Loading... ⏳
Generating Your Video
This typically takes 30-60 seconds

Status: Processing... (Updates every 5 seconds)
```

### Possible Outcomes

**✅ Success**

```
Video is ready!
[Download Video button appears]
Preview plays on page
```

**❌ Failure**

```
"Video generation failed"
Error details shown
[Retry button]
Contact support if persists
```

**⏰ Timeout**

```
"Generation taking longer than expected"
Check "My Videos" page
Video might still be generating
Retry after a few minutes
```

---

## Payment Processing

### How Payment Works

1. **Amount Calculation**
   - Base price per video
   - May vary by duration/quality
   - Final amount shown before payment

2. **Secure Processing**
   - Stripe handles all card processing
   - Your card info never touches our servers
   - Encrypted end-to-end
   - PCI DSS compliant

3. **Multiple Methods**
   - Credit/Debit Cards (all major types)
   - Apple Pay
   - Google Pay
   - Bank transfers (region dependent)

4. **Verification**
   - Stripe signature verification
   - Webhook confirmation
   - Database update
   - Video generation trigger

### Payment Status

**Processing**:

```
"Processing payment..." ⏳
(Usually 5-30 seconds)
```

**Success**:

```
Payment confirmed ✅
"Generating your video..."
Loading screen shows
```

**Failed**:

```
"Payment failed" ��
Reason shown (card declined, insufficient funds, etc.)
Try again with different card
```

### Payment Security

- 🔒 SSL/TLS encryption
- 🛡️ PCI DSS Level 1 compliance
- ✅ Fraud detection enabled
- 🔐 Webhook signature verification
- 📱 3D Secure support
- 🚫 No card data stored on our servers

---

## Accessing Your Videos

### My Videos Page

**Location**: Click "My Videos" in navigation

**Access**:

1. Enter your email address
2. (Optional) Verify with email code if enabled
3. View all your generated videos
4. Download any video

### Video Details

Each video shows:

- ✓ Thumbnail/preview
- ✓ Duration
- ✓ Quality/resolution
- ✓ Generation date
- ✓ Download button
- ✓ Time remaining (if within 48 hours)

### Downloading Videos

**Steps**:

1. Go to "My Videos" page
2. Find your video
3. Click "Download" button
4. Video saves to your device
5. Use in your project/business

**Video Format**:

- Format: MP4 (H.264 codec)
- Container: MPEG-4
- Playable in all modern devices
- Upload to social media, websites, etc.

### Video Expiration

**48-Hour Window**:

- Video is available for 48 hours after generation
- Download and save your copy
- After 48 hours, automatically deleted
- Can always generate new video

**Before Expiration**:

```
My Videos page shows:
[Video] - Generated 2 hours ago (Expires in 46 hours)
[Download button]
```

**After Expiration**:

```
Video no longer listed
Generate new video if needed
```

---

## Troubleshooting

### Image Upload Issues

**Problem**: Image won't upload

```
Solutions:
1. Check file size (max 10MB)
2. Check file type (JPEG, PNG, WebP)
3. Try different image
4. Refresh page
5. Clear browser cache
```

**Problem**: Image preview doesn't show

```
Solutions:
1. Image might be invalid
2. Browser might be blocking images
3. Try different image file
4. Check browser console for errors
```

### Payment Issues

**Problem**: "Payment Failed"

```
Solutions:
1. Check card details (number, expiry, CVC)
2. Sufficient funds in account
3. Card not declined by bank
4. Try different payment method
5. Contact your bank if issue persists
```

**Problem**: "Payment Success but No Video"

```
Solutions:
1. Wait 2-3 minutes (sometimes delays)
2. Refresh page
3. Check "My Videos" page
4. Check email for video link
5. Contact support if still missing
```

**Problem**: Webhook not received

```
Solutions:
1. Check Stripe Dashboard → Webhooks
2. Verify webhook endpoint URL
3. Check STRIPE_WEBHOOK_SECRET is set
4. Check server logs for errors
5. Contact Stripe support
```

### Video Generation Issues

**Problem**: "Video Generation Failed"

```
Solutions:
1. Try again with different image
2. Use simpler/clearer image
3. Try different duration/quality
4. Check Fashion.ai API status
5. Verify FASHN_AI_API_KEY is valid
6. Check server logs for errors
```

**Problem**: "Generation Taking Too Long"

```
Solutions:
1. Usually takes 30-60 seconds
2. Don't close browser tab
3. Check "My Videos" page
4. Video might be processing in background
5. Wait up to 10 minutes total
6. If still waiting, reload page
```

**Problem**: "Invalid API Key" (Demo Mode)

```
Solutions:
1. Check key is copied correctly
2. Fashion.ai key, not other service key
3. Key should start with "fa-"
4. Check for extra spaces
5. Get new key from Fashion.ai dashboard
```

### Email Issues

**Problem**: "Email Code Not Received"

```
Solutions:
1. Check spam/junk folder
2. Wait 2-3 minutes (sometimes delayed)
3. Check email address is correct
4. Resend code button
5. Try different email
6. Contact support
```

**Problem**: "Email Verification Not Working"

```
Solutions:
1. SMTP might not be configured
2. Try accessing videos without email code
3. Admin should check SMTP settings
4. Verify SMTP credentials are correct
5. Check server logs for email errors
```

### Video Access Issues

**Problem**: "Can't Download Video"

```
Solutions:
1. Check video is fully generated (shows thumbnail)
2. Check video hasn't expired (48 hour window)
3. Try different browser
4. Check disk space on device
5. Try downloading again
6. Contact support if persists
```

**Problem**: "My Videos Page Shows No Videos"

```
Solutions:
1. Check you entered correct email
2. Video might have expired (48 hours)
3. Generate new video
4. Email might not match what you used
5. Check browser cookies are enabled
```

### General Issues

**Problem**: "Page Won't Load"

```
Solutions:
1. Check internet connection
2. Refresh page (Ctrl+F5 or Cmd+Shift+R)
3. Clear browser cache
4. Try different browser
5. Try incognito/private window
6. Check application status page
```

**Problem**: "Slow Performance"

```
Solutions:
1. Check internet speed
2. Close other browser tabs
3. Disable browser extensions
4. Try different time (less traffic)
5. Try mobile instead of desktop (or vice versa)
6. Contact support if persistent
```

---

## FAQ

### General Questions

**Q: What is this platform?**
A: Fashion AI Video Generator creates professional fashion videos from static images using artificial intelligence. You upload an image, configure duration/quality, pay, and receive a video in 30-60 seconds.

**Q: How does the AI work?**
A: The platform uses Fashion.ai's advanced neural networks to analyze your image and generate realistic video with motion, effects, and transitions.

**Q: Is my image safe?**
A: Yes. Images are encrypted in transit and storage. They're automatically deleted after video generation (or 48 hours, whichever comes first).

**Q: Can I use generated videos commercially?**
A: Yes, videos are yours to use as you wish (subject to terms of service). Great for e-commerce, social media, marketing.

---

### Account & Access

**Q: Do I need to create an account?**
A: No, the platform is email-based. Just enter your email and you can access your videos anytime.

**Q: How long are videos available?**
A: 48 hours after generation. Download and save your copy before expiration.

**Q: Can I access videos from multiple devices?**
A: Yes, go to "My Videos" and enter your email on any device to access your videos.

**Q: What if I lose my video?**
A: If expired, you can generate a new video from the same image. Original video can't be recovered once deleted.

---

### Video Generation

**Q: How long does generation take?**
A: Typically 30-60 seconds after payment. Most videos ready in 45 seconds.

**Q: What if generation fails?**
A: You'll see an error message. Click retry to try again. If persistent, contact support.

**Q: Can I cancel generation after payment?**
A: No, payment triggers generation immediately. But you can generate additional videos.

**Q: Can I regenerate the same image?**
A: Yes, you can generate the same image multiple times (each with separate payment).

---

### Quality & Duration

**Q: What duration should I choose?**
A: Depends on use case:

- 5s: Social media clips, quick preview
- 10s: Standard product video
- 15s: Extended showcase
- 20s: Full product walkthrough

**Q: What quality should I choose?**
A:

- 720p: Sufficient for most uses, faster, smaller file
- 1080p: Better quality, social media recommended
- 2K: Premium quality, largest file

**Q: What's the difference between qualities?**
A:

- 720p: 1280x720 pixels, fast generation, ~50MB file
- 1080p: 1920x1080 pixels, professional, ~100MB file
- 2K: 2560x1440 pixels, premium, ~150MB file

---

### Payment

**Q: What payment methods are accepted?**
A: Credit/debit cards (Visa, Mastercard, Amex), Apple Pay, Google Pay, and bank transfers (region dependent).

**Q: Is my payment information safe?**
A: Absolutely. Stripe (PCI DSS Level 1 compliant) handles all payments. Your card info never touches our servers.

**Q: Can I get a refund?**
A: Refunds are handled by Stripe. Contact support with your payment ID for refund requests.

**Q: Why was my payment declined?**
A: Common reasons:

- Insufficient funds
- Card expired or blocked
- Bank declined transaction
- 3D Secure required
  Contact your bank or try different card.

**Q: Can I save my payment information?**
A: Stripe offers to save card details for future payments (optional).

---

### Demo Mode & API Keys

**Q: What is Demo Mode?**
A: Optional feature where users provide their own Fashion.ai API key instead of using the platform's key. Good for free tiers or testing.

**Q: How do I enable Demo Mode?**
A: Set `DEMO=true` in environment variables and restart app. Users will see an API key modal.

**Q: Should I use Demo Mode for production?**
A: No, use `DEMO=false` (default). Demo mode is better for free tiers or freemium models.

**Q: What if user provides invalid API key?**
A: Video generation will fail with an error. User should verify their key is correct.

**Q: Can I have both modes?**
A: No, DEMO is either true or false. Can't mix both in same deployment.

---

### API & Technical

**Q: What is an API key?**
A: Secure token that grants access to a service. Platform uses multiple keys:

- FASHN_AI_API_KEY: For video generation
- STRIPE_SECRET_KEY: For payment processing
- STRIPE_WEBHOOK_SECRET: For webhook verification

**Q: Should I share my API keys?**
A: Never! Keep them secret. Only set in environment variables.

**Q: Where do I set environment variables?**
A: Depends on deployment:

- Local: `.env` file in project root
- Vercel: Settings → Environment Variables
- Netlify: Build & deploy → Environment
- Fly.io: `flyctl secrets set VARIABLE_NAME value`

**Q: What if I leak an API key?**
A: Regenerate immediately:

- Stripe: Dashboard → API Keys → Regenerate
- Fashion.ai: API Settings → Regenerate Key
- GitHub: Rotate personal access tokens

---

### Email & Verification

**Q: Is email verification required?**
A: No, it's optional. If SMTP not configured, users access videos without verification code.

**Q: How does email verification work?**
A:

1. User enters email in "My Videos"
2. System sends 6-digit code
3. User enters code
4. Access granted to their videos

**Q: Why would I enable email verification?**
A: Extra security for video access. Prevents unauthorized access if someone knows their email.

**Q: How long is the verification code valid?**
A: 15 minutes. User must enter code within this window.

**Q: Can I resend the code?**
A: Yes, click "Resend Code" button after code expires.

---

### Troubleshooting

**Q: What should I do if something doesn't work?**
A: Follow these steps:

1. Refresh page (Ctrl+F5)
2. Clear browser cache
3. Try different browser
4. Try incognito mode
5. Check application status page
6. Contact support with details

**Q: Where can I see error logs?**
A: Browser console (F12 → Console tab) shows client-side errors. Server logs visible in Vercel/Netlify dashboard.

**Q: How do I contact support?**
A: Check the application footer for support contact or email. Include: what you did, what happened, any error messages.

---

## Additional Resources

### Documentation Files

- **[README.md](./README.md)** - Main documentation
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guides
- **[API.md](./API.md)** - API reference
- **[SECURITY.md](./SECURITY.md)** - Security details
- **[SMTP_SETUP.md](./SMTP_SETUP.md)** - Email setup
- **[INSTALLATION.md](./INSTALLATION.md)** - Installation guide
- **[FEATURES.md](./FEATURES.md)** - Feature list

### External Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Fashion.ai API Docs](https://fashion.ai/docs)
- [Neon PostgreSQL](https://neon.tech/docs)
- [Vercel Deployment](https://vercel.com/docs)

---

## Support & Contact

### Getting Help

If you encounter issues:

1. **Check This Guide**: Most common issues covered in Troubleshooting section
2. **Check FAQ**: Quick answers to common questions
3. **Check Server Logs**: Error details in Vercel/Netlify dashboard
4. **Check Browser Console**: Press F12, click Console tab
5. **Contact Support**: Email/contact form in application footer

### Providing Good Support Details

When contacting support, include:

- What you were trying to do
- What happened instead
- Any error messages (take screenshot)
- Device/browser being used
- Steps to reproduce the issue
- Payment ID (if payment-related)

---

## Version & Updates

**Platform Version**: 1.0.0
**Last Updated**: 2024
**Documentation**: Complete and current

For version history, see [CHANGELOG.md](./CHANGELOG.md).

---

## Summary

This platform provides an easy, secure way to generate professional fashion videos from images. Whether using system keys or demo mode with user-provided keys, the process is straightforward:

1. **Upload** your image
2. **Configure** settings
3. **Provide API key** (if in demo mode)
4. **Pay** securely
5. **Download** your video

All features are production-ready, secure, and well-documented. For detailed technical information, see other documentation files.

**Happy video generating! 🎥✨**
