import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, SavedItem, SwipeRecord } from '../types/index';

const STORAGE_KEYS = {
  USER_PROFILE: 'styleswipe:user_profile',
  SWIPE_HISTORY: 'styleswipe:swipe_history',
  SAVED_ITEMS: 'styleswipe:saved_items',
  PRODUCT_CACHE: 'styleswipe:product_cache',
};

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return null;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Failed to save user profile:', error);
  }
}

export async function getSwipeHistory(): Promise<SwipeRecord[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SWIPE_HISTORY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get swipe history:', error);
    return [];
  }
}

export async function saveSwipeHistory(history: SwipeRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SWIPE_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save swipe history:', error);
  }
}

export async function getSavedItems(): Promise<SavedItem[]> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_ITEMS);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to get saved items:', error);
    return [];
  }
}

export async function saveSavedItems(items: SavedItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SAVED_ITEMS, JSON.stringify(items));
  } catch (error) {
    console.error('Failed to save items:', error);
  }
}

export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.SWIPE_HISTORY,
      STORAGE_KEYS.SAVED_ITEMS,
      STORAGE_KEYS.PRODUCT_CACHE,
    ]);
  } catch (error) {
    console.error('Failed to clear data:', error);
  }
}
