# StyleSwipe — High-Level Design Document

This document is the single source of truth for both **what** we're building and **how** we're building it. It merges product vision with technical architecture. [requirements.md](requirements.md) remains the product and feature checklist; here we focus on strategy, architecture, and implementation shape.

---

## 1. Vision and goals

**StyleSwipe is a personal AI stylist in your pocket.** Users discover their authentic style through intuitive swiping on outfit and look inspiration. The app learns their taste in real time. On a **separate Recommendations page**, users see purchasable clothes from real brands that match their style — similar aesthetic, not the exact items they swiped on. They don't buy from the swipe images; they buy from the recommendations.

**Core metaphor:** Tinder for fashion — swipe right to love it, left to skip it. Every swipe teaches the system a little more about you. When you're ready to shop, the Recommendations page shows clothes that look like what you loved.

**Goals of this doc:** Define architecture (mobile + Supabase + content), tech stack, data model, content pipeline, how the AI works, core flows, screens, Supabase usage, user journeys, success metrics, constraints, roadmap, and what we're not building yet — so the team can build without guessing.

---

## 2. Problem we solve

**User pain points:**
- Fashion discovery is overwhelming (too many choices, no personalization)
- Browsing online is passive — users don't know what they actually want until they see it
- No quick way to filter, save, or organize favorites
- Generic recommendations don't match individual taste
- Building a cohesive personal style is time-consuming and confusing

**Why now:**
- Gen Z and millennials want faster, gamified discovery experiences
- Shopify Catalog API enables real product integration
- Mobile-first fashion browsing is the default behavior
- Heuristic tag-based personalization (no ML) keeps MVP simple and interpretable

---

## 3. Product strategy

### Target user
**Primary:** Fashion-conscious people aged 16–35 who want to refine their style and discover themselves through fashion.

**Secondary:** Shoppers looking for outfit inspiration and real product recommendations before buying.

### User value proposition
1. **Clarity** — "I finally understand my style"
2. **Speed** — "I found exactly what I wanted in 5 minutes"
3. **Discovery** — "I found brands and items I never would have seen"
4. **Confidence** — "I know these items work for my style"

---

## 4. Architecture overview

The system has three pillars. **We use Supabase as the backend; client-only persistence is not the primary store.**

1. **Mobile app** — React Native (Expo) client: swipe UI (inspiration feed), onboarding, My Style (saved inspiration), **Recommendations** (shoppable products), profile. Optional local cache (e.g. React Query, AsyncStorage) for fast load or offline.
2. **Supabase** — Auth, Postgres database, and Edge Functions for swipe feed, swipe submission, My Style, and **Recommendations** (ranked shoppable products). Source of truth for users, profiles, swipes, inspiration content, and product catalog.
3. **Content pipeline** — Two streams: (a) **Swipe feed** = inspiration/outfit images (curated dataset or editorial content) for learning taste only; (b) **Recommendations** = purchasable products from Shopify Catalog API and/or ingested catalog, matched by style/tags. App gets both from Supabase; it never talks to external APIs directly.

```mermaid
flowchart LR
  subgraph client [Mobile App]
    RN[React Native Expo]
  end
  subgraph backend [Supabase]
    Auth[Auth]
    DB[(DB)]
    EF[Edge Functions]
  end
  subgraph content [Content]
    Shopify[Shopify API / Catalog]
  end
  RN --> Auth
  RN --> DB
  RN --> EF
  EF --> Shopify
  EF --> DB
```

- **App → Supabase:** Auth (login/signup), read/write swipes and profile, request swipe feed (inspiration), My Style (liked inspiration), and **Recommendations** (shoppable products).
- **Supabase → Content:** Edge Function serves swipe feed from inspiration content; Recommendations Edge Function ranks purchasable products (from Shopify or `items`) by tag match to user profile.
- **Edge Functions:** Swipe feed (inspiration items, ranked by tag scores), submit swipe (writes swipes + updates profile tag_scores), My Style (liked inspiration items), **Recommendations** (shoppable products ranked by style match — similar aesthetic, not the same as swipe content).

---

## 5. Tech stack

