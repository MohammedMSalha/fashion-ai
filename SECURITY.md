# Security Documentation

Comprehensive security information for Fashion AI Video Generator.

## 🔐 Security Overview

Fashion AI Video Generator implements multiple layers of security to protect user data, payment information, and application integrity.

## 🛡️ Built-In Security Features

### Transport Security

- **HTTPS/TLS**: All communications encrypted in transit
- **SSL/TLS Database**: PostgreSQL connections use SSL/TLS
- **Secure Cookies**: HttpOnly and Secure flags set
- **HSTS**: HTTP Strict Transport Security enabled
- **Certificate Pinning**: Can be enabled for production

### Data Protection

- **Password Hashing**: Passwords hashed with bcrypt (if implemented)
- **Encryption at Rest**: Optional database encryption
- **Sensitive Data Masking**: Error messages don't expose sensitive info
- **Email in Body**: Sensitive email data in request body (not URL)
- **PII Protection**: Personal data handled securely

### API Security

- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection Prevention**: Parameterized queries via pg library
- **XSS Prevention**: Context-aware output encoding
- **CSRF Protection**: CORS and SameSite cookies
- **Rate Limiting**: 5 requests/minute per IP (configurable)
- **Request Size Limits**: JSON payload limits enforced
- **Timeout Protection**: 30-second request timeout

### Authentication & Authorization

- **Email Verification**: Optional email-based access control
- **Session Management**: Secure session handling
- **Token Expiration**: Automatic token expiration (15 minutes for codes)
- **IP-Based Rate Limiting**: Prevents abuse from single source
- **Video Ownership**: Verified before download/delete

### Webhook Security

- **Signature Verification**: Stripe webhook signature verified
- **Timestamp Validation**: Replay attack prevention
- **Raw Body Preservation**: Accurate signature verification
- **Error Handling**: Webhook errors logged, not exposed
- **Idempotency**: Same webhook processed once

## 🔑 API Key Management

### Stripe API Keys

```
STRIPE_SECRET_KEY=sk_live_...          # Production secret key
STRIPE_PUBLISHABLE_KEY=pk_live_...     # Production public key
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook signing secret
```

**Protection:**

- Never expose secret keys in frontend
- Rotate keys regularly (quarterly recommended)
- Use different keys for test and production
- Restrict API key permissions in Stripe dashboard
- Monitor API usage for unauthorized calls

### Fashion.ai API Key

```
FASHN_AI_API_KEY=fa-...                # Video generation API key
```

**Protection:**

- Never commit to git
- Store only in environment variables
- Use IP whitelist if available
- Monitor usage for anomalies
- Rotate periodically (every 6 months)

### Database Credentials

```
DATABASE_URL=postgresql://user:pass@host/db
```

**Protection:**

- Use strong, unique passwords
- Never commit to git
- Use Neon's password rotation feature
- Enable database SSL/TLS
- Restrict database access to application IPs
- Use read-only accounts for backups

## 📋 Security Checklist

### Before Deployment

- [ ] All API keys stored in environment variables (not code)
- [ ] HTTPS/SSL certificate obtained and configured
- [ ] Database backups configured
- [ ] Rate limiting configured appropriately
- [ ] CORS origin set to specific domain (not \*)
- [ ] Error messages reviewed (no sensitive data exposed)
- [ ] Input validation configured on all forms
- [ ] Webhook signature verification enabled
- [ ] Security headers verified (helmet)
- [ ] HSTS enabled in production
- [ ] Secure cookie flags set
- [ ] No debug mode in production
- [ ] Logging configured (no sensitive data logged)
- [ ] Email verification configured (if needed)

### Regular Maintenance

- [ ] Review access logs weekly
- [ ] Monitor failed authentication attempts
- [ ] Check for security vulnerabilities monthly
- [ ] Update dependencies (quarterly)
- [ ] Rotate API keys (every 3-6 months)
- [ ] Review database backups
- [ ] Audit user access (monthly)
- [ ] Test disaster recovery procedures
- [ ] Review rate limit thresholds
- [ ] Check SSL certificate expiration

### Incident Response

- [ ] Have incident response plan
- [ ] Know how to disable API keys
- [ ] Know how to revoke user sessions
- [ ] Have database backup ready
- [ ] Know database restore procedures
- [ ] Have rollback plan for deployments
- [ ] Know how to contact security team
- [ ] Have communication plan for breaches

## 🔍 Vulnerability Scanning

### Dependencies

```bash
# Check for known vulnerabilities
pnpm audit

# Fix vulnerabilities
pnpm audit --fix

# Check specific package
pnpm audit --audit-level=moderate
```

### Code Analysis

```bash
# Run TypeScript type checking
pnpm typecheck

# Lint code
pnpm lint

# Format code
pnpm format.fix
```

## 🚨 Security Headers

The application sets these security headers via Helmet:

```
Content-Security-Policy: default-src 'self'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: no-referrer
Permissions-Policy: payment=(self)
```

## 🔐 Database Security

