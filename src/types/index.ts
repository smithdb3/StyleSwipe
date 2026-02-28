export interface UserProfile {
  id: string;
  hasOnboarded: boolean;
  tagScores: Record<string, number>; // tag → 0.0–1.0 affinity score
  preferredCategories: string[];
  preferredColors: string[];
  preferredStyles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SwipeRecord {
  productId: string;
  direction: 'like' | 'skip';
  tagsAtTimeOfSwipe: string[];
  timestamp: string;
}

export interface SavedItem {
  productId: string;
  title: string;
  brand: string;
  price: string;
  imageUrl: string;
  buyUrl: string;
  tags: string[];
  savedAt: string;
}

export interface ShopifyProduct {
  id: string;
  title: string;
  brand: string;
  price: string;
  image: string;
  images: string[];
  description?: string;
  url: string;
  tags: string[];
  category?: string;
  colors?: string[];
  materials?: string[];
  occasion?: string;
}

export interface ShopifyAuthToken {
  accessToken: string;
  expiresAt: number;
}

export interface TagDimension {
  id: string;
  name: string;
  values: string[];
}

export interface StoreState {
  // Profile slice
  profile: UserProfile | null;
  loadProfile: () => Promise<void>;
  updateProfileOnSwipe: (productId: string, direction: 'like' | 'skip', tags: string[]) => Promise<void>;
  setOnboardingPreferences: (styles: string[], colors: string[], categories: string[]) => Promise<void>;
  completeOnboarding: () => Promise<void>;

  // Feed slice
  swipeQueue: ShopifyProduct[];
  swipeHistory: SwipeRecord[];
  isLoadingFeed: boolean;
  loadFeed: (force?: boolean) => Promise<void>;
  recordSwipe: (productId: string, direction: 'like' | 'skip', tags: string[]) => Promise<void>;

  // Saved items slice
  savedItems: SavedItem[];
  loadSavedItems: () => Promise<void>;
  saveItem: (product: ShopifyProduct) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
}
