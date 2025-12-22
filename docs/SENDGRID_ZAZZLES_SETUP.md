# SendGrid Setup for Zazzles

## Overview

Zazzles uses SendGrid for transactional emails, sharing the same SendGrid account as HeyMag.

## Quick Setup Checklist

- [ ] Add SendGrid API key to Vercel environment variables
- [ ] Verify zazzles.app domain in SendGrid
- [ ] Create sender identity for `hello@zazzles.app`
- [ ] Test email sending via API

---

## Step 1: Environment Variables

### Required Variables

Add these to Vercel (Settings > Environment Variables):

```bash
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=hello@zazzles.app
SENDGRID_FROM_NAME=Zazzles
```

### Using Existing HeyMag API Key

You can use the same API key as HeyMag. The API key is not domain-specific.

**To get the API key:**
1. Go to [SendGrid Settings > API Keys](https://app.sendgrid.com/settings/api_keys)
2. Use existing key OR create a new one for Zazzles (recommended for security)

---

## Step 2: Domain Authentication

**Required** to send from `@zazzles.app` addresses.

### 2.1 Authenticate Domain in SendGrid

1. Go to [Settings > Sender Authentication](https://app.sendgrid.com/settings/sender_auth)
2. Click "Authenticate Your Domain"
3. Choose DNS host (Cloudflare, GoDaddy, etc.)
4. Enter domain: `zazzles.app`
5. Use "Automated security" (recommended)

### 2.2 Add DNS Records

SendGrid will provide DNS records. Add these to your DNS provider:

**CNAME Records (for DKIM):**
```
em1234.zazzles.app -> u1234567.wl123.sendgrid.net
s1._domainkey.zazzles.app -> s1.domainkey.u1234567.wl123.sendgrid.net
s2._domainkey.zazzles.app -> s2.domainkey.u1234567.wl123.sendgrid.net
```

**TXT Record (for SPF):**
```
zazzles.app -> v=spf1 include:sendgrid.net ~all
```

### 2.3 Verify Domain

1. Click "Verify" in SendGrid dashboard
2. DNS propagation takes 5-60 minutes
3. Status should show "Verified"

---

## Step 3: Sender Identity

Create a verified sender for the from address.

1. Go to [Settings > Sender Authentication > Single Sender Verification](https://app.sendgrid.com/settings/sender_auth/senders)
2. Click "Create New Sender"
3. Fill in:
   - **From Email**: `hello@zazzles.app`
   - **From Name**: `Zazzles`
   - **Reply To**: `support@zazzles.app` (or same as from)
   - **Company**: Your company details
   - **Physical Address**: Required by CAN-SPAM

4. Click "Create" and verify if prompted

---

## Step 4: Test Email Sending

### Via API (Admin Only)

```bash
# Check configuration
curl https://marketing.heymag.app/api/email/test

# Send test email (requires admin auth)
curl -X POST https://marketing.heymag.app/api/email/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "template": "welcome",
    "recipientEmail": "your-email@example.com"
  }'
```

### Available Test Templates

| Template | Description |
|----------|-------------|
| `welcome` | New user welcome email |
| `purchase_confirmation` | Credit pack purchase |
| `subscription_activated` | Subscription started |
| `credits_added` | Credits topped up |
| `low_credits` | Low credits warning |
| `trial_ending` | Trial ending reminder |
| `trial_expired` | Trial expired notice |

---

## Email Templates

All templates are in `/Users/lexnaweiming/Test/marketing-heymag/lib/email/templates.ts`

### Template Features

- Zazzles branding (orange/navy color scheme)
- Responsive design (mobile-friendly)
- Both HTML and plain text versions
- Consistent footer with social links
- Clear CTAs

### Customizing Templates

Edit `/Users/lexnaweiming/Test/marketing-heymag/lib/email/templates.ts`:

```typescript
// Brand colors are defined at the top
const BRAND = {
  primary: '#FF6B35',    // Warm orange
  secondary: '#1A1A2E',  // Dark navy
  accent: '#FFE66D',     // Golden yellow
  // ...
}
```

---

## Integration Points

### Stripe Webhooks

Purchase/subscription emails should be triggered from Stripe webhooks:

```typescript
// In /app/api/stripe/webhook/route.ts
import { sendPurchaseConfirmationEmail, sendSubscriptionActivatedEmail } from '@/lib/email'

// After successful payment
await sendPurchaseConfirmationEmail({
  businessName: profile.business_name,
  email: user.email,
  productName: 'Pro Plan',
  amount: 8000, // cents
  currency: 'usd',
  creditsAdded: 100,
  totalCredits: profile.credits + 100,
})
```

### Auth Flows

Password reset emails should be triggered from auth:

```typescript
// In password reset handler
import { sendPasswordResetEmail } from '@/lib/email'

await sendPasswordResetEmail({
  email: userEmail,
  resetUrl: `https://marketing.heymag.app/auth/reset-password?token=${token}`,
  expiresIn: '1 hour',
})
```

### Low Credits Warning

Trigger after each credit usage:

```typescript
import { sendLowCreditsWarningEmail } from '@/lib/email'

// After credit deduction
if (newBalance < 5 && newBalance > 0) {
  await sendLowCreditsWarningEmail({
    businessName: profile.business_name,
    email: user.email,
    remainingCredits: newBalance,
    suggestedPack: '23 Credit Pack ($99)',
    buyUrl: 'https://marketing.heymag.app/pricing#credits',
  })
}
```

---

## Troubleshooting

### "Sender not verified" Error

1. Check sender identity is created and verified
2. Ensure `SENDGRID_FROM_EMAIL` matches verified sender
3. Wait for domain verification to complete

### Emails Not Arriving

1. Check spam folder
2. Verify domain authentication is complete
3. Check SendGrid Activity feed for delivery status
4. Ensure recipient email is valid

### Rate Limiting (429 Error)

SendGrid has sending limits based on your plan:
- Free: 100 emails/day
- Essentials: 100k/month
- Pro: 1.5M/month

Check [SendGrid Dashboard > Stats](https://app.sendgrid.com/statistics) for usage.

---

## Security Notes

- Never expose SendGrid API key in client-side code
- API key should have minimum required permissions
- Consider separate API keys per project for isolation
- Monitor SendGrid Activity for suspicious activity

---

## Related Files

| File | Purpose |
|------|---------|
| `/Users/lexnaweiming/Test/marketing-heymag/lib/email/email-service.ts` | Core email sending |
| `/Users/lexnaweiming/Test/marketing-heymag/lib/email/templates.ts` | HTML templates |
| `/Users/lexnaweiming/Test/marketing-heymag/lib/email/types.ts` | TypeScript types |
| `/Users/lexnaweiming/Test/marketing-heymag/app/api/email/test/route.ts` | Test endpoint |
| `/Users/lexnaweiming/Test/marketing-heymag/.env.example` | Environment template |

---

Last updated: 2024-12-22
