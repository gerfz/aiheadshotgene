import { useState, useEffect, useCallback } from 'react';
import {
  getOfferings,
  purchasePackage,
  checkProStatus,
  restorePurchases,
  addCustomerInfoListener,
  ENTITLEMENT_ID,
  PurchasesPackage,
} from '../services/purchases';
import { useAppStore } from '../store/useAppStore';

export function useSubscription() {
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { credits, setCredits } = useAppStore();

  // Load available packages
  useEffect(() => {
    const loadPackages = async () => {
      setIsLoading(true);
      try {
        const availablePackages = await getOfferings();
        setPackages(availablePackages);
      } catch (err) {
        console.error('Failed to load packages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPackages();
  }, []);

  // Listen for subscription status changes
  useEffect(() => {
    const listener = addCustomerInfoListener((customerInfo) => {
      if (!customerInfo) return;
      
      const isSubscribed = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
      
      if (credits) {
        setCredits({
          ...credits,
          isSubscribed,
          hasCredits: isSubscribed || credits.totalCredits > 0,
        });
      }
    });

    return () => {
      listener.remove();
    };
  }, [credits]);

  // Purchase a package
  const purchase = useCallback(async (pkg: PurchasesPackage) => {
    setIsPurchasing(true);
    setError(null);

    try {
      const customerInfo = await purchasePackage(pkg);
      
      if (customerInfo) {
        const isSubscribed = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        
        if (credits) {
          setCredits({
            ...credits,
            isSubscribed,
            hasCredits: true,
          });
        }
      }

      return true;
    } catch (err: any) {
      setError(err.message || 'Purchase failed');
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [credits, setCredits]);

  // Restore purchases
  const restore = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const customerInfo = await restorePurchases();
      
      if (customerInfo) {
        const isSubscribed = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
        
        if (credits) {
          setCredits({
            ...credits,
            isSubscribed,
            hasCredits: isSubscribed || credits.totalCredits > 0,
          });
        }

        return isSubscribed;
      }
      
      return false;
    } catch (err: any) {
      setError(err.message || 'Restore failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [credits, setCredits]);

  // Check current status
  const checkStatus = useCallback(async () => {
    try {
      return await checkProStatus();
    } catch {
      return false;
    }
  }, []);

  // Get monthly and yearly packages
  const monthlyPackage = packages.find(
    p => p.packageType === 'MONTHLY' || p.identifier.includes('monthly')
  );
  const yearlyPackage = packages.find(
    p => p.packageType === 'ANNUAL' || p.identifier.includes('yearly')
  );

  return {
    packages,
    monthlyPackage,
    yearlyPackage,
    isLoading,
    isPurchasing,
    error,
    purchase,
    restore,
    checkStatus,
    isSubscribed: credits?.isSubscribed || false,
  };
}
