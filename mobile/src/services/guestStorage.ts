import * as SecureStore from 'expo-secure-store';

const GUEST_ID_KEY = 'guest_device_id';

/**
 * Generate a UUID v4 without external dependencies
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Get existing guest ID or create a new one
 * This ID persists across app updates but is deleted on uninstall
 */
export async function getOrCreateGuestId(): Promise<string> {
  try {
    let guestId = await SecureStore.getItemAsync(GUEST_ID_KEY);
    
    if (!guestId) {
      guestId = generateUUID();
      await SecureStore.setItemAsync(GUEST_ID_KEY, guestId);
    }
    
    return guestId;
  } catch (error) {
    console.error('Error accessing SecureStore:', error);
    // Fallback to a session-only ID if SecureStore fails
    return generateUUID();
  }
}

/**
 * Get existing guest ID without creating one
 */
export async function getGuestId(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(GUEST_ID_KEY);
  } catch (error) {
    console.error('Error reading guest ID:', error);
    return null;
  }
}

/**
 * Clear the guest ID (called after successful migration to user account)
 */
export async function clearGuestId(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(GUEST_ID_KEY);
  } catch (error) {
    console.error('Error clearing guest ID:', error);
  }
}

/**
 * Check if a guest ID exists
 */
export async function hasGuestId(): Promise<boolean> {
  const guestId = await getGuestId();
  return guestId !== null;
}

