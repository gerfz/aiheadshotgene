# PostHog Event Tracking

Complete list of all PostHog events tracked in the AI Headshot Generator app.

## App Lifecycle & Loading

### 1. App Launch Flow
```
app_launched
├─ loading_started (timestamp)
├─ loading_finished (duration_ms, success)
└─ loading_abandoned (duration_ms, last_step) - if user backgrounds app during loading
```

**Properties:**
- `loading_started`: `timestamp` - when loading started
- `loading_finished`: `duration_ms`, `success` (boolean)
- `loading_abandoned`: `duration_ms`, `last_step` - which step user was on when they backgrounded
  - Possible last_step values: `init`, `loading_cache`, `init_appsflyer`, `get_device_id`, etc.

### 2. Onboarding Flow
```
onboarding_screen_viewed
├─ onboarding_dive_in_clicked
└─ onboarding_completed
```

## Subscription Flow

### 3. Subscription Screen
```
subscription_screen_viewed (source)
├─ subscription_screen_closed (method, duration_seconds)
├─ free_trial_toggled (enabled)
├─ start_free_trial_clicked (has_free_trial, price)
├─ subscription_purchased (plan, price, had_free_trial)
├─ subscription_purchase_failed (error)
└─ subscription_restored
```

**Properties:**
- `subscription_screen_viewed`: 
  - `source`: `'onboarding'` | `'profile'` | `'no_credits'` | `'banner'` | `'other'`
  
- `subscription_screen_closed`:
  - `method`: `'x_button'` | `'back_button'` | `'backdrop'`
  - `duration_seconds`: how long user was on screen
  
- `free_trial_toggled`:
  - `enabled`: boolean
  
- `start_free_trial_clicked`:
  - `has_free_trial`: boolean
  - `price`: string (e.g., "$7.79")
  
- `subscription_purchased`:
  - `plan`: string (package identifier)
  - `price`: string
  - `had_free_trial`: boolean
  
- `subscription_purchase_failed`:
  - `error`: string

## Photo & Generation Flow

### 4. Photo Upload
```
photo_uploaded (source)
```
**Properties:**
- `source`: `'camera'` | `'gallery'`

### 5. Style Selection
```
style_selected (style_key, category)
category_filtered (category)
custom_prompt_used (prompt_length)
```

### 6. Generation Process
```
generation_started (style_key, has_credits)
├─ generation_completed (style_key, duration_seconds)
└─ generation_failed (style_key, error, error_type, ...)
```

**Properties:**
- `generation_started`:
  - `style_key`: string
  - `has_credits`: boolean
  
- `generation_completed`:
  - `style_key`: string
  - `duration_seconds`: number
  
- `generation_failed`:
  - `style_key`: string
  - `error`: string
  - `error_type`: `'no_credits'` | `'content_violation'` | `'network_error'` | `'timeout'` | `'unknown'`
  - Additional boolean flags: `noCredits`, `contentViolation`, `networkError`, `timeout`

## Photo Actions

### 7. Result Actions
```
photo_downloaded (style_key)
photo_shared (style_key)
photo_deleted (style_key)
photo_edited (style_key)
```

## Credits & Monetization

### 8. Credits
```
credits_depleted_banner_shown
upgrade_now_clicked (source)
```
**Properties:**
- `upgrade_now_clicked`:
  - `source`: `'banner'` | `'profile'` | `'generation'`

### 9. No Credits Modal
```
no_credits_modal_shown (has_already_rated, source, options_available)
├─ no_credits_modal_closed (action, has_already_rated)
├─ no_credits_rate_us_clicked
└─ no_credits_subscribe_clicked (has_already_rated, user_type)
```

**Properties:**
- `no_credits_modal_shown`:
  - `has_already_rated`: boolean
  - `source`: `'create_button'` | `'upload'` | `'generation'`
  - `options_available`: `'subscribe_only'` | `'rate_and_subscribe'`

## Rating & Feedback

### 10. Rate Us Flow
```
rate_us_modal_shown (generation_count)
├─ star_rating_selected (stars, will_open_play_store, rating_category)
├─ credits_awarded_for_rating (stars, credits_awarded)
└─ rate_us_modal_closed (did_rate)
```

**Properties:**
- `star_rating_selected`:
  - `stars`: number (1-5)
  - `will_open_play_store`: boolean
  - `rating_category`: `'positive'` (4-5 stars) | `'negative'` (1-3 stars)

### 11. Feedback
```
feedback_requested (source)
feedback_submitted (feedback, source)
```

## Navigation & Profile

### 12. Screen Views
```
screen_viewed (screen_name)
profile_viewed
```

### 13. Profile Actions
```
email_set
```

## Event Flow Example

### Ideal First-Time User Journey:
```
1. app_launched
2. loading_started (timestamp: 1234567890)
3. loading_finished (duration_ms: 3000, success: true)
4. onboarding_screen_viewed
5. onboarding_dive_in_clicked
6. onboarding_completed
7. subscription_screen_viewed (source: 'onboarding')
8. free_trial_toggled (enabled: true)
9. start_free_trial_clicked (has_free_trial: true, price: "$7.79")
10. subscription_purchased (plan: "weekly", price: "$7.79", had_free_trial: true)
11. photo_uploaded (source: 'gallery')
12. style_selected (style_key: 'business', category: 'professional')
13. generation_started (style_key: 'business', has_credits: true)
14. generation_completed (style_key: 'business', duration_seconds: 25)
15. photo_downloaded (style_key: 'business')
```

### Abandoned During Loading:
```
1. app_launched
2. loading_started (timestamp: 1234567890)
3. loading_abandoned (duration_ms: 5000, last_step: 'init_appsflyer')
```

### Subscription Screen Closed:
```
1. subscription_screen_viewed (source: 'onboarding')
2. free_trial_toggled (enabled: false)
3. subscription_screen_closed (method: 'x_button', duration_seconds: 12)
```

## Tracking User Drop-off Points

With this tracking, you can now analyze:

1. **Loading Abandonment Rate**: How many users background the app during loading?
2. **Loading Duration**: Average time to finish loading
3. **Onboarding Completion**: % of users who click "Dive in"
4. **Subscription Conversion**: % of users who see subscription screen vs. subscribe
5. **Subscription Engagement**: How long users spend on subscription screen
6. **Free Trial Toggle**: How many users toggle free trial on/off
7. **Purchase Success Rate**: % of start_free_trial_clicked that result in subscription_purchased
