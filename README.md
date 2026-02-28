# StyleSwipe

**Tinder for fashion** — A personal style discovery app built with React Native/Expo.

## Quick Start

### Installation
```bash
npm install
# or yarn install
```

### Configuration
Create a `.env` file with Shopify credentials (optional - mock data works by default):
```env
EXPO_PUBLIC_SHOPIFY_CLIENT_ID=your_client_id
EXPO_PUBLIC_SHOPIFY_CLIENT_SECRET=your_client_secret
EXPO_PUBLIC_USE_MOCK_DATA=false
```

### Run
```bash
expo start

# Then press 'i' for iOS or 'a' for Android
# Or scan QR code with Expo Go app
```

## Project Structure

```
StyleSwipe/
├── src/
│   ├── App.tsx                 # Root component
│   ├── types/index.ts          # TypeScript types
│   ├── store/index.ts          # Zustand store
│   ├── engine/                 # Style engine & tag logic
│   ├── services/               # API & storage
│   ├── screens/                # Three main screens
│   ├── components/             # Reusable UI components
│   ├── navigation/             # React Navigation setup
│   └── mocks/                  # Mock product data
├── package.json
├── app.json                    # Expo config
├── tsconfig.json
├── babel.config.js
└── index.js                    # Entry point
```

## Features

- **Swipe Interface**: Left to skip, right to save
- **AI Style Learning**: Heuristic tag-based scoring learns preferences
- **Real Products**: Shopify Catalog API (with mock fallback)
- **Saved Collection**: My Style tab shows saved items and Style DNA
- **Onboarding**: Optional quick setup (style, colors, categories)
- **Persistent Storage**: Profile and saved items stored locally

## Tech Stack

| Layer | Tech |
|---|---|
| **Framework** | React Native + Expo |
| **Navigation** | React Navigation v6 |
| **State** | Zustand |
| **API** | Fetch + TanStack React Query |
| **Persistence** | AsyncStorage |
| **UI** | React Native (built-in components) |

## Demo Flow

1. App loads → onboarding shows (if first time)
2. Select style preferences (optional, can skip)
3. Swipe feed: tap card or swipe left/right
4. Tap "My Style" to see saved items and Style DNA
5. Kill app and reopen → profile persists

## Key Behaviors

- **Cold Start**: First 5 swipes show random items to gather data
- **Ranking**: After 5 swipes, products ranked by matching tag scores
- **Auto-Refill**: Feed auto-loads more products when queue < 3 cards
- **Mock Fallback**: If Shopify API fails, uses 20 curated mock products
- **Haptics**: Vibration feedback on swipes (iOS/Android)

## Testing Checklist

- [ ] Complete onboarding → profile saved to AsyncStorage
- [ ] Swipe 10+ cards → tagScores update correctly
- [ ] Queue auto-replenishes (watch 3-card threshold)
- [ ] Swipe right → item appears in My Style
- [ ] Kill app, reopen → profile and items persist
- [ ] Tap "Buy Now" → opens product link
- [ ] Mock fallback works (temporarily disable Shopify in code)

## Next Steps

- [ ] Integrate real Shopify API credentials
- [ ] Add swipe gesture library (react-native-deck-swiper)
- [ ] Implement Share collections feature
- [ ] Add dark mode toggle
- [ ] Create "Why I like this" insights

## Notes

- Uses mock products by default — set `.env` `EXPO_PUBLIC_USE_MOCK_DATA=false` and add Shopify credentials to test real API
- Swipe gestures are simulated via tap for MVP (tapping card = swipe right)
- All state persists to AsyncStorage with 500ms debounce