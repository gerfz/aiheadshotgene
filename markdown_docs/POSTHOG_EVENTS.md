# PostHog Analytics Events

This document describes all analytics events tracked in the AI Headshot Generator app using PostHog.

## Configuration

- **API Key**: `phc_HsMJRuIpEXVZqSEGxLMGF14KS9jzxjN88O5mNvfg57r`
- **Host**: `https://eu.i.posthog.com` (EU region)
- **Dashboard**: [https://eu.posthog.com](https://eu.posthog.com)

## Automatic Events (SDK Built-in)

These events are automatically captured by the PostHog SDK:

| Event | Description |
|-------|-------------|
| `Application Opened` | App opened from closed state |
| `Application Backgrounded` | App moved to background |
| `Application Installed` | First time app is opened after install |
| `Application Updated` | App opened after an update |
| `Deep Link Opened` | App opened via a deep link |

---

## Custom Events

### App Lifecycle

| Event | Properties | Description |
|-------|------------|-------------|
| `app_opened` | - | User opens the app (custom trigger) |
| `onboarding_completed` | - | User completes the onboarding flow |

### Photo Upload

| Event | Properties | Description |
|-------|------------|-------------|
| `photo_uploaded` | `source`: `"camera"` \| `"gallery"` | User uploads a photo for generation |

### Style Selection

| Event | Properties | Description |
|-------|------------|-------------|
| `style_selected` | `style_key`: string, `category`: string | User selects a style preset |
| `category_filtered` | `category`: string | User filters styles by category |
| `custom_prompt_used` | `prompt_length`: number | User enters a custom prompt |

### Photo Generation

| Event | Properties | Description |
|-------|------------|-------------|
| `generation_started` | `style_key`: string, `has_credits`: boolean | Generation process begins |
| `generation_completed` | `style_key`: string, `duration_seconds`: number | Generation completes successfully |
| `generation_failed` | `style_key`: string, `error`: string | Generation fails with error |

### Photo Actions

| Event | Properties | Description |
|-------|------------|-------------|
| `photo_downloaded` | `style_key`: string | User downloads a generated photo |
| `photo_shared` | `style_key`: string | User shares a generated photo |
| `photo_deleted` | `style_key`: string | User deletes a generated photo |
| `photo_edited` | `style_key`: string | User edits a generated photo |

### Monetization

| Event | Properties | Description |
|-------|------------|-------------|
| `subscription_screen_viewed` | - | User views the subscription/pricing screen |
| `subscription_purchased` | `plan`: string, `price`: string | User completes a subscription purchase |
| `subscription_restored` | - | User restores a previous purchase |
| `credits_depleted_banner_shown` | - | "Upgrade Now" banner shown when credits = 0 |
| `upgrade_now_clicked` | `source`: `"banner"` \| `"profile"` \| `"generation"` | User clicks upgrade button |

### Profile

| Event | Properties | Description |
|-------|------------|-------------|
| `profile_viewed` | - | User views the profile screen |
| `email_set` | - | User sets/updates their email address |

### Navigation

| Event | Properties | Description |
|-------|------------|-------------|
| `screen_viewed` | `screen_name`: string | User navigates to a screen |

### App Rating

| Event | Properties | Description |
|-------|------------|-------------|
| `rate_us_shown` | - | Rate Us popup is displayed to the user |
| `app_rated` | `rating`: number (1-5) | User rates the app |

---

## Usage Examples

### Import the analytics module

```typescript
import { analytics } from '../src/services/posthog';
```

### Track events in your components

```typescript
// When user uploads a photo
analytics.photoUploaded('gallery');

// When user selects a style
analytics.styleSelected('corporate', 'Professional');

// When generation starts
analytics.generationStarted('corporate', true);

// When generation completes
analytics.generationCompleted('corporate', 45.2);

// When user clicks upgrade
analytics.upgradeNowClicked('banner');
```

### Identify users (optional)

```typescript
import { identifyUser } from '../src/services/posthog';

// After user authentication
identifyUser(userId, {
  device_id: deviceId,
  is_anonymous: true,
});
```

---

## Key Metrics to Track

### Conversion Funnel
1. `app_opened` → Total app opens
2. `onboarding_completed` → Onboarding completion rate
3. `photo_uploaded` → Photo upload rate
4. `style_selected` → Style selection rate
5. `generation_started` → Generation initiation rate
6. `generation_completed` → Generation success rate

### Monetization Metrics
- `subscription_screen_viewed` → Interest in premium
- `upgrade_now_clicked` → Upgrade intent
- `subscription_purchased` → Conversion rate
- `credits_depleted_banner_shown` → Credit usage patterns

### Engagement Metrics
- `photo_downloaded` / `photo_shared` → Content engagement
- `photo_edited` → Feature usage
- Popular `style_key` values → Style preferences
- `generation_failed` errors → Technical issues

---

## Adding New Events

To add a new event:

1. Add the event function to `mobile/src/services/posthog.ts`:

```typescript
export const analytics = {
  // ... existing events
  
  myNewEvent: (param1: string, param2: number) => 
    trackEvent('my_new_event', { param1, param2 }),
};
```

2. Call it from your component:

```typescript
analytics.myNewEvent('value1', 42);
```

3. Update this documentation!