| Layer | Choice | Notes |
|-------|--------|--------|
| **Mobile** | React Native + Expo (managed workflow) | Single codebase for iOS/Android; Expo simplifies builds and OTA updates. |
| **Navigation** | Expo Router | File-based routing; fits Expo and keeps navigation declarative. |
| **State** | React state + context for UI; Supabase for persistence | Profile, swipes, and feed from Supabase. Optional: React Query or SWR for feed/API caching; AsyncStorage for offline or fast load. |
| **Backend** | **Supabase** | Postgres (profiles, items, swipes); built-in Auth and RLS; Edge Functions for feed, swipe, and recommendation logic. SQL and RLS for multi-tenant data. |
| **Content** | Two streams: inspiration + products | **Swipe feed:** inspiration/outfit images (curated or editorial) for learning only; no purchase. **Recommendations:** Shopify Catalog API and/or ingested catalog (shoppable products, similar style). Both served via Supabase. |
| **AI/ML (MVP)** | Heuristic tag scoring in Edge Function | No ML. Tag affinity per user (0.0–1.0); boost on like, penalty on skip; rank by tag match. Implemented in Supabase Edge Function. |

---

## 6. Data model

**Supabase tables:**

- **profiles** — Keyed by Supabase Auth user id. Fields: `created_at`, `has_onboarded`, `tag_scores` (JSON: tag → affinity 0.0–1.0), `preferred_styles`, `preferred_colors`, `preferred_categories`. Updated by Edge Function on each swipe and during onboarding.
- **inspiration_items** (or **items** with type) — Content for the **swipe feed** only. Id, `image_url`, `source`, `tags` (array). No buy link; used for learning taste. Populated from curated/editorial dataset.
- **products** (or **items** with type = product) — **Shoppable** items for the **Recommendations** page. Id, `image_url`, metadata (brand, price, **buy_url**), `tags`. From Shopify or ingested catalog. Matched to user by tag similarity; similar style, not the same as inspiration.
- **swipes** — `user_id`, `item_id` (references inspiration_items), `direction` (like/skip), `timestamp`. Right swipes drive My Style and tag-score updates; all swipes drive recommendation ranking (products are matched by profile tags, not by being the same as swiped items).

**Derived:**
- **Style DNA** — Top N tags (e.g. 5) from `profiles.tag_scores`; shown in My Style and Recommendations.
- **My Style** — User's right swipes joined to **inspiration** items for display (grid, remove). No purchase here; inspiration only.
- **Recommendations** — Shoppable products ranked by tag match to user profile (similar style/aesthetic). Shown on dedicated Recommendations page with buy links.

**Conceptual shapes (for readability):**

```
Profile {
  hasOnboarded: boolean
  tagScores: { "black": 0.72, "minimalist": 0.68, ... }
  preferredStyles: string[]
  preferredColors: string[]
  preferredCategories: string[]
}

Swipe {
  userId: uuid
  itemId: uuid
  direction: "like" | "skip"
  timestamp: ISO8601
}
```

No full schema DDL in this doc; that can live in the repo or a separate spec.

---

## 7. Content pipeline

**Two streams:**

1. **Swipe feed (inspiration)** — Outfit/look images used only for learning taste. Source: curated dataset (e.g. DeepFashion, editorial content) or fixed JSON/CSV. Stored in `inspiration_items` (or `items` with type). No buy links. Edge Function returns ranked inspiration for the swipe stack. Users do not buy these; they swipe to teach the app their style.

2. **Recommendations (shoppable products)** — Real products with images, prices, buy links, and tags. Source: Shopify Catalog API and/or ingested catalog. Stored in `products` (or `items` with type = product). Edge Function ranks by tag similarity to user profile and returns list for the **Recommendations page**. These are clothes that match the user's aesthetic — similar style, not the exact clothes from the swipe feed.

**Serving:** App requests swipe feed and Recommendations from Supabase only. Swipe feed = inspiration items. Recommendations = products with buy_url. Content sources are implementation details behind Supabase.

**Fallback:** Mock inspiration and mock products for demo or when APIs are unreachable; seamless UX so the user never sees an error.

---

## 8. How the AI works

Not machine learning — **heuristic tag-based scoring**, implemented **server-side** in a Supabase Edge Function.

**Model:**
- Inspiration items (swipe feed) and products (recommendations) both have tags (color, style, category, material, occasion).
- Each user has a taste profile = affinity scores for tags (0.0–1.0), stored in `profiles.tag_scores`. Learned from swipes on **inspiration**; used to rank both the next inspiration cards and the **shoppable recommendations** (similar style, different items).

**Learning loop (on every swipe):**

