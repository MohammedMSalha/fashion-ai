# Fashion AI Video Generator

A full-stack SaaS application that generates professional fashion videos using AI. Users can upload fashion images, configure video settings, and purchase generated videos through integrated Stripe payments.

## 🎯 Features

- **AI Video Generation**: Generate professional fashion videos from static images
- **Stripe Integration**: Secure payment processing with PaymentIntent and Checkout
- **User Video Management**: Store, retrieve, and manage generated videos
- **Email Verification**: Optional email-based access control for video retrieval
- **Video Expiry**: Automatic video expiration after 48 hours with database cleanup
- **Responsive Design**: Mobile-first UI with Tailwind CSS
- **TypeScript**: Full-stack type safety with TypeScript
- **Background Jobs**: Video status polling and database cleanup tasks
- **Rate Limiting**: API rate limiting to prevent abuse
- **Production Ready**: Security headers, CORS, and error handling included

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v18+
- **pnpm**: Package manager (v10.14.0+)
- **Database**: Neon PostgreSQL (free tier available)
- **Stripe Account**: For payment processing
- **Fashion.ai API Key**: For video generation

### Installation

1. **Clone and Install**

```bash
git clone <repository-url>
cd fashion-ai-video-generator
pnpm install
```

2. **Environment Setup**
   Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:password@host/database

# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_your_key_here

# Video Generation API
FASHN_AI_API_KEY=your_fashion_ai_api_key

# Email Verification (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@example.com
SMTP_SECURE=false

# CORS (Optional)
CORS_ORIGIN=*
```

See [Environment Variables Guide](#environment-variables) for detailed setup instructions.

3. **Start Development Server**

```bash
pnpm dev
```

The application will be available at `http://localhost:5173`

## 📦 Tech Stack

### Frontend

- **React 18**: UI framework
- **React Router 6**: Client-side routing
- **TypeScript**: Type safety
- **Vite**: Build tool
- **Tailwind CSS 3**: Styling
- **Radix UI**: Component library
- **Stripe React**: Payment integration
- **Framer Motion**: Animations
- **React Hook Form**: Form handling

### Backend

- **Express 5**: HTTP server
- **Node.js**: Runtime
- **PostgreSQL**: Database
- **pg**: PostgreSQL client
- **Stripe SDK**: Payment processing
- **Nodemailer**: Email service
- **node-cron**: Job scheduling
- **helmet**: Security middleware
- **express-rate-limit**: Rate limiting

### Tools & Libraries

- **Zod**: Data validation
- **Lucide React**: Icons
- **Sonner**: Toast notifications
- **date-fns**: Date utilities

## 📋 Project Structure

```
.
├── client/                          # React frontend
│   ├── pages/                       # Route components
│   │   ├── Index.tsx                # Home page with video generator
│   │   ├── MyVideos.tsx             # User video gallery
│   │   └── Generate.tsx             # Video generation flow
│   ├── components/
│   │   ├── SmartVideoForm.tsx       # Video configuration form
│   │   ├── StripePaymentForm.tsx    # Payment form
│   │   ├── VideoSlider.tsx          # Video carousel
│   │   └── ui/                      # Pre-built UI components
│   ├── config/
│   │   └── api.ts                   # API configuration
│   ├── hooks/                       # Custom React hooks
│   ├── lib/                         # Utility functions
│   ├── App.tsx                      # Main app component
│   └── main.tsx                     # Application entry point
│
├── server/                          # Express backend
│   ├── routes/
│   │   ├── stripe-webhook.ts        # Stripe webhook handler
│   │   ├── stripe-payment.ts        # Payment intent creation
│   │   ├── stripe-checkout.ts       # Checkout session creation
│   │   ├── save-video.ts            # Video CRUD operations
│   │   ├── video-generation.ts      # Video generation logic
│   │   ├── email-auth.ts            # Email verification
│   │   ├── image-server.ts          # Image serving
│   │   ├── cron-*.ts                # Vercel cron jobs
│   │   └── demo.ts                  # Demo endpoint
│   ├── services/
│   │   ├── video-status.ts          # Fashion.ai API integration
│   │   └── email-verification.ts    # Email verification service
│   ├── jobs/
│   │   ├── cleanup-videos.ts        # Video cleanup scheduler
│   │   └── check-video-status.ts    # Status check scheduler
│   ├── db.ts                        # Database connection
│   └── index.ts                     # Express app setup
│
├── shared/                          # Shared types
│   └── api.ts                       # API interfaces
│
├── public/                          # Static assets
│   └── videos/                      # Sample videos
│
├── api/                             # Vercel serverless functions
│   └── [[...pathname]].ts           # API catch-all route
│
├── netlify/                         # Netlify serverless functions
│   └── functions/
│       └── api.ts                   # Netlify serverless wrapper
│
├── AGENTS.md                        # Developer guidelines
├── SMTP_SETUP.md                    # Email configuration guide
├── DEPLOYMENT.md                    # Deployment instructions
├── package.json                     # Dependencies
├── vercel.json                      # Vercel configuration
├── tailwind.config.ts               # Tailwind theming
└── tsconfig.json                    # TypeScript config
```

