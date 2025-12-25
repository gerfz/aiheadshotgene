import Purchases, { 
  CustomerInfo, 
  PurchasesOfferings,
  PurchasesPackage,
  LOG_LEVEL 
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys
const REVENUECAT_API_KEY = 'goog_pRdUmhCVrwRHxsVlgpxTHlaZKHi';

// Product identifiers (must match Google Play Console)
export const PRODUCT_IDS = {
  MONTHLY: 'monthly_pro',
  YEARLY: 'yearly_pro',
  LIFETIME: 'lifetime_pro',
};

// Entitlement identifier (must match RevenueCat dashboard)
export const ENTITLEMENT_ID = 'pro';

// Package identifiers (must match RevenueCat offering)
export const PACKAGE_IDS = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
  LIFETIME: 'lifetime',
};

/**
 * Initialize RevenueCat SDK
 */
export async function initializePurchases(userId?: string) {
  try {
    if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: REVENUECAT_API_KEY });
      
      // Enable debug logs in development
      if (__DEV__) {
        Purchases.setLogLevel(LOG_LEVEL.DEBUG);
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
    
    if (offerings.current && offerings.current.availablePackages.length > 0) {
      console.log('✅ Available packages:', offerings.current.availablePackages.length);
      return offerings.current.availablePackages;
    }
    
    console.warn('⚠️ No offerings available');
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
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    console.log('✅ Purchase successful');
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
    const hasProAccess = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    console.log('Pro status:', hasProAccess);
    return hasProAccess;
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
