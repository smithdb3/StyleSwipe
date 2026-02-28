import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserProfile,
  SwipeRecord,
  SavedItem,
  ShopifyProduct,
  StoreState,
} from '../types/index';
import {
  updateProfileOnSwipe,
  initializeTagScoresFromOnboarding,
  rankFeed,
} from '../engine/styleEngine';
import { fetchProducts } from '../services/shopify';

const STORAGE_KEYS = {
  USER_PROFILE: 'styleswipe:user_profile',
  SWIPE_HISTORY: 'styleswipe:swipe_history',
  SAVED_ITEMS: 'styleswipe:saved_items',
};

const DEBOUNCE_DELAY = 500;

// Debounce helpers
let profileSaveTimeout: NodeJS.Timeout | null = null;
let savedItemsSaveTimeout: NodeJS.Timeout | null = null;
let swipeHistorySaveTimeout: NodeJS.Timeout | null = null;

function debounceProfileSave(profile: UserProfile) {
  if (profileSaveTimeout) clearTimeout(profileSaveTimeout);
  profileSaveTimeout = setTimeout(() => {
    AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile)).catch(
      console.error
    );
  }, DEBOUNCE_DELAY);
}

function debounceSavedItemsSave(items: SavedItem[]) {
  if (savedItemsSaveTimeout) clearTimeout(savedItemsSaveTimeout);
  savedItemsSaveTimeout = setTimeout(() => {
    AsyncStorage.setItem(STORAGE_KEYS.SAVED_ITEMS, JSON.stringify(items)).catch(console.error);
  }, DEBOUNCE_DELAY);
}

function debounceSwipeHistorySave(history: SwipeRecord[]) {
  if (swipeHistorySaveTimeout) clearTimeout(swipeHistorySaveTimeout);
  swipeHistorySaveTimeout = setTimeout(() => {
    AsyncStorage.setItem(STORAGE_KEYS.SWIPE_HISTORY, JSON.stringify(history)).catch(
      console.error
    );
  }, DEBOUNCE_DELAY);
}

export const useStore = create<StoreState>((set, get) => ({
  // Profile state
  profile: null,

  loadProfile: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (stored) {
        set({ profile: JSON.parse(stored) });
      } else {
        // Create new profile
        const newProfile: UserProfile = {
          id: uuidv4(),
          hasOnboarded: false,
          tagScores: {},
          preferredCategories: [],
          preferredColors: [],
          preferredStyles: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({ profile: newProfile });
        debounceProfileSave(newProfile);
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  },

  updateProfileOnSwipe: async (productId: string, direction: 'like' | 'skip', tags: string[]) => {
    const currentProfile = get().profile;
    if (!currentProfile) return;

    const updated = updateProfileOnSwipe(currentProfile, direction, tags);
    set({ profile: updated });
    debounceProfileSave(updated);

    // Record swipe
    get().recordSwipe(productId, direction, tags);
  },

  setOnboardingPreferences: async (styles: string[], colors: string[], categories: string[]) => {
    const currentProfile = get().profile;
    if (!currentProfile) return;

    const tagScores = initializeTagScoresFromOnboarding(styles, colors, categories);

    const updated: UserProfile = {
      ...currentProfile,
      tagScores,
      preferredStyles: styles,
      preferredColors: colors,
      preferredCategories: categories,
      updatedAt: new Date().toISOString(),
    };

    set({ profile: updated });
    debounceProfileSave(updated);
  },

  completeOnboarding: async () => {
    const currentProfile = get().profile;
    if (!currentProfile) return;

    const updated: UserProfile = {
      ...currentProfile,
      hasOnboarded: true,
      updatedAt: new Date().toISOString(),
    };

    set({ profile: updated });
    debounceProfileSave(updated);

    // Load initial feed
    get().loadFeed(true);
  },

  // Feed state
  swipeQueue: [],
  swipeHistory: [],
  isLoadingFeed: false,

  loadFeed: async (force = false) => {
    const state = get();

    // Don't load if already loading and not forced
    if (state.isLoadingFeed && !force) return;

    // Don't reload if queue still has items (unless forced)
    if (state.swipeQueue.length >= 3 && !force) return;

    set({ isLoadingFeed: true });

    try {
      const profile = state.profile;
      if (!profile) return;

      // Fetch new products
      const newProducts = await fetchProducts({
        categories: profile.preferredCategories,
        tags: profile.preferredStyles,
        limit: 20,
      });

      if (newProducts.length === 0) {
        console.warn('No products returned from API');
        set({ isLoadingFeed: false });
        return;
      }

      // Rank by user preferences
      const swipeCount = state.swipeHistory.length;
      const rankedProducts = rankFeed(profile, newProducts, swipeCount);

      // Add to queue
      const currentQueue = state.swipeQueue;
      const updatedQueue = [...currentQueue, ...rankedProducts].slice(0, 50); // Keep max 50 in queue

      set({ swipeQueue: updatedQueue, isLoadingFeed: false });
    } catch (error) {
      console.error('Failed to load feed:', error);
      set({ isLoadingFeed: false });
    }
  },

  recordSwipe: async (productId: string, direction: 'like' | 'skip', tags: string[]) => {
    const newRecord: SwipeRecord = {
      productId,
      direction,
      tagsAtTimeOfSwipe: tags,
      timestamp: new Date().toISOString(),
    };

    const history = [...get().swipeHistory, newRecord];
    set({ swipeHistory: history });
    debounceSwipeHistorySave(history);

    // Save to AsyncStorage manually if user liked item
    if (direction === 'like') {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_ITEMS);
        const savedItems: SavedItem[] = stored ? JSON.parse(stored) : [];
        // Note: We would need the full product object here, but we only have the ID
        // This will be handled in the saveItem function instead
      } catch (error) {
        console.error('Failed to record swipe:', error);
      }
    }

    // Check if we need to reload feed
    if (get().swipeQueue.length < 3) {
      get().loadFeed();
    } else {
      // Remove the card we just swiped from the queue
      const queue = get().swipeQueue;
      set({ swipeQueue: queue.slice(1) });
    }
  },

  // Saved items state
  savedItems: [],

  loadSavedItems: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_ITEMS);
      if (stored) {
        set({ savedItems: JSON.parse(stored) });
      }
    } catch (error) {
      console.error('Failed to load saved items:', error);
    }
  },

  saveItem: async (product: ShopifyProduct) => {
    const savedItem: SavedItem = {
      productId: product.id,
      title: product.title,
      brand: product.brand,
      price: product.price,
      imageUrl: product.image,
      buyUrl: product.url,
      tags: product.tags,
      savedAt: new Date().toISOString(),
    };

    const currentItems = get().savedItems;
    const updated = [...currentItems, savedItem];

    // Avoid duplicates
    const unique = Array.from(
      new Map(updated.map(item => [item.productId, item])).values()
    );

    set({ savedItems: unique });
    debounceSavedItemsSave(unique);
  },

  removeItem: async (productId: string) => {
    const items = get().savedItems.filter(item => item.productId !== productId);
    set({ savedItems: items });
    debounceSavedItemsSave(items);
  },
}));
