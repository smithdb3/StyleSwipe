import { ShopifyProduct } from '../types/index';
import { TAG_DIMENSIONS } from './taxonomy';

/**
 * Extract and normalize tags from a ShopifyProduct into our taxonomy
 */
export function extractTags(product: ShopifyProduct): string[] {
  const tags = new Set<string>();

  // Add explicit tags from product
  if (product.tags && Array.isArray(product.tags)) {
    product.tags.forEach(tag => {
      const normalized = normalizeTag(tag);
      if (normalized) tags.add(normalized);
    });
  }

  // Add category if present
  if (product.category) {
    const normalizedCategory = normalizeTag(product.category);
    if (normalizedCategory) tags.add(normalizedCategory);
  }

  // Add colors if present
  if (product.colors && Array.isArray(product.colors)) {
    product.colors.forEach(color => {
      const normalized = normalizeTag(color);
      if (normalized) tags.add(normalized);
    });
  }

  // Add materials if present
  if (product.materials && Array.isArray(product.materials)) {
    product.materials.forEach(material => {
      const normalized = normalizeTag(material);
      if (normalized) tags.add(normalized);
    });
  }

  // Add occasion if present
  if (product.occasion) {
    const normalized = normalizeTag(product.occasion);
    if (normalized) tags.add(normalized);
  }

  // Extract tags from title
  const titleTags = extractFromTitle(product.title);
  titleTags.forEach(tag => tags.add(tag));

  return Array.from(tags);
}

/**
 * Normalize a tag string to match our taxonomy
 */
function normalizeTag(tag: string): string | null {
  const lower = tag.toLowerCase().trim();

  // Check against all taxonomy values
  for (const dimension of Object.values(TAG_DIMENSIONS)) {
    if (dimension.values.includes(lower)) {
      return lower;
    }
  }

  // Try fuzzy matching for common variations
  const fuzzyMap: Record<string, string> = {
    'black': 'black',
    'white': 'white',
    'dark': 'black',
    'light': 'white',
    'grey': 'grey',
    'gray': 'grey',
    'navy': 'navy',
    'navy blue': 'navy',
    'red': 'red',
    'blue': 'blue',
    'green': 'green',
    'pink': 'pink',
    'purple': 'purple',
    'yellow': 'yellow',
    'orange': 'orange',
    'brown': 'brown',
    'beige': 'beige',
    'cream': 'beige',
    'neutral': 'neutral',
    'colorful': 'colorful',
    'casual': 'casual',
    'formal': 'formal',
    'minimalist': 'minimalist',
    'minimal': 'minimalist',
    'street': 'streetwear',
    'streetwear': 'streetwear',
    'cottage': 'cottagecore',
    'cottagecore': 'cottagecore',
    'boho': 'bohemian',
    'bohemian': 'bohemian',
    'preppy': 'preppy',
    'prep': 'preppy',
    'vintage': 'vintage',
    'edgy': 'edgy',
    'sporty': 'sporty',
    'sport': 'sporty',
    'romantic': 'romantic',
    'romance': 'romantic',
    'avant': 'avant-garde',
    'classic': 'classic',
    'top': 'tops',
    'tops': 'tops',
    'dress': 'dresses',
    'dresses': 'dresses',
    'bottom': 'bottoms',
    'bottoms': 'bottoms',
    'pant': 'bottoms',
    'pants': 'bottoms',
    'skirt': 'bottoms',
    'coat': 'outerwear',
    'jacket': 'outerwear',
    'outerwear': 'outerwear',
    'shoe': 'shoes',
    'shoes': 'shoes',
    'boot': 'shoes',
    'sneaker': 'shoes',
    'accessory': 'accessories',
    'accessories': 'accessories',
    'active': 'activewear',
    'activewear': 'activewear',
    'gym': 'activewear',
    'underwear': 'underwear',
    'cotton': 'cotton',
    'linen': 'linen',
    'wool': 'wool',
    'silk': 'silk',
    'polyester': 'polyester',
    'denim': 'denim',
    'leather': 'leather',
    'suede': 'suede',
    'knit': 'knit',
    'jersey': 'jersey',
  };

  return fuzzyMap[lower] || null;
}

/**
 * Extract style/category tags from product title
 */
function extractFromTitle(title: string): string[] {
  const tags: string[] = [];
  const lower = title.toLowerCase();

  // Check for style keywords in title
  const styleKeywords: Record<string, string> = {
    'minimalist': 'minimalist',
    'streetwear': 'streetwear',
    'boho': 'bohemian',
    'vintage': 'vintage',
    'edgy': 'edgy',
    'preppy': 'preppy',
    'casual': 'casual',
    'formal': 'formal',
    'classic': 'classic',
  };

  for (const [keyword, tag] of Object.entries(styleKeywords)) {
    if (lower.includes(keyword)) {
      tags.push(tag);
    }
  }

  return tags;
}
