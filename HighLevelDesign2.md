# StyleSwipe — High-Level Design Document

## Vision
**StyleSwipe is a personal AI stylist in your pocket.** Users discover their authentic style through intuitive swiping. The app learns their taste in real-time and surfaces personalized product recommendations from real brands they'll actually love.

**Core Metaphor:** Tinder for fashion — swipe right to love it, left to skip it. Every swipe teaches the AI a little more about you.

---

## Problem We Solve

**User Pain Points:**
- Fashion discovery is overwhelming (too many choices, no personalization)
- Browsing online is passive — users don't know what they actually want until they see it
- No quick way to filter, save, or organize favorites
- Generic recommendations don't match individual taste
- Building a cohesive personal style is time-consuming and confusing

**Why Now:**
- Gen Z and millennials want faster, gamified discovery experiences
- Shopify Catalog API now enables real product integration
- Mobile-first fashion browsing is the default behavior
- Personalization without ML (heuristic scoring) reduces complexity

---

## Product Strategy

### Target User
**Primary:** Fashion-conscious people aged 16–35 who want to refine their style and discover themselves through fashion.

**Secondary:** Shoppers looking for outfit inspiration and real product recommendations before buying.

### User Value Proposition
1. **Clarity** — "I finally understand my style"
2. **Speed** — "I found exactly what I wanted in 5 minutes"
3. **Discovery** — "I found brands and items I never would have seen"
4. **Confidence** — "I know these items work for my style"

---

## Core User Experience

### The Loop
```
User Opens App
    ↓
[Onboarding] Select initial preferences (optional, 2 min)
    ↓
[Swipe Screen] See product → Swipe right (love) or left (skip)
    ↓
AI learns → Scores products based on likes/skips
    ↓
[Feed Refresh] Next products shown are more personalized
    ↓
[My Style] Tap to see saved items and "Style DNA"
    ↓
[Buy] Tap "Buy Now" to go to Shopify product page
```

### Key Interactions

**Swiping**
- Minimal cognitive load: one action (swipe) per product
- Immediate feedback: next card appears instantly
- Haptic feedback: subtle vibration reinforces action
- No friction: no confirmation dialogs, ratings scales, or text input

**My Style Collection**
- Visual grid of saved items
- "Style DNA" badge showing top 5 tags you've expressed
- Buy buttons link directly to Shopify
- Remove items with one tap

**Onboarding (Optional)**
- Users can skip and jump straight to swiping
- If completed: pre-seeds tag scores for faster personalization
- Choices: style vibe, color palette, clothing categories

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────┐
│         Mobile App (React Native)           │
│  ────────────────────────────────────────   │
│  UI Layer:  Screens & Components            │
│  ────────────────────────────────────────   │
│  State:     Zustand Store                   │
│             (Profile, Feed, Saved Items)    │
│  ────────────────────────────────────────   │
│  Logic:     Heuristic Style Engine          │
│             (Scoring, Ranking, Learning)    │
│  ────────────────────────────────────────   │
│  Persist:   AsyncStorage (Local)            │
└──────────────┬──────────────────────────────┘
               │
               ↓ (HTTP + Token Auth)
        ┌──────────────────┐
        │  Shopify API     │
        │  Catalog Service │
        └──────────────────┘
```

**Key Design Decision:** No backend server. All intelligence lives on the client. Shopify is the only external dependency.

---

## How the AI Works (Simplified)

### The Model
Not machine learning — **heuristic scoring based on tags.**

Each product has tags (color, style, category, material, occasion).
Each user has a "taste profile" = affinity scores for tags (0.0–1.0).

### Learning Loop
```
User swipes right (loves it)
    ↓
Extract product's tags
    ↓
Boost those tags in user's profile (+0.15)
    ↓
Slight decay all other tags (×0.98)
    ↓
Next products ranked by average tag match

User swipes left (skips it)
    ↓
Slight penalty to those tags (-0.05)
    ↓
