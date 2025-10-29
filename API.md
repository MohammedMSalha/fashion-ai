# API Reference

Complete API endpoint documentation for Fashion AI Video Generator.

## Base URL

```
Development: http://localhost:5173
Production: https://your-domain.com
```

All API endpoints are prefixed with `/api/`

## Authentication

Most endpoints use email-based identification. Email should be sent in request body, not as a parameter.

Optional email verification adds a verification code requirement for video access.

## Status Codes

| Code | Meaning                          |
| ---- | -------------------------------- |
| 200  | Success                          |
| 201  | Created                          |
| 204  | No Content                       |
| 400  | Bad Request                      |
| 404  | Not Found                        |
| 429  | Too Many Requests (rate limited) |
| 500  | Server Error                     |

## Rate Limiting

- **Limit**: 5 requests per minute per IP address
- **Headers**: Check `X-RateLimit-Remaining` header
- **Retry**: Wait before retrying after 429 status

## Error Response Format

```json
{
  "error": "Error message",
  "status": 400,
  "details": "Additional information"
}
```

---

## 📹 Video Configuration

### Save Video Configuration

**POST** `/api/save-video-config`

Saves video configuration and returns a `videoId` for payment processing.

**Request Body:**

```json
{
  "email": "user@example.com",
  "imageBase64": "data:image/jpeg;base64,/9j/4AAQSkZ...",
  "duration": 10,
  "resolution": "1080p"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email address |
| imageBase64 | string | Yes | Base64-encoded image (data URL format) |
| duration | number | Yes | Video duration in seconds (5, 10, 15, 20, 30) |
| resolution | string | Yes | Video resolution (480p, 720p, 1080p, 2K) |

**Response (200):**

```json
{
  "success": true,
  "videoId": 123,
  "status": "awaiting_payment",
  "message": "Configuration saved"
}
```

**Response (400):**

```json
{
  "error": "Invalid image format",
  "status": 400
}
```

**Example:**

```bash
curl -X POST http://localhost:5173/api/save-video-config \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "imageBase64": "data:image/jpeg;base64,...",
    "duration": 10,
    "resolution": "1080p"
  }'
