# SMTP Configuration Guide

## Overview

Email verification is **optional** in this application. If SMTP credentials are not configured, the email verification step will be skipped automatically, and users can access their videos without requiring email verification.

## When to Configure SMTP

Configure SMTP only if you want to require email verification for users accessing their videos.

## Environment Variables

To enable email verification, add the following environment variables to your Vercel deployment:

| Variable | Type | Required | Example | Description |
|----------|------|----------|---------|-------------|
| `SMTP_HOST` | String | Yes | `smtp.gmail.com` | SMTP server hostname |
| `SMTP_PORT` | Number | Yes | `587` | SMTP server port (typically 587 for TLS or 465 for SSL) |
| `SMTP_USER` | String | Yes | `your-email@gmail.com` | SMTP username or email address |
| `SMTP_PASS` | String | Yes | `app-specific-password` | SMTP password (use app-specific password for Gmail) |
| `SMTP_FROM` | String | Yes | `noreply@fashionai.com` | Sender email address (can be different from SMTP_USER) |
| `SMTP_SECURE` | Boolean | No | `true` | Set to "true" for SSL (port 465), false/empty for TLS (port 587) |

## Setup Examples

### Gmail SMTP Setup

1. Enable 2-Factor Authentication on your Google Account
2. Generate an App-Specific Password:
   - Go to https://myaccount.google.com/apppasswords
   - Select Mail and Windows Computer
   - Copy the 16-character password

3. Set environment variables in Vercel:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
SMTP_FROM=noreply@fashionai.com
SMTP_SECURE=false
```

### SendGrid SMTP Setup

1. Get your SendGrid API credentials from https://app.sendgrid.com/settings/api_keys
2. Create a Sender Identity at https://app.sendgrid.com/settings/sender_auth

3. Set environment variables in Vercel:

```
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your-sendgrid-api-key-here
SMTP_FROM=noreply@yourdomain.com
SMTP_SECURE=false
```

### Mailgun SMTP Setup

1. Get your Mailgun SMTP credentials from https://app.mailgun.com/app/account/security/api_keys
2. Find SMTP credentials in the Mailgun dashboard

3. Set environment variables in Vercel:

```
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
SMTP_FROM=noreply@your-domain.mailgun.org
SMTP_SECURE=false
```

## How It Works

### With SMTP Configured ✓
- Users must verify their email with a 6-digit code
- Code expires in 15 minutes
- Maximum 5 failed attempts per code
- Email is sent via SMTP provider

### Without SMTP Configured (Default)
- Email verification is **skipped**
- Users can directly access their videos
- No email code is required
- No external email service is needed

## Adding Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each SMTP variable as a new entry
4. Redeploy your application

## Testing Your Configuration

1. Check the API endpoint: `GET /api/auth/smtp-status`
   - Returns `{ configured: true }` if SMTP is set up correctly
   - Returns `{ configured: false }` if SMTP is not configured

2. Test sending a code: `POST /api/auth/send-code`
   ```json
   {
     "email": "test@example.com"
   }
   ```

## Troubleshooting

### "SMTP_SECURE" Configuration
- Use `SMTP_SECURE=false` for port 587 (TLS)
- Use `SMTP_SECURE=true` for port 465 (SSL)
- Leave empty or `false` for most providers

### Gmail App Password Issues
- Must use an app-specific password, not your regular Gmail password
- The password format is `xxxx xxxx xxxx xxxx` (16 characters with spaces)
- Remove spaces when entering into Vercel

### Verification Code Not Received
- Check email spam/junk folder
- Verify `SMTP_FROM` is a valid sender identity in your email provider
- Check Vercel function logs for SMTP errors

## Security Notes

- Never commit SMTP credentials to git
- Always use app-specific passwords (especially for Gmail)
- SMTP credentials are sensitive - treat them like passwords
- Use environment variables to store credentials, never hardcode them
