/**
 * Local image sources for the demo clothing set.
 * Uses app/_clothingImageMap.js (app/assets/clothing_demo) so Metro resolves on web and native.
 */
const CLOTHING_DEMO_IMAGES = require('../app/_clothingImageMap.js');

export function getClothingDemoImage(id) {
  return CLOTHING_DEMO_IMAGES[id] ?? null;
}

export { CLOTHING_DEMO_IMAGES };