```
User swipes right (loves it)
    → Extract inspiration item's tags
    → Boost those tags in user's profile (+0.15)
    → Slight decay all other tags (×0.98)
    → Next feed ranked by average tag match

User swipes left (skips it)
    → Slight penalty to that inspiration item's tags (-0.05)
    → Rest of loop same
```

**Result:**
- After ~5 swipes: feed personalization kicks in.
- After ~20 swipes: noticeable preference clustering.
- No cold-start problem: onboarding seeds initial preferences into `tag_scores`.

**Contract:** Swipe feed: input `user_id`, `limit` → ordered inspiration items (no buy link). Recommendations: input `user_id`, `limit` → ordered **products** (with buy_url) ranked by tag match — similar style to what they liked, not the same as swipe content. Style DNA = top 5 tags from `profiles.tag_scores`.

**Why this works:** Transparent (user sees top 5 tags in Style DNA), interpretable, extensible. Same logic for all clients because it runs in Supabase.

**Later:** Embeddings, "why you might like this" explanations, real brand APIs.

---

## 9. Core flows

**The loop:**
```
User Opens App
    ↓
[Onboarding] Select initial preferences (optional, skip anytime)
    ↓
[Swipe Screen] See inspiration (outfit/look) → Swipe right (love) or left (skip)
    ↓
Edge Function updates tag_scores; next inspiration feed more personalized
    ↓
[My Style] Tap to see saved inspiration (what they liked) + Style DNA
    ↓
[Recommendations] Separate page: shoppable products, similar style (not same clothes)
    ↓
[Buy] Tap "Buy Now" on a recommendation → product buy link (e.g. Shopify)
```

- **Onboarding** — Welcome, Style Picker, Color Picker, Category Picker. Persist to `profiles` in Supabase; seed `tag_scores` if provided. Then navigate to Discover.
- **Swipe session** — App fetches next N **inspiration** items from swipe-feed Edge Function (no buy links). On each swipe: call submit-swipe (writes `swipes` + updates `profiles.tag_scores`); update local queue; prefetch when queue low. Card stack animates smoothly. Maintain queue of ~3–50; auto-refresh when &lt; 3 remain. Users do not buy from these images.
- **Feed generation** — Edge Function returns **inspiration** items (ranked by tag scores) for the swipe stack only.
- **My Style** — Query Supabase for user's right swipes + inspiration item details. Grid, Style DNA banner, Remove. No purchase on this page; it's a gallery of liked inspiration.
- **Recommendations** — **Dedicated page.** Edge Function returns **shoppable products** (from Shopify or catalog) ranked by tag match to user profile — similar style and aesthetic, not the exact clothes from the swipe feed. Grid or list with Buy Now. This is where users shop.

---

## 10. Screens and navigation

**Pattern:** Tab-based main app (Discover, My Style, **Recommendations**, Profile). Onboarding = stack shown for first-time users; skip anytime.

**Onboarding stack:**
1. **Welcome** — "Learn your style by swiping"
2. **Style Picker** — Select aesthetic preferences
3. **Color Picker** — Favorite color palettes
4. **Category Picker** — What do you shop for?
5. → Start swiping

**Main tabs:**
- **Discover (primary)** — Swipe feed of **inspiration** images (one card at a time). Outfit/look only; no buy link. Auto-loads more as queue depletes. Entry to My Style and Recommendations (e.g. top nav).
- **My Style** — Saved inspiration grid (what they swiped right on). Style DNA banner (top 5 tags). Remove only; no purchase. Empty state if no saves.
- **Recommendations** — **Separate page.** Grid or list of **shoppable products** that match their style (similar aesthetic, not the exact clothes they swiped). Each item has image, brand, price, **Buy Now** (e.g. Shopify link). This is where users buy.
- **Profile** — Account, theme (dark/light), about.

**Navigation:** Expo Router. Routes e.g. `(tabs)/index`, `(tabs)/my-style`, `(tabs)/recommendations`, `(tabs)/profile`, `onboarding`.

---

## 11. Supabase usage