## 🌐 API Routes

### Authentication

- `GET /api/auth/smtp-status` - Check if email verification is configured
- `POST /api/auth/send-code` - Send verification code to email
- `POST /api/auth/verify-code` - Verify email code

### Videos

- `POST /api/save-video-config` - Save video configuration
- `POST /api/videos` - Get user's videos (email in body)
- `GET /api/video-status/:videoId` - Get video generation status
- `DELETE /api/videos/:videoId` - Delete a video

### Payments

- `POST /api/create-payment-intent` - Create Stripe PaymentIntent
- `POST /api/checkout-session` - Create Stripe Checkout session
- `POST /api/stripe-webhook` - Stripe webhook handler

### Admin

- `GET /api/health` - Health check
- `GET /api/demo` - Demo endpoint

## 💳 Payment Flow

1. **Video Configuration**: User uploads image and configures video settings
2. **Save Config**: POST `/api/save-video-config` returns `videoId`
3. **Create Payment**: POST `/api/create-payment-intent` with `videoId` in metadata
4. **User Pays**: Stripe processes payment via Checkout Session
5. **Webhook**: Stripe sends `payment_intent.succeeded` to `/api/stripe-webhook`
6. **Verification**: Webhook verifies Stripe signature using `STRIPE_WEBHOOK_SECRET`
7. **Video Generation**: Webhook extracts `videoId` and triggers video generation
8. **Status Polling**: Frontend polls `/api/video-status/:videoId` every 5 seconds
9. **Completion**: When video is ready, user sees preview and download option

## 🔧 Environment Variables

### Required

| Variable                 | Type   | Description                             |
| ------------------------ | ------ | --------------------------------------- |
| `DATABASE_URL`           | String | PostgreSQL connection string (Neon)     |
| `STRIPE_SECRET_KEY`      | String | Stripe secret API key                   |
| `STRIPE_PUBLISHABLE_KEY` | String | Stripe public API key                   |
| `STRIPE_WEBHOOK_SECRET`  | String | Stripe webhook signing secret           |
| `FASHN_AI_API_KEY`       | String | Fashion.ai API key for video generation |

### Optional

| Variable      | Type    | Description          | Default |
| ------------- | ------- | -------------------- | ------- |
| `SMTP_HOST`   | String  | SMTP server hostname | -       |
| `SMTP_PORT`   | Number  | SMTP server port     | 587     |
| `SMTP_USER`   | String  | SMTP username        | -       |
| `SMTP_PASS`   | String  | SMTP password        | -       |
| `SMTP_FROM`   | String  | Email sender address | -       |
| `SMTP_SECURE` | Boolean | Use SSL for SMTP     | false   |
| `CORS_ORIGIN` | String  | CORS allowed origins | \*      |

