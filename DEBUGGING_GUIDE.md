# Debugging Guide - Generation Failures

## Overview
This guide explains how to debug generation failures using the improved logging system.

## Backend Logs - What to Look For

### 1. Generation Request Logs

When a user makes a generation request, you'll see:

```
📝 [GENERATE REQUEST] User: 12345678... | Device: 67ef9dc6f662ee57 | Style: with_supercar
```

This tells you:
- **User ID** (first 8 chars) - who made the request
- **Device ID** - guest device identifier
- **Style** - which style they selected

### 2. Credits Check Logs

```
💳 [CREDITS CHECK] User: 12345678... | Subscribed: false | Credits: 2
```

This shows:
- Whether user is subscribed
- How many free credits they have

### 3. Credit Usage Logs

```
💰 [CREDIT USED] User: 12345678... | Remaining: 1
```

Confirms a credit was successfully deducted.

### 4. Job Queue Logs

```
✅ [JOB QUEUED] User: 12345678... | Job ID: abc-123 | Gen ID: def-456 | Style: with_supercar
```

Confirms the job was successfully added to the queue.

### 5. Worker Processing Logs

```
🔄 [WORKER START] User: 12345678... | Job: abc-123 | Gen: def-456 | Style: with_supercar
📥 [IMAGE DOWNLOADED] User: 12345678... | Size: 1234567 bytes
🎨 [AI GENERATION] User: 12345678... | Style: with_supercar
✅ [JOB COMPLETED] User: 12345678... | Job: abc-123 | Generated URL: https://...
```

Shows the complete lifecycle of job processing.

## Common Failure Scenarios

### Scenario 1: No Credits

**Logs:**
```
📝 [GENERATE REQUEST] User: 12345678... | Device: abc123 | Style: luxury_car
💳 [CREDITS CHECK] User: 12345678... | Subscribed: false | Credits: 0
❌ [GENERATE FAILED] User: 12345678... | Reason: No credits (sub: false, credits: 0)
```

**PostHog Event:**
- Event: `generation_failed`
- Properties: `error_type: 'no_credits'`, `noCredits: true`

### Scenario 2: Credit Decrement Failed

**Logs:**
```
📝 [GENERATE REQUEST] User: 12345678... | Device: abc123 | Style: luxury_car
💳 [CREDITS CHECK] User: 12345678... | Subscribed: false | Credits: 1
❌ [GENERATE FAILED] User: 12345678... | Reason: Credit decrement failed - [error message]
```

**What to check:** Database credit decrement function errors

### Scenario 3: Job Creation Failed

**Logs:**
```
📝 [GENERATE REQUEST] User: 12345678... | Device: abc123 | Style: luxury_car
💳 [CREDITS CHECK] User: 12345678... | Subscribed: false | Credits: 2
💰 [CREDIT USED] User: 12345678... | Remaining: 1
❌ [GENERATE FAILED] User: 12345678... | Reason: Failed to create job - [error message]
```

**What to check:** Database connection, generation_jobs table

### Scenario 4: Content Policy Violation

**Logs:**
```
🔄 [WORKER START] User: 12345678... | Job: abc-123 | Gen: def-456 | Style: with_supercar
📥 [IMAGE DOWNLOADED] User: 12345678... | Size: 1234567 bytes
🎨 [AI GENERATION] User: 12345678... | Style: with_supercar
❌ [JOB FAILED] User: 12345678... | Job: abc-123 | Error: CONTENT_POLICY_VIOLATION - Image flagged as sensitive
🚫 [CONTENT VIOLATION] User: 12345678... | Job: abc-123 | No retries - permanent failure
```

**PostHog Event:**
- Event: `generation_failed`
- Properties: `error_type: 'content_violation'`, `contentViolation: true`

### Scenario 5: API/Network Error During Generation

**Logs:**
```
🔄 [WORKER START] User: 12345678... | Job: abc-123 | Gen: def-456 | Style: with_supercar
📥 [IMAGE DOWNLOADED] User: 12345678... | Size: 1234567 bytes
🎨 [AI GENERATION] User: 12345678... | Style: with_supercar
❌ [JOB FAILED] User: 12345678... | Job: abc-123 | Error: API request failed - 500 Internal Server Error
🔄 [RETRY QUEUED] User: 12345678... | Job: abc-123 | Will retry after backoff
```

**What to check:** NanoBanana API status, rate limits, API key validity

### Scenario 6: Image Download Failed

**Logs:**
```
🔄 [WORKER START] User: 12345678... | Job: abc-123 | Gen: def-456 | Style: with_supercar
❌ [JOB FAILED] User: 12345678... | Job: abc-123 | Error: Failed to download image: 404 Not Found
🔄 [RETRY QUEUED] User: 12345678... | Job: abc-123 | Will retry after backoff
```

**What to check:** Supabase storage, image URL validity

### Scenario 7: Timeout

**PostHog Event:**
- Event: `generation_failed`
- Properties: `error_type: 'timeout'`, `timeout: true`, `error: 'Request timed out after 120 seconds'`

**What to check:** Worker is running, no jobs stuck in processing state

### Scenario 8: No Image Uploaded

**Logs:**
```
📝 [GENERATE REQUEST] User: 12345678... | Device: abc123 | Style: luxury_car
❌ [GENERATE FAILED] User: 12345678... | Reason: No image uploaded
```

**What to check:** Mobile app image upload logic

## PostHog Analytics

All generation failures are now tracked with detailed context:

### Event Properties:
- `style_key` - Which style was being generated
- `error` - The actual error message
- `error_type` - One of: `no_credits`, `content_violation`, `network_error`, `timeout`, `unknown`
- `noCredits` (boolean) - True if user ran out of credits
- `contentViolation` (boolean) - True if content policy violation
- `networkError` (boolean) - True if network/API error
- `timeout` (boolean) - True if request timed out

### How to Use in PostHog:

1. Go to "Events" → Filter by `generation_failed`
2. Group by `error_type` to see the breakdown
3. Filter by `error_type = 'unknown'` to find issues that need investigation
4. Check `error` property to see the exact error messages

## Quick Troubleshooting Steps

1. **Check PostHog** - Look at `generation_failed` events and group by `error_type`
2. **Check Backend Logs** - Search for the user ID or device ID to see their full journey
3. **Look for patterns** - Are failures concentrated on specific styles? Specific users? Specific times?
4. **Check Worker Status** - Make sure the worker is running and processing jobs

## Log Search Tips

To find a specific user's generation attempts:
```
grep "User: 12345678" logs.txt
```

To find all failures:
```
grep "GENERATE FAILED" logs.txt
grep "JOB FAILED" logs.txt
```

To see credit-related issues:
```
grep "CREDITS CHECK" logs.txt
```

To see worker activity:
```
grep "WORKER" logs.txt
```