- **Auth:** Email/password or OTP for MVP. User id from Auth links to `profiles` and `swipes`. Optional: anonymous auth for "try before sign-up," then convert to permanent account.
- **Data:** Tables `profiles`, `inspiration_items` (or `items` by type), `products`, `swipes`. RLS: users read/write only their own profile and swipes; inspiration and products read-only for app users.
- **Edge Functions (API surface):**
  - **Swipe feed** — In: `user_id`, `limit`. Returns ordered **inspiration** items (ranked by tag scores). No buy links. For the Discover swipe stack only.
  - **Submit swipe** — In: `user_id`, `item_id` (inspiration id), `direction`. Writes to `swipes` and updates `profiles.tag_scores`. Out: success/error.
  - **My Style** — In: `user_id`. Returns user's liked **inspiration** (right swipes + inspiration details). Out: list of inspiration items. No purchase.
  - **Recommendations** — In: `user_id`, `limit`. Returns ordered **shoppable products** (from Shopify or catalog) ranked by tag match to profile — similar style, not same as swipe content. Out: list of products with buy_url. Powers the dedicated Recommendations page.

Full request/response shapes can live in a separate API spec or in the repo.

---

## 12. User journeys

**Happy path (~3 min):**
1. Open app
2. Tap "Skip" onboarding (optional)
3. Swipe 5–10 inspiration images (left/right)
4. Tap "My Style" → See 2–3 saved inspiration looks
5. Tap "Recommendations" → See shoppable products that match their style (similar aesthetic)
6. Tap "Buy Now" on a recommendation → Opens product page (e.g. Shopify)
7. Close app; reopen later → Profile and swipes in Supabase; continue swiping

**Power user (~15 min):**
1. Complete onboarding (select 5+ preferences)
2. Swipe 50+ inspiration images (feed auto-refreshes)
3. Build My Style collection of 20+ saved inspiration looks
4. Observe Style DNA evolve; browse Recommendations page for similar-style clothes to buy
5. Share collection (future feature)

**Casual browser:**
1. Skip onboarding
2. Swipe 3–4 inspiration images
3. Close app
4. Return later → Profile and history in Supabase; feed and Recommendations continue from ranking

---

## 13. Success metrics

**Engagement:** Session length 5–10 min; 10–20 swipes per session; 30% return within 7 days.

**Personalization:** Save rate 15–25% (right swipes on inspiration); top 5 tags stabilize after ~20 swipes; recommendation ranking accuracy (user engages with &gt; 30% of top-10 recommended products).

**Commerce (nice-to-have):** Click-through from **Recommendations page** to buy page 20% of shown items; brand distribution (no single brand &gt; 40%); price range spread.

---

## 14. Constraints and assumptions

**Technical:** Supabase required. Network needed for feed and swipes; optional client cache for offline or fast load. No ML/NLP in MVP — heuristic tag-based only. Mobile-first (iOS + Android via React Native).

**Business:** User accounts via Supabase Auth (multi-device possible). No social in MVP (sharing later). Algorithm-driven only; no custom curation. Attribution ("why we picked this") optional later.

**User assumptions:** Users have 5+ min of intent per session; enjoy swiping; trust product/brand links; understand minimal UI.

---

## 15. Roadmap

**Phase 2: Cloud & Social** — User accounts and multi-device sync are satisfied by Supabase. Add: share collections, comment on saved items.

**Phase 3: Intelligence** — "Why I like this" (matching tags); smart filters (price, brand, category); trending in your taste; recommendations from designers.

**Phase 4: Commerce** — In-app checkout; affiliate commissions; direct brand partnerships; ads.

---

## 16. Out of scope / later

- Real brand partnership APIs and revenue share
- Advanced ML (custom training, A/B tests, full "why you like this" model)
- Offline-first sync, push notifications, sharing (from requirements nice-to-have)
- Full schema DDL and detailed API request/response examples (separate doc or repo)

**Competitive edge:** Gamified, real-time personalization with zero friction.

**Go-to-market:** Hackathon demo → Beta (TestFlight, Shopify) → Soft launch (iOS US) → Android later. Marketing: TikTok, Instagram, fashion communities. Monetization (Phase 2): brand partnerships, affiliate, premium tier.

---

## 17. Summary

StyleSwipe is a Supabase-backed mobile app (React Native + Expo) that turns fashion discovery into a fun, personalized experience. Users swipe on **inspiration** (outfit/look images) to teach the app their taste; they do not buy from those images. A **separate Recommendations page** shows shoppable products (from Shopify or catalog) that match their style — similar aesthetic, not the exact clothes they swiped. Heuristic tag-based scoring in Supabase Edge Functions learns from every swipe and powers both the inspiration feed and the recommendation ranking. One doc for both product intent and technical "how."

**The bet:** Gamification + instant personalization beats generic recommendations. Swipe to learn; Recommendations to shop.
