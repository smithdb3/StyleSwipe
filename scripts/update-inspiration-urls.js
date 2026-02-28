#!/usr/bin/env node
/**
 * Reads data/mock-inspiration.json and outputs SQL to update inspiration_items
 * with the outfit image_urls. Run the printed SQL in Supabase Dashboard → SQL Editor
 * to fix old image URLs in the database.
 *
 * Usage: node scripts/update-inspiration-urls.js
 */

const path = require('path');
const fs = require('fs');

const mockPath = path.join(__dirname, '..', 'data', 'mock-inspiration.json');
const data = JSON.parse(fs.readFileSync(mockPath, 'utf8'));

if (!data.items || !Array.isArray(data.items)) {
  console.error('mock-inspiration.json must have an "items" array');
  process.exit(1);
}

console.log('-- Update inspiration_items with outfit image URLs from mock-inspiration.json');
console.log('-- Run this in Supabase Dashboard → SQL Editor\n');

for (const item of data.items) {
  if (!item.id || !item.image_url) continue;
  const url = item.image_url.replace(/'/g, "''");
  console.log(`UPDATE public.inspiration_items SET image_url = '${url}' WHERE id = '${item.id}'::uuid;`);
}

console.log('\n-- Done. Rows updated: ' + data.items.length);
