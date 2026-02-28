import { UserProfile, ShopifyProduct } from '../types/index';
import { extractTags } from './tagExtractor';

const LIKE_BOOST = 0.15;
const SKIP_PENALTY = -0.05;
const TAG_DECAY = 0.98;
const DEFAULT_TAG_VALUE = 0.5;
const ONBOARDING_SEED_VALUE = 0.65;
const COLD_START_THRESHOLD = 5;
const MIN_SCORE_FOR_RANKING = 0.3;

/**
 * Update user profile tag scores based on a swipe action
 */
export function updateProfileOnSwipe(
  profile: UserProfile,
  direction: 'like' | 'skip',
  tags: string[]
): UserProfile {
  const newTagScores = { ...profile.tagScores };

  // Apply decay to all existing tags
  Object.keys(newTagScores).forEach(tag => {
    newTagScores[tag] = newTagScores[tag] * TAG_DECAY;
  });

  // Apply boost/penalty to swiped tags
  const delta = direction === 'like' ? LIKE_BOOST : SKIP_PENALTY;

  tags.forEach(tag => {
    if (!newTagScores[tag]) {
      newTagScores[tag] = DEFAULT_TAG_VALUE;
    }
    newTagScores[tag] = Math.max(0, Math.min(1, newTagScores[tag] + delta));
  });

  return {
    ...profile,
    tagScores: newTagScores,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Score a product based on user's tag affinities
 */
export function scoreProduct(profile: UserProfile, product: ShopifyProduct): number {
  const productTags = extractTags(product);

  if (productTags.length === 0) {
    return DEFAULT_TAG_VALUE;
  }

  const scores = productTags.map(tag => {
    return profile.tagScores[tag] ?? DEFAULT_TAG_VALUE;
  });

  // Average of all tag scores
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/**
 * Rank and sort a list of products for the user
 * Returns products sorted by score (highest first)
 */
export function rankFeed(
  profile: UserProfile,
  products: ShopifyProduct[],
  swipeCount: number = 0
): ShopifyProduct[] {
  const scored = products.map(product => ({
    product,
    score: scoreProduct(profile, product),
  }));

  // If in cold start mode or all scores too low, use random order
  if (swipeCount < COLD_START_THRESHOLD || scored.every(s => s.score < MIN_SCORE_FOR_RANKING)) {
    return scored
      .sort(() => Math.random() - 0.5)
      .map(s => s.product);
  }

  // Normal ranking: sort by score descending
  return scored
    .sort((a, b) => b.score - a.score)
    .map(s => s.product);
}

/**
 * Initialize tag scores from onboarding selections
 */
export function initializeTagScoresFromOnboarding(
  styles: string[],
  colors: string[],
  categories: string[]
): Record<string, number> {
  const scores: Record<string, number> = {};

  const allTags = [...styles, ...colors, ...categories];

  allTags.forEach(tag => {
    scores[tag.toLowerCase()] = ONBOARDING_SEED_VALUE;
  });

  return scores;
}

/**
 * Get top N tag scores for display in "Style DNA"
 */
export function getTopTags(profile: UserProfile, count: number = 5): Array<[string, number]> {
  return Object.entries(profile.tagScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count);
}
