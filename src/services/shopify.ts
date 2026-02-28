import { ShopifyProduct, ShopifyAuthToken } from '../types/index';
import { mockProducts } from '../mocks/products';

const SHOPIFY_CLIENT_ID = process.env.EXPO_PUBLIC_SHOPIFY_CLIENT_ID;
const SHOPIFY_CLIENT_SECRET = process.env.EXPO_PUBLIC_SHOPIFY_CLIENT_SECRET;
const SHOPIFY_API_URL = process.env.EXPO_PUBLIC_SHOPIFY_API_URL || 'https://api.shopify.com/v1';
const USE_MOCK_DATA = process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';

let cachedToken: ShopifyAuthToken | null = null;

/**
 * Get or refresh the Shopify API token
 */
async function getToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.accessToken;
  }

  // If no credentials or using mock data, return empty token
  if (!SHOPIFY_CLIENT_ID || !SHOPIFY_CLIENT_SECRET) {
    console.warn('Shopify credentials not configured, using mock data');
    return '';
  }

  try {
    const response = await fetch(`${SHOPIFY_API_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    const data = await response.json();

    cachedToken = {
      accessToken: data.access_token,
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };

    return cachedToken.accessToken;
  } catch (error) {
    console.error('Failed to get Shopify token:', error);
    return '';
  }
}

export interface FetchProductsOptions {
  categories?: string[];
  tags?: string[];
  limit?: number;
  offset?: number;
}

/**
 * Fetch products from Shopify API with mock fallback
 */
export async function fetchProducts(options: FetchProductsOptions): Promise<ShopifyProduct[]> {
  // Use mock data if configured
  if (USE_MOCK_DATA) {
    return shuffleArray(mockProducts).slice(0, options.limit || 20);
  }

  try {
    const token = await getToken();

    // If no token, use mock
    if (!token) {
      return shuffleArray(mockProducts).slice(0, options.limit || 20);
    }

    const params = new URLSearchParams();

    if (options.categories && options.categories.length > 0) {
      params.append('category', options.categories.join(','));
    }

    if (options.tags && options.tags.length > 0) {
      params.append('tags', options.tags.join(','));
    }

    params.append('limit', String(options.limit || 20));

    const url = `${SHOPIFY_API_URL}/products/search?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Products request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Failed to fetch products from Shopify, using mock data:', error);
    // Fallback to mock data on any error
    return shuffleArray(mockProducts).slice(0, options.limit || 20);
  }
}

/**
 * Shuffle array in place for randomization
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