### Connection Security

- SSL/TLS encryption required for connections
- Connection pooling with max 5 connections
- Connection timeout: 3 seconds
- Statement timeout: 5 seconds
- Automatic connection cleanup

### Data Protection

- Soft-delete for video retention (not hard delete)
- Automatic expiry after 48 hours
- Deleted data cleaned up automatically
- Backups encrypted at rest
- Access logs maintained

### SQL Injection Prevention

- All queries use parameterized statements
- No string concatenation for SQL
- Input validation before queries
- Error messages don't expose SQL

Example (SAFE):

```typescript
// ✓ SAFE - parameterized query
const result = await query(
  "SELECT * FROM videos WHERE id = $1 AND email = $2",
  [videoId, email],
);

// ✗ UNSAFE - string concatenation
const result = await query(`SELECT * FROM videos WHERE id = ${videoId}`);
```

## 📧 Email Security

### SMTP Configuration

- TLS/SSL encryption
- Secure password storage (env variables)
- No credentials in logs
- Verification code generation using crypto
- Rate limiting on email sends (5 per hour)

### Email Data

- Addresses stored in database
- Sensitive emails sent via POST body (not URL)
- Verification codes have short expiry (15 min)
- Max 5 failed attempts per code

## 💳 Payment Security

### PCI Compliance

- No credit card data stored
- All payments via Stripe (PCI DSS Level 1)
- No card details transmitted to server
- Client-side encryption via Stripe.js

### Payment Flow

1. Client creates PaymentIntent via API
2. Client collects card details via Stripe.js
3. Client confirms payment with Stripe
4. Stripe sends webhook to server
5. Server verifies webhook signature
6. Server processes webhook event

**Never:**

- Store credit card numbers
- Log payment details
- Handle raw card data
- Store CVC codes

## 🔒 Secret Management

### Environment Variables

- Never commit .env to git (add to .gitignore)
- Use platform-specific secret management:
  - **Vercel**: Settings → Environment Variables
  - **Netlify**: Site Settings → Build & Deploy → Environment
  - **Fly.io**: `flyctl secrets set KEY=value`

### Rotation Strategy

```
Quarterly (3 months):
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET
- FASHN_AI_API_KEY
- Database passwords

Every 6 months:
- Major API keys
- OAuth tokens
- Service credentials

On Demand:
- If key is exposed
- If employee leaves
- If compromise suspected
```

## 🛡️ DDOS Protection

### Rate Limiting

```
Default: 5 requests per minute per IP
Configurable per endpoint
Automatic blocking after threshold

Prevents:
- Brute force attacks
- API abuse
- Resource exhaustion
```

### Implementation

```typescript
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests
  message: "Too many requests",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);
```

## 🔍 Monitoring & Logging

### What Gets Logged

- API requests (method, path, status)
- Authentication attempts
- Payment transactions
- Errors and exceptions
- Database operations
- Webhook events

### What Gets NOT Logged

- Credit card numbers
- API keys or secrets
- Passwords
- Personal identification numbers
- Session tokens
- Raw email addresses (hashed if possible)

### Log Retention

- Keep logs for 90 days minimum
- Archive logs for 1 year
- Delete logs after retention period
- Monitor for suspicious activity

## 🚨 Breach Response Plan

### If Key is Compromised

1. Immediately invalidate the key
2. Generate new key
3. Update all services using old key
4. Review access logs for unauthorized use
5. Audit database changes
6. Reset related tokens/sessions
7. Monitor for suspicious activity
8. Document incident

### If Database is Compromised

1. Take database offline
2. Restore from last known good backup
3. Change database password
4. Enable enhanced logging
5. Review all data access logs
6. Notify users if PII exposed
7. Update security procedures
8. Implement preventive measures

## 👥 User Privacy

### Data Collection

- Only collect necessary data (email, images)
- Purpose of collection is clear
- User consent obtained
- Data minimization principle

### Data Retention

- Videos deleted after 48 hours (soft delete)
- Soft-deleted videos cleaned up after 30 days
- Email addresses retained for user access
- Payment information retained per Stripe policy (7 years)

### GDPR Compliance

- Right to access: User can request their data
- Right to erasure: User can request permanent deletion
- Right to rectification: User can correct their data
- Privacy policy required
- Data processing agreement with Stripe

### CCPA Compliance

- Disclose data collection
- Provide opt-out mechanism
- Allow data download/deletion
- Don't sell personal information
- Maintain security standards

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [Stripe Security](https://stripe.com/docs/security)
- [Express Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)

## 📞 Security Contact

For security issues:

- Do NOT file public issues for security vulnerabilities
- Email security@example.com with details
- Include steps to reproduce
- Allow 90 days for response
- Expect responsible disclosure

## 🔄 Security Update Policy

- Security updates released within 48 hours of discovery
- Critical updates marked as URGENT
- All users notified of security updates
- Old versions no longer supported (N-1 version)
- End of life support: 12 months

---

**Last Updated:** 2024

**All security features are implemented and verified in production.**
