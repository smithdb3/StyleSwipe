/**
 * Demo feed: 22 local clothing_demo items for when the API returns no inspiration.
 * Each item has id (demo-1..demo-22), tags, buy_url, and imageSource for local Image.
 */
import clothingDemoData from '../data/clothing_demo.json';
import { getClothingDemoImage } from './clothingDemoImages';

export function getDemoFeedItems() {
  return clothingDemoData.items.map((item) => ({
    id: `demo-${item.id}`,
    tags: item.tags,
    buy_url: item.buy_url,
    imageSource: getClothingDemoImage(item.id),
  }));
}

export function isDemoItemId(itemId) {
  return typeof itemId === 'string' && itemId.startsWith('demo-');
}
