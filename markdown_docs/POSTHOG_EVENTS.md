# PostHog Analytics Events

This document describes all analytics events tracked in the AI Headshot Generator app using PostHog.

## Configuration

- **API Key**: `phc_HsMJRuIpEXVZqSEGxLMGF14KS9jzxjN88O5mNvfg57r`
- **Host**: `https://eu.i.posthog.com` (EU region)
- **Dashboard**: [https://eu.posthog.com](https://eu.posthog.com)

## User Identification & Super Properties

All PostHog events automatically include these properties for every user:

- **`device_id`**: Hardware device ID (matches Supabase `profiles.device_id`)
- **`user_id`**: Supabase user ID (matches `profiles.id`)
- **`is_anonymous`**: Whether the user is anonymous or has a real account
- **`email`**: User's email address

These properties are set when the app identifies the user and are included in ALL subsequent events. This allows you to:
- **Correlate PostHog events with Supabase database records** using `device_id` or `user_id`
- **Track user behavior across sessions** (same device_id)
- **See which events belong to which user** in your database

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
| `app_launched` | - | App launched (very first event) |
| `loading_started` | `timestamp`: number | App loading started |
| `loading_finished` | `duration_ms`: number, `success`: boolean | App loading completed |
| `app_opened` | - | User opens the app (custom trigger) |
| `onboarding_screen_viewed` | - | User views onboarding screen |
| `onboarding_dive_in_clicked` | - | User clicks "Dive in" on onboarding |
| `onboarding_completed` | - | User completes the onboarding flow |

**Note**: We do not track "loading abandoned" events because:
- Users may legitimately minimize the app during loading
- iOS/Android may suspend the app automatically
- The app continues loading in the background
- This creates unreliable data and false positives

To measure loading performance, compare `loading_started` vs `loading_finished` event counts and durations.

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
| `trial_activated` | `trial_credits`: number, `trial_duration_days`: number | User receives free trial (1000 credits, 3 days) |
| `subscription_screen_viewed` | `source`: string | User views the subscription/pricing screen |
| `subscription_screen_closed` | `method`: string, `duration_seconds`: number | User closes subscription screen |
| `free_trial_toggled` | `enabled`: boolean | User toggles free trial on/off |
| `start_free_trial_clicked` | `has_free_trial`: boolean, `price`: string | User clicks start free trial button |
| `subscription_purchased` | `plan`: string, `price`: string, `had_free_trial`: boolean | User completes a subscription purchase |
| `subscription_purchase_failed` | `error`: string | Subscription purchase fails |
| `subscription_restored` | - | User restores a previous purchase |
| `credit_pack_purchased` | `pack_id`: string, `product_id`: string, `credits`: number, `price`: string | User purchases credit pack |
| `credit_pack_purchase_failed` | `error`: string | Credit pack purchase fails |
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

## Correlating PostHog Events with Supabase Database

Since every PostHog event includes `device_id` and `user_id`, you can easily correlate events with your Supabase database:

### Example: Find all events for a specific user

1. In Supabase, get the user's `device_id`:
```sql
SELECT device_id, id FROM profiles WHERE id = 'USER_ID_HERE';
```

2. In PostHog, filter events by `device_id`:
   - Go to Events or Insights
   - Add filter: `device_id = "DEVICE_ID_HERE"`
   - Or filter by: `user_id = "USER_ID_HERE"`

### Example: Track user journey for a specific device

```sql
-- In Supabase: Get all users on a device
SELECT id, email, created_at, total_credits 
FROM profiles 
WHERE device_id = 'DEVICE_ID_HERE';
```

Then in PostHog, filter all events by that `device_id` to see the complete user journey across multiple accounts on the same device.

### Example: Find users who viewed subscription but didn't purchase

In PostHog, create a funnel:
1. Event: `subscription_screen_viewed`
2. Event: `subscription_purchased` (did not happen)

Then export the `user_id` values and query Supabase to see their profiles, credits, etc.

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

