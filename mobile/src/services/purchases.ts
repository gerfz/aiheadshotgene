import Purchases, { 
  CustomerInfo, 
  PurchasesOfferings,
  PurchasesPackage,
  LOG_LEVEL 
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys
const REVENUECAT_API_KEY = 'goog_pRdUmhCVrwRHxsVlgpxTHlaZKHi';
const REVENUECAT_APP_USER_ID = 'app34a2bf623c'; // Your RevenueCat app ID

// Product identifiers (must match Google Play Console)
export const PRODUCT_IDS = {
  WEEKLY: 'weekly_pro',
  MONTHLY: 'monthly_pro',
  YEARLY: 'yearly_pro',
};

// Entitlement identifier (must match RevenueCat dashboard)
export const ENTITLEMENT_ID = 'pro';

// Package identifiers (must match RevenueCat offering)
export const PACKAGE_IDS = {
  WEEKLY: '$rc_weekly',
  MONTHLY: '$rc_monthly',
  ANNUAL: '$rc_annual',
};

/**
 * Initialize RevenueCat SDK
 */
export async function initializePurchases(userId?: string) {
  try {
    if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      
      // Enable debug logs in development with custom handler to avoid errors
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
        // Set custom log handler to prevent "customLogHandler is not a function" error
        try {
          Purchases.setLogHandler((logLevel: string, message: string) => {
            // Only log errors and warnings in console
            if (logLevel === 'ERROR' || logLevel === 'WARN') {
              console.log(`[RevenueCat] ${logLevel}: ${message}`);
            }
          });
        } catch (e) {
          // Ignore if setLogHandler is not available
        }
      }
      
      // Login user if provided
      if (userId) {
        await Purchases.logIn(userId);
      }
      
      console.log('✅ RevenueCat initialized successfully');
    }
  } catch (error) {
    console.error('❌ Failed to initialize RevenueCat:', error);
  }
}

/**
 * Log in user to RevenueCat
 */
export async function loginUser(userId: string): Promise<CustomerInfo | null> {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('✅ User logged in to RevenueCat:', userId);
    return customerInfo;
  } catch (error) {
    console.error('❌ Failed to login user to RevenueCat:', error);
    return null;
  }
}

/**
 * Log out user from RevenueCat
 */
export async function logoutUser() {
  try {
    await Purchases.logOut();
    console.log('✅ User logged out from RevenueCat');
  } catch (error) {
    console.error('❌ Failed to logout user from RevenueCat:', error);
  }
}

/**
 * Get available offerings/packages
 */
export async function getOfferings(): Promise<PurchasesPackage[]> {
  try {
    const offerings: PurchasesOfferings = await Purchases.getOfferings();
    
    console.log('📦 RevenueCat Offerings Response:', {
      current: offerings.current?.identifier,
      all: Object.keys(offerings.all),
      packagesCount: offerings.current?.availablePackages.length || 0
    });
    
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      console.log('✅ Available packages:', offerings.current.availablePackages.map(p => ({
        identifier: p.identifier,
        product: p.product.identifier,
        price: p.product.priceString
      })));
      return offerings.current.availablePackages;
    }
    
    console.warn('⚠️ No offerings available. Make sure you:');
    console.warn('1. Created products in Google Play Console');
    console.warn('2. Synced products to RevenueCat');
    console.warn('3. Created an offering in RevenueCat dashboard');
    console.warn('4. Set the offering as "Current"');
    return [];
  } catch (error) {
    console.error('❌ Failed to get offerings:', error);
    return [];
  }
}

/**
 * Purchase a package
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  try {
    console.log('🛒 Attempting purchase:', pkg.identifier);
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    
    console.log('✅ Purchase successful!');
    console.log('📦 Purchased products:', customerInfo.allPurchasedProductIdentifiers);
    console.log('🎫 Active entitlements:', Object.keys(customerInfo.entitlements.active));
    console.log('📱 Active subscriptions:', customerInfo.activeSubscriptions);
    
    return customerInfo;
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('ℹ️ User cancelled purchase');
    } else {
      console.error('❌ Purchase failed:', error);
    }
    return null;
  }
}

/**
 * Check if user has pro subscription
 */
export async function checkProStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    
    // Log full customer info for debugging
    console.log('📊 Customer Info:', {
      entitlements: Object.keys(customerInfo.entitlements.active),
      allPurchases: customerInfo.allPurchasedProductIdentifiers,
      activeSubscriptions: customerInfo.activeSubscriptions,
    });
    
    // Check if user has the 'pro' entitlement
    const hasProAccess = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    
    // Also check if user has any active subscriptions (for sandbox testing)
    const hasAnySubscription = customerInfo.activeSubscriptions.length > 0;
    
    const isPro = hasProAccess || hasAnySubscription;
    console.log('Pro status:', isPro, '(Entitlement:', hasProAccess, ', Active subs:', hasAnySubscription, ')');
    
    return isPro;
  } catch (error) {
    console.error('❌ Failed to check pro status:', error);
    return false;
  }
}

/**
 * Get customer info
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('❌ Failed to get customer info:', error);
    return null;
  }
}

/**
 * Restore purchases
 */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  try {
    const customerInfo = await Purchases.restorePurchases();
    console.log('✅ Purchases restored');
    return customerInfo;
  } catch (error) {
    console.error('❌ Failed to restore purchases:', error);
    return null;
  }
}

/**
 * Add listener for customer info updates
 */
export function addCustomerInfoListener(
  callback: (customerInfo: CustomerInfo) => void
) {
  return Purchases.addCustomerInfoUpdateListener(callback);
}

/**
 * Format price for display
 */
export function formatPrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString;
}

/**
 * Get package by identifier
 */
export function getPackageByIdentifier(
  packages: PurchasesPackage[],
  identifier: string
): PurchasesPackage | undefined {
  return packages.find(pkg => pkg.identifier === identifier);
}

/**
 * Sync subscription status with backend
 * This should be called on app startup to ensure Supabase matches RevenueCat
 */
export async function syncSubscriptionStatus(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    
    // Check if user has active subscription
    const hasProAccess = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    const hasAnySubscription = customerInfo.activeSubscriptions.length > 0;
    const isSubscribed = hasProAccess || hasAnySubscription;
    
    console.log('🔄 Syncing subscription status:', isSubscribed);
    
    return isSubscribed;
  } catch (error) {
    console.error('❌ Failed to sync subscription status:', error);
    return false;
  }
}
