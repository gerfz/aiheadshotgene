/**
 * Purchases Service - Mock implementation for Expo Go testing
 * 
 * To enable real purchases:
 * 1. Create a development build (not Expo Go)
 * 2. npm install react-native-purchases
 * 3. Set ENABLE_REVENUECAT = true
 * 4. Add your RevenueCat API keys
 */

// Mock types
export interface PurchasesPackage {
  identifier: string;
  packageType: string;
  product: {
    priceString: string;
  };
}

export interface CustomerInfo {
  entitlements: {
    active: Record<string, any>;
  };
}

// Product identifiers
export const PRODUCT_IDS = {
  MONTHLY: 'pro_monthly',
  YEARLY: 'pro_yearly',
};

// Entitlement identifier
export const ENTITLEMENT_ID = 'pro';

/**
 * Initialize purchases (mock)
 */
export async function initializePurchases(userId?: string) {
  console.log('Purchases disabled - using mock implementation for Expo Go');
}

/**
 * Log in user (mock)
 */
export async function loginUser(userId: string): Promise<CustomerInfo | null> {
  return null;
}

/**
 * Log out user (mock)
 */
export async function logoutUser() {
  // No-op
}

/**
 * Get available packages (mock)
 */
export async function getOfferings(): Promise<PurchasesPackage[]> {
  return [];
}

/**
 * Purchase a package (mock)
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  return null;
}

/**
 * Check pro status (mock)
 */
export async function checkProStatus(): Promise<boolean> {
  return false;
}

/**
 * Get customer info (mock)
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  return null;
}

/**
 * Restore purchases (mock)
 */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  return null;
}

/**
 * Add listener (mock)
 */
export function addCustomerInfoListener(
  callback: (customerInfo: CustomerInfo) => void
) {
  return { remove: () => {} };
}
