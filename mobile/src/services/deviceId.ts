import * as Application from 'expo-application';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = 'hardware_device_id';

/**
 * Get a unique, persistent device identifier
 * This survives app reinstalls and is tied to the physical device
 */
export async function getHardwareDeviceId(): Promise<string> {
  try {
    // Try to get cached device ID first
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);
    
    if (deviceId) {
      return deviceId;
    }
    
    // Get hardware-based ID
    if (Platform.OS === 'android') {
      // Android ID - unique per device, survives factory reset on Android 8+
      deviceId = Application.getAndroidId();
    } else if (Platform.OS === 'ios') {
      // iOS Vendor ID - unique per device per vendor
      deviceId = await Application.getIosIdForVendorAsync();
    }
    
    if (!deviceId) {
      throw new Error('Could not get device ID');
    }
    
    // Cache it
    await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    
    return deviceId;
  } catch (error) {
    console.error('Error getting hardware device ID:', error);
    // Fallback to installation ID (resets on reinstall)
    const fallbackId = Application.getInstallationIdSync();
    return fallbackId || 'unknown';
  }
}

/**
 * Check if this device has already used a free trial
 * This should be checked against the backend
 */
export async function hasUsedFreeTrial(deviceId: string): Promise<boolean> {
  // This will be implemented in the backend
  // For now, return false
  return false;
}

