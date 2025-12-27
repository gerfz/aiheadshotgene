# Subscription Tiers Setup Guide

## ✅ Code Changes Complete

The app has been updated to support the new subscription structure:
- **Weekly** subscription
- **Monthly** subscription  
- **Yearly** subscription (Best Value)
- **3-day free trial** for all plans

## 📋 Setup Steps

### 1. Google Play Console Setup

#### A. Create Subscription Products

Go to **Google Play Console → Your App → Monetize → Subscriptions** and create:

1. **Weekly Pro Subscription**
   - Product ID: `weekly_pro`
   - Billing period: 1 week
   - Free trial: 3 days
   - Price: Set your weekly price (e.g., $2.99)
   - Grace period: 3 days (recommended)
   - Base plan ID: `weekly-standard`

2. **Monthly Pro Subscription**
   - Product ID: `monthly_pro`
   - Billing period: 1 month
   - Free trial: 3 days
   - Price: Set your monthly price (e.g., $9.99)
   - Grace period: 3 days (recommended)
   - Base plan ID: `monthly-standard`

3. **Yearly Pro Subscription**
   - Product ID: `yearly_pro`
   - Billing period: 1 year
   - Free trial: 3 days
   - Price: Set your yearly price (e.g., $39.99 - 60% savings)
   - Grace period: 3 days (recommended)
   - Base plan ID: `yearly-standard`

#### B. Activate Products
- Make sure all products are **Active**
- Add countries/regions where they should be available
- Set up pricing for each region

### 2. RevenueCat Dashboard Setup

#### A. Import Products from Google Play

1. Go to **RevenueCat Dashboard → Your Project → Products**
2. Click **Import from Google Play**
3. Select all three products:
   - `weekly_pro`
   - `monthly_pro`
   - `yearly_pro`
4. Click **Import**

#### B. Create/Update Offering

1. Go to **Offerings** in RevenueCat
2. Edit your "Current" offering (or create a new one)
3. Add packages:
   - **Weekly Package**: 
     - Identifier: `$rc_weekly`
     - Product: `weekly_pro`
   - **Monthly Package**: 
     - Identifier: `$rc_monthly`
     - Product: `monthly_pro`
   - **Annual Package**: 
     - Identifier: `$rc_annual`
     - Product: `yearly_pro`
4. Set this offering as **Current**

#### C. Configure Entitlements

1. Go to **Entitlements** in RevenueCat
2. Make sure you have a `pro` entitlement
3. Attach all three products to the `pro` entitlement:
   - `weekly_pro` → `pro`
   - `monthly_pro` → `pro`
   - `yearly_pro` → `pro`

### 3. Remove Old Lifetime Subscription

#### In Google Play Console:
1. Go to the `lifetime_pro` product (if it exists)
2. Set status to **Inactive**
3. Don't delete it (to preserve purchase history)

#### In RevenueCat:
1. Remove `lifetime_pro` from your current offering
2. Keep the product in RevenueCat (for existing subscribers)

### 4. Testing

#### A. Test with Google Play Internal Testing

1. Add your Google account to **Internal Testing** track
2. Install the app from the internal testing link
3. Try subscribing to each tier
4. Verify the 3-day trial appears
5. Cancel before trial ends to avoid charges

#### B. Test Trial Cancellation

1. Subscribe to a plan
2. Go to **Google Play → Subscriptions**
3. Cancel the subscription
4. Verify it says "Active until [trial end date]"

### 5. App Display

The subscription screen now shows:

```
🎉 Start with a 3-day free trial

┌─────────────────────────────┐
│ ⭐ BEST VALUE               │
│ Yearly                      │
│ Best value - Save 60%       │
│ $39.99/year                 │
│ • Unlimited AI portraits    │
│ • All styles included       │
│ • Priority processing       │
│ • No watermarks             │
│ [Get Started]               │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Monthly                     │
│ Most popular                │
│ $9.99/month                 │
│ [Subscribe]                 │
└─────────────────────────────┘

┌─────────────────────────────┐
│ 🚀 Quick Start              │
│ Weekly                      │
│ Try it out                  │
│ $2.99/week                  │
│ [Subscribe]                 │
└─────────────────────────────┘
```

### 6. Important Notes

- **Trial Period**: All subscriptions include a 3-day free trial
- **Cancellation**: Users can cancel anytime during the trial without being charged
- **Auto-Renewal**: After trial, subscriptions auto-renew unless cancelled
- **Grace Period**: 3-day grace period if payment fails (recommended)
- **Existing Subscribers**: Users with the old lifetime subscription will keep their access

### 7. Pricing Recommendations

Based on typical AI app pricing:

- **Weekly**: $2.99 - $4.99 (good for users who want to try short-term)
- **Monthly**: $9.99 - $14.99 (most common choice)
- **Yearly**: $39.99 - $59.99 (60-70% savings compared to monthly)

### 8. Marketing the Trial

Update your app description and screenshots to highlight:
- "Start with 3 days FREE"
- "Cancel anytime - no commitment"
- "Try all features risk-free"

## 🔧 Technical Details

### Package Identifiers (in code):
```typescript
PACKAGE_IDS = {
  WEEKLY: '$rc_weekly',
  MONTHLY: '$rc_monthly',
  ANNUAL: '$rc_annual',
}
```

### Product IDs (in Google Play):
- `weekly_pro`
- `monthly_pro`
- `yearly_pro`

### Entitlement:
- `pro` (grants unlimited access)

## ✅ Checklist

- [ ] Create 3 subscription products in Google Play Console
- [ ] Set 3-day free trial for all products
- [ ] Import products to RevenueCat
- [ ] Create/update offering with 3 packages
- [ ] Attach all products to `pro` entitlement
- [ ] Set offering as "Current"
- [ ] Deactivate old `lifetime_pro` product
- [ ] Test subscriptions with internal testing
- [ ] Test trial cancellation
- [ ] Update app screenshots/description to mention trial
- [ ] Build and upload new APK with updated code

## 📱 User Experience

1. User taps "Upgrade to Pro"
2. Sees "🎉 Start with a 3-day free trial" banner
3. Chooses a plan (Weekly/Monthly/Yearly)
4. Google Play shows: "3 days free, then $X.XX per [period]"
5. User confirms
6. Gets immediate access to all pro features
7. Can cancel anytime in first 3 days without charge
8. After 3 days, first payment is charged

Perfect for user acquisition! 🚀

