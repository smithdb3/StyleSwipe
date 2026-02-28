/**
 * Tag taxonomy from lowLevelDoc §2.1.
 * Single source of truth for style, color, material, occasion, category, fit, pattern.
 */
export const TAXONOMY = {
  style: [
    'minimalist', 'bohemian', 'streetwear', 'classic', 'romantic', 'edgy', 'preppy',
    'sporty', 'vintage', 'modern', 'casual', 'formal', 'artsy', 'glam', 'scandinavian',
    'japanese', 'french', 'american',
  ],
  color: [
    'black', 'white', 'navy', 'gray', 'beige', 'brown', 'red', 'pink', 'blue', 'green',
    'yellow', 'orange', 'purple', 'multicolor', 'neutral', 'pastel', 'earth',
  ],
  material: [
    'cotton', 'denim', 'leather', 'silk', 'wool', 'linen', 'polyester', 'velvet',
    'knit', 'fleece', 'satin', 'corduroy',
  ],
  occasion: [
    'casual', 'formal', 'workout', 'party', 'office', 'weekend', 'travel', 'date',
    'beach', 'outdoor',
  ],
  category: [
    'tops', 'bottoms', 'dresses', 'outerwear', 'shoes', 'accessories', 'bags',
    'activewear', 'swimwear', 'loungewear',
  ],
  fit: [
    'slim', 'oversized', 'relaxed', 'fitted', 'high-waist', 'low-rise', 'cropped',
    'long', 'short',
  ],
  pattern: [
    'solid', 'striped', 'floral', 'graphic', 'plaid', 'animal', 'abstract',
    'geometric', 'tie-dye',
  ],
};

/** All tags as a flat array (for building tag_scores from selection). */
export function getAllTags() {
  return Object.values(TAXONOMY).flat();
}