For detailed setup instructions, see [SMTP_SETUP.md](./SMTP_SETUP.md).

## 📝 Build & Deploy

### Development

```bash
# Start dev server with hot reload
pnpm dev

# Type checking
pnpm typecheck

# Run tests
pnpm test

# Format code
pnpm format.fix
```

### Production Build

```bash
# Build both client and server
pnpm build

# Start production server (Fly.io or local)
pnpm start
```

### Deployment Options

- **Vercel**: Easiest option, built-in serverless functions
- **Netlify**: Uses serverless functions via `netlify/functions/api.ts`
- **Fly.io**: Self-hosted option with `pnpm start`
- **Docker**: Self-contained deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 🗄️ Database Schema

### videos table

```sql
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  email VARCHAR(254),
  image_base64 TEXT,
  image_data BYTEA,
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

CREATE INDEX idx_email ON videos(email);
CREATE INDEX idx_status ON videos(status);
CREATE INDEX idx_expires_at ON videos(expires_at);
```

## 🔐 Security Features

- **Helmet**: Security headers (HSTS, XSS protection, etc.)
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: API rate limiting (5 requests/minute by default)
- **Stripe Verification**: Webhook signature verification
- **SQL Injection Protection**: Parameterized queries via pg library
- **Email Hiding**: Email stored in body (not URL) for sensitive requests
- **HTTPS**: Enforced on production
- **Permissions Policy**: Payment API access control

## 🎨 Customization

### Styling

- Theme colors in `client/global.css`
- Tailwind configuration in `tailwind.config.ts`
- UI components in `client/components/ui/`

### Video Settings

- Durations and resolutions configurable in forms
- Fashion.ai API parameters in `server/services/video-status.ts`

### Email Templates

- Verification email in `server/services/email-verification.ts`

## 📊 Video Status States

Videos transition through these states:

- `awaiting_payment` - Initial state, waiting for payment
- `processing` - Payment received, generating video
- `completed` - Video ready for download
- `failed` - Generation failed, error message stored

Videos with `deleted_at IS NOT NULL` are hidden from listings but remain in database.

## 🧹 Maintenance

### Video Cleanup

- Automatic cleanup runs every 10 minutes on Vercel
- Videos expire 48 hours after creation
- Cleanup job runs via Vercel cron at `/api/cron/cleanup-videos`

### Video Status Polling

- Frontend polls `/api/video-status/:videoId` every 5 seconds
- Server-side polling runs every 2 minutes via `/api/cron/check-video-status`
- Status checked against Fashion.ai API

### Database

- Connection pooling with max 5 connections
- Statement timeout: 5 seconds
- Connection timeout: 3 seconds

## 🐛 Troubleshooting

### Payment not processing

1. Verify `STRIPE_SECRET_KEY` is set
2. Check Stripe Dashboard for webhook deliveries
3. Ensure webhook URL matches `https://your-domain.com/api/stripe-webhook`
4. Verify `STRIPE_WEBHOOK_SECRET` is set

### Videos not generating

1. Check `FASHN_AI_API_KEY` is valid
2. View Vercel logs for error messages
3. Check video status: GET `/api/video-status/:videoId`
4. Verify database is connected: `DATABASE_URL`

### Email verification not working

1. Check SMTP credentials are set (or skip if not needed)
2. Test endpoint: GET `/api/auth/smtp-status`
3. Verify `SMTP_FROM` is valid sender identity

## 📄 License

This project is proprietary software. See LICENSE file for details.

## 🤝 Support

For issues and questions:

1. Check troubleshooting section above
2. Review logs in Vercel/Netlify dashboard
3. Check database connection status
4. Verify all environment variables are set

## 🎓 Learning Resources

- [Vercel Deployment Guide](./DEPLOYMENT.md#vercel)
- [SMTP Setup Guide](./SMTP_SETUP.md)
- [API Documentation](#api-routes)
- [Environment Variables](#environment-variables)

## 📝 Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and updates.