Rest of loop same
```

### Result
- After 5 swipes: feed personalization kicks in
- After 20 swipes: noticeable preference clustering
- No cold-start problem: onboarding seeds initial preferences

### Why This Works
- Fast (no server round-trip per ranking)
- Transparent (user can see top 5 tags in "Style DNA")
- Interpretable (tags make sense, not a black box)
- Extensible (easy to add new dimensions)

---

## Data Model (Conceptual)

### User Profile
```
Profile {
  hasOnboarded: boolean
  tagScores: {
    "black": 0.72,
    "minimalist": 0.68,
    "cotton": 0.61,
    ...
  }
  preferredStyles: ["Minimalist", "Streetwear"]
  preferredColors: ["Neutrals", "Darks"]
  preferredCategories: ["Tops", "Bottoms"]
}
```

### Swipe History
```
Swipe {
  productId: string
  direction: "like" | "skip"
  tagsAtTimeOfSwipe: string[]
  timestamp: ISO8601
}
```

### Saved Items
```
SavedItem {
  productId: string
  title: string
  brand: string
  price: string
  imageUrl: string
  buyUrl: string (direct Shopify link)
  tags: string[]
  savedAt: ISO8601
}
```

**All data stored locally in AsyncStorage. Survives app restarts.**

---

## Screens & Navigation

### Onboarding Stack (shown if first-time user)
1. **Welcome** — "Learn your style by swiping"
2. **Style Picker** — Select aesthetic preferences
3. **Color Picker** — Favorite color palettes
4. **Category Picker** — What do you shop for?
5. → Start swiping

Users can skip at any time.

### Main App (Tab Navigation)

**Discover Tab (Primary)**
- Swipe feed (one card visible at a time)
- Product info: brand, title, price, image
- Auto-loads more products as queue depletes
- "My Style" button (top right)

**My Style Tab**
- Saved items grid (2 columns)
- Style DNA banner (top 5 tags)
- Buy Now / Remove buttons
- Empty state if no items saved yet
- "Discover" button to return to feed

---

## Product Sources & Data

### Primary: Shopify Catalog API
- Real products with images, prices, buy links
- Rich attributes (color, material, category, occasion)
- Bearer token authentication (cached, 1-hour expiry)

### Fallback: Mock Data
- If API unreachable: 20 curated sample products
- Includes diverse styles, colors, brands
- Seamless UX — user never sees "error"

### Feed Refresh Strategy
- Load 20 products at a time
- Maintain queue of 3–50 products
- Auto-refresh when < 3 remain
- Rank by user's current tag scores

---

## User Journeys

### Happy Path (3 min)
```
1. Open app
2. Tap "Skip" onboarding (optional)
3. Swipe 5–10 products (left/right)
4. Tap "My Style" → See 2–3 saved items
5. Tap "Buy Now" → Opens Shopify
6. Close app
7. Reopen later → Profile saved, continue swiping
```

### Power User (15 min)
```
1. Complete onboarding (select 5+ preferences)
2. Swipe 50+ products (feed auto-refreshes)
3. Build collection of 20+ saved items
4. Observe Style DNA evolve
5. Share collection (future feature)
```

### Casual Browser
```
1. Skip onboarding
2. Swipe 3–4 products, randomly
3. Close app
4. Return next week
5. Feed has reset, start fresh
```

---

## Success Metrics

### Engagement
- **Session Length:** Avg. 5–10 min per session
- **Swipes per Session:** 10–20 swipes
- **Return Rate:** 30% of users return within 7 days

### Personalization
- **Save Rate:** 15–25% of swiped items saved
- **Tag Convergence:** Top 5 tags stabilize after 20 swipes
- **Ranking Accuracy:** User saves > 30% of top-10 ranked items

### Commerce (Nice-to-Have)
- **Click-Through Rate:** 20% of saved items → buy page
- **Brand Distribution:** No single brand > 40% of saves
- **Price Range Spread:** Items saved from $15–$500 range

---

## Constraints & Assumptions

### Technical Constraints
- **No backend server** — everything local/client-side
- **No ML/NLP** — heuristic tag-based only
- **Network optional** — works offline with cached products
- **Mobile-first** — iOS + Android via React Native

### Business Constraints
- **No user accounts** — single-device profile only (for now)
- **No social** — no sharing between users (future feature)
- **No custom curation** — algorithm-driven only
- **Attribution** — user never sees "Why we picked this"

### User Assumptions
- Users have 5+ min of intent per session
- Users enjoy swiping (gamified discovery)
- Users trust Shopify links and brand names
- Users understand minimalist UI (few buttons, clear hierarchy)

---

## Roadmap (Future Phases)

### Phase 2: Cloud & Social
- User accounts (email/Google auth)
- Multi-device sync (iCloud/Firebase)
- Share collections with friends
- Comment on saved items

### Phase 3: Intelligence
- "Why I like this" → show matching tags
- Smart filters (price range, brand, category)
- Trending items in your taste
- Recommendations from top designers

### Phase 4: Commerce
- In-app checkout
- Affiliate commissions (CJ Affiliate, Awin)
- Direct brand partnerships
- Ads (retargeting, brand campaigns)

---

## Competitive Landscape

| App | Approach | Strength | Weakness |
|---|---|---|---|
| **StyleSwipe** | Heuristic learning via swiping | Fast, simple, personalized | No social, limited catalog |
| Pinterest | Curated discovery + ML recommendations | Rich content, large catalog | Not gamified, passive browsing |
| Shein | Fast fashion + trending | Massive inventory, cheap | No personalization, low quality |
| Stitch Fix | Human stylists + ML | High quality, personalized | Expensive, slow (1x/month) |
| ASOS | Search + filters + trending | Large catalog, familiar UX | No personalization, overwhelming |

**StyleSwipe's Edge:** Gamified, real-time personalization with zero friction.

---

## Go-to-Market

### Launch Strategy
- **Hackathon Demo** → proof of concept with mock data
- **Beta** (Friends & Family) → real Shopify integration, iOS TestFlight
- **Soft Launch** → iOS App Store (US)
- **Android Launch** → 3 months later
- **Marketing:** TikTok, Instagram, fashion communities

### Monetization (Phase 2)
- Free app (user data insights)
- Brand partnerships (featured items)
- Affiliate commissions (Shopify, CJ)
- Premium tier (export collections, advanced filters)

---

## Success Definition

**MVP (Hackathon):**
- App works end-to-end (onboarding → swipe → save → persist)
- Mock products render correctly
- Tag scoring produces observable personalization
- UI is clean and intuitive
- Demo takes < 2 minutes to show value

**Beta (3 months post-launch):**
- 500+ beta testers
- 40%+ 7-day retention
- 1000+ saved items across users
- Zero crashes in 100+ sessions

**Production (Year 1):**
- 50K+ iOS downloads
- 20K monthly active users
- 10M+ swipes
- $10K revenue (affiliate + brand deals)

---

## Summary

**StyleSwipe** turns fashion discovery into a fun, personalized experience. Users swipe to learn about themselves; the app learns from every swipe to show better products. No server, no complexity — just simple heuristic learning that delivers real value in under 5 minutes.

The bet: **Gamification + instant personalization beats generic recommendations.**