```

---

## 💳 Payment

### Create Payment Intent

**POST** `/api/create-payment-intent`

Creates a Stripe PaymentIntent for the video generation.

**Request Body:**

```json
{
  "amount": 2999,
  "email": "user@example.com",
  "videoId": 123,
  "duration": "10",
  "quality": "1080p"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| amount | number | Yes | Price in cents (2999 = $29.99) |
| email | string | Yes | Customer email |
| videoId | number | Yes | Video ID from save-video-config |
| duration | string | Yes | Video duration |
| quality | string | Yes | Video quality |

**Response (200):**

```json
{
  "clientSecret": "pi_1234567890_secret_abcdefghij",
  "paymentIntentId": "pi_1234567890",
  "amount": 2999,
  "currency": "usd"
}
```

**Example:**

```bash
curl -X POST http://localhost:5173/api/create-payment-intent \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2999,
    "email": "user@example.com",
    "videoId": 123,
    "duration": "10",
    "quality": "1080p"
  }'
```

### Create Checkout Session

**POST** `/api/checkout-session`

Creates a Stripe Checkout session for hosted payment page.

**Request Body:**

```json
{
  "amount": 2999,
  "email": "user@example.com",
  "videoId": 123,
  "duration": "10",
  "quality": "1080p"
}
```

**Response (200):**

```json
{
  "sessionId": "cs_test_abc123",
  "checkoutUrl": "https://checkout.stripe.com/pay/cs_test_abc123"
}
```

---

## 📹 Videos

### Get User Videos

**POST** `/api/videos`

Retrieves all videos for a user (excluding deleted ones).

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email address |

**Response (200):**

```json
{
  "videos": [
    {
      "id": 123,
      "email": "user@example.com",
      "duration": 10,
      "resolution": "1080p",
      "status": "completed",
      "video_url": "https://cdn.example.com/video.mp4",
      "created_at": "2024-01-15T10:30:00Z",
      "expires_at": "2024-01-17T10:30:00Z"
    }
  ],
  "count": 1
}
```

**Response (404):**

```json
{
  "error": "No videos found",
  "videos": []
}
```

**Example:**

```bash
curl -X POST http://localhost:5173/api/videos \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Delete Video

**DELETE** `/api/videos/:videoId`

Soft-deletes a video (marks as deleted but keeps in database).

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| videoId | number | Yes (URL) | Video ID to delete |

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Video deleted",
  "videoId": 123
}
```

**Response (404):**

```json
{
  "error": "Video not found"
}
```

**Example:**

```bash
curl -X DELETE http://localhost:5173/api/videos/123 \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

---

## 📊 Video Status

### Get Video Status

**GET** `/api/video-status/:videoId`

Gets the current generation status of a video.

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| videoId | number | Yes (URL) | Video ID |

**Response (200):**

```json
{
  "video": {
    "id": 123,
    "status": "completed",
    "video_url": "https://cdn.example.com/video.mp4",
    "request_id": "req_abc123",
    "error_message": null,
    "created_at": "2024-01-15T10:30:00Z",
    "completed_at": "2024-01-15T10:45:00Z"
  }
}
```

**Status Values:**
| Status | Meaning |
|--------|---------|
| awaiting_payment | Waiting for payment |
| processing | Payment received, generating |
| completed | Video ready |
| failed | Generation failed |

**Response (404):**

```json
{
  "error": "Video not found"
}
```

**Example:**

```bash
curl http://localhost:5173/api/video-status/123
```

---

## 📧 Email & Authentication

### Check SMTP Status

**GET** `/api/auth/smtp-status`

Checks if email verification is configured.

**Response (200):**

```json
{
  "configured": true
}
```

Or:

```json
{
  "configured": false
}
```

**Example:**

```bash
curl http://localhost:5173/api/auth/smtp-status
```

### Send Verification Code

**POST** `/api/auth/send-code`

Sends a 6-digit verification code to user's email.

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Response (200):**

```json
{
  "requiresCode": true,
  "message": "Code sent to email",
  "expiresIn": 900
}
```

**Response (200 - SMTP not configured):**

```json
{
  "requiresCode": false,
  "message": "Email verification not configured"
}
```

**Example:**

```bash
curl -X POST http://localhost:5173/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Verify Code

**POST** `/api/auth/verify-code`

Verifies the 6-digit code sent to user's email.

**Request Body:**

```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email |
| code | string | Yes | 6-digit verification code |

**Response (200):**

```json
{
  "verified": true,
  "message": "Email verified"
}
```

**Response (400):**

```json
{
  "error": "Invalid code",
  "attemptsRemaining": 3
}
```

**Example:**

```bash
curl -X POST http://localhost:5173/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "code": "123456"}'
```

---

## 🔔 Webhooks

### Stripe Webhook

**POST** `/api/stripe-webhook`

Receives and processes Stripe webhook events.

**Headers:**

```
stripe-signature: t=1234567890,v1=abcdef123456...
```

**Payload (payment_intent.succeeded):**

```json
{
  "id": "evt_1234567890",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "amount": 2999,
      "currency": "usd",
      "metadata": {
        "videoId": "123",
        "email": "user@example.com",
        "duration": "10",
        "quality": "1080p"
      }
    }
  }
}
```

**Automatically triggers:**

1. Video generation via Fashion.ai API
2. Database update with payment info
3. Status changed to "processing"
4. Video status polling started

**Response (200):**

```json
{
  "received": true,
  "processed": true
}
```

**Note:** Webhook signature is verified against `STRIPE_WEBHOOK_SECRET`

---

## 🏥 System

### Health Check

**GET** `/api/health`

Simple health check endpoint.

**Response (200):**

```json
{
  "status": "ok"
}
```

**Example:**

```bash
curl http://localhost:5173/api/health
```

---

## 🎯 Common Workflows

### Complete Video Generation Workflow

1. **Save Configuration**

   ```bash
   POST /api/save-video-config
   Response: videoId = 123
   ```

2. **Create Payment Intent**

   ```bash
   POST /api/create-payment-intent
   Body: { videoId: 123, ... }
   Response: clientSecret
   ```

3. **Process Payment**
   - Use Stripe.js client-side
   - Stripe sends webhook automatically

4. **Webhook Handler**

   ```bash
   POST /api/stripe-webhook (automatic)
   Triggers: Video generation starts
   ```

5. **Poll Status**

   ```bash
   GET /api/video-status/123 (every 5 seconds)
   Until status = "completed"
   ```

6. **Retrieve Videos**
   ```bash
   POST /api/videos
   Response: Includes video_url and download link
   ```

---

## 🚨 Error Handling

### Network Errors

- Implement exponential backoff for retries
- Check `X-RateLimit-Remaining` header
- Handle 429 (Too Many Requests) gracefully

### Payment Errors

- Invalid amount: Return 400
- Missing email: Return 400
- Duplicate payment: Return 400
- Stripe connection error: Return 500

### Video Errors

- Video not found: Return 404
- Invalid configuration: Return 400
- Generation failure: Status = "failed"
- Expired video: Return 404

### Email Errors

- Invalid email format: Return 400
- Code expired: Return 400
- Too many attempts: Return 429
- SMTP not configured: Return 200 with requiresCode=false

---

## 📚 SDK Examples

### JavaScript/Node.js

```javascript
// Create video config
const response = await fetch("/api/save-video-config", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "user@example.com",
    imageBase64: "data:image/jpeg;base64,...",
    duration: 10,
    resolution: "1080p",
  }),
});

const { videoId } = await response.json();

// Get video status
const status = await fetch(`/api/video-status/${videoId}`).then((r) =>
  r.json(),
);
console.log(status.video.status); // completed, processing, failed, etc.
```

### Python

```python
import requests

# Create video config
response = requests.post('http://localhost:5173/api/save-video-config', json={
    'email': 'user@example.com',
    'imageBase64': 'data:image/jpeg;base64,...',
    'duration': 10,
    'resolution': '1080p'
})

video_id = response.json()['videoId']

# Get video status
status = requests.get(f'http://localhost:5173/api/video-status/{video_id}').json()
print(status['video']['status'])
```

### cURL

```bash
# Create video config
curl -X POST http://localhost:5173/api/save-video-config \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "imageBase64": "data:image/jpeg;base64,...",
    "duration": 10,
    "resolution": "1080p"
  }' | jq '.videoId'

# Poll video status
curl http://localhost:5173/api/video-status/123 | jq '.video.status'
```

---

## 📞 Support

For API issues:

1. Check environment variables are set
2. Verify database connection
3. Check Stripe API keys
4. Review server logs
5. Test health endpoint: `/api/health`

See [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting) for troubleshooting guide.
