# StyleSwipe Setup Guide

## Prerequisites
- Node.js 16+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator
- Or: Expo Go app on physical device

## Step 1: Install Dependencies
```bash
cd StyleSwipe
npm install
```

## Step 2: Configure Environment
The app works with **mock data by default**. To use real Shopify data:

1. Create `.env` file in project root
2. Add Shopify API credentials:
   ```env
   EXPO_PUBLIC_SHOPIFY_CLIENT_ID=your_client_id
   EXPO_PUBLIC_SHOPIFY_CLIENT_SECRET=your_client_secret
   EXPO_PUBLIC_SHOPIFY_API_URL=https://api.shopify.com/v1
   EXPO_PUBLIC_USE_MOCK_DATA=false
   ```

3. If no credentials, leave `USE_MOCK_DATA=true` (default)

## Step 3: Start the App
```bash
expo start
```

Output will show:
```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   Expo Go QR Code here...                                      │
│                                                                │
└────────────────────────────────────────────────────────────────┘

› Press 'a' to open Android Emulator
› Press 'i' to open iOS Simulator
› Press 'w' to open web
› Press 'q' to quit
```

## Step 4: Run on Device

### Option A: iOS Simulator (Mac only)
```bash
expo start
# Press 'i'
```

### Option B: Android Emulator
```bash
expo start
# Press 'a'
```

### Option C: Physical Device
1. Download **Expo Go** app (iOS App Store or Google Play)
2. Open Expo Go on phone
3. Scan QR code from `expo start` output

## First Run Demo

1. **Onboarding** (optional)
   - Select 1+ style preferences
   - Select 1+ color preferences
   - Select 1+ category preferences
   - Or tap "Skip" to use random items

2. **Discover Screen**
   - Tap a product card to simulate swipe right (saves item)
   - Use hint buttons below card to remove from queue
   - "My Style" button (top right) goes to saved items

3. **My Style Screen**
   - View "Style DNA" (top 5 tag affinities as progress bars)
   - Browse saved products in 2-column grid
   - Tap "Buy Now" to open product page
   - Tap "Remove" to delete from collection
   - "Discover" button returns to swipe feed

## Troubleshooting

### App won't start
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
expo start
```

### Profile not persisting
- AsyncStorage requires native modules in development
- Use physical device or native build for full testing
- Web simulator has limited AsyncStorage support

### Mock data not showing
- Check `EXPO_PUBLIC_USE_MOCK_DATA` is `true` or not set
- Verify `src/mocks/products.ts` exists
- Restart with `expo start`

### Network errors with Shopify
- Verify credentials in `.env`
- App auto-fallbacks to mock data on 4xx/5xx errors
- Check Shopify API status: https://status.shopify.com

## Development Tips

### Debug Store State
The Zustand store is exported from `src/store/index.ts`. Add:
```typescript
import { useStore } from './store/index';

// In a component:
const profile = useStore(s => s.profile);
console.log('Profile:', profile);
```

### View AsyncStorage
Use React Native Debugger or DevTools Console:
```javascript
// In Dev Menu (Cmd+M on iOS, Cmd+M on Android)
console.log(await AsyncStorage.getAllKeys());
```

### Force Reload Profile
To test onboarding again:
1. Open React Native Debugger
2. Run: `AsyncStorage.removeItem('styleswipe:user_profile')`
3. Reload app (Cmd+R)

## Building for Release

### iOS
```bash
expo build:ios
```

### Android
```bash
expo build:android
```

See [Expo Build Docs](https://docs.expo.dev/build/introduction/) for details.

## Performance Notes

- Feed loads 20 products at a time, max 50 in queue
- Tag scores cached in Zustand (not recomputed per render)
- AsyncStorage operations debounced 500ms to reduce writes
- Images loaded via placeholder URLs in mock data

## Architecture Notes

### Data Flow
```
User Swipes
  ↓
recordSwipe() in Store
  ↓
updateProfileOnSwipe()
  ↓
Zustand state updated
  ↓
Debounced AsyncStorage write
  ↓
Feed re-ranked using new scores
```

### Cold Start (< 5 swipes)
Before user has enough data, products served in random order to gather diverse signals.

### Ranking
After 5 swipes:
```
For each product:
  score = average(user.tagScores[tag] for tag in product.tags)
Sort by score descending
Display sorted results
```

## Next Features to Implement

1. **Real Swipe Gestures**: Use `react-native-deck-swiper` library
2. **Share Collections**: Add "Share My Style" button
3. **Dark Mode**: Toggle in My Style header
4. **Insights**: Show "Why you like this" based on top matching tags
5. **Filters**: Search/filter by category, price, brand
6. **Cloud Sync**: Firebase or custom backend for multi-device sync
