# StyleSwipe — High-Level Technical Document

## 1. Overview and goals

StyleSwipe is a personal stylist in your pocket: users discover their style by swiping on outfit and product content (right = love, left = pass). Behind the scenes, our system learns their taste from every swipe and, over time, surfaces real clothes from real brands that match what they would actually wear — not trending or one-size-fits-all recommendations.

This document describes **how** we build it. It covers architecture, tech stack, data model, content pipeline, core flows, AI/personalization approach, screens, and BaaS usage. It does not replace [requirements.md](requirements.md), which remains the product and feature source of truth. Here we focus on technical decisions and implementation shape so the team can build without guessing. We also call out what we are **not** building yet.

---

## 2. Architecture overview

The system has three pillars:

1. **Mobile app** — React Native (Expo) client: swipe UI, onboarding, My Style, profile.
2. **BaaS** — Auth, database, and serverless functions for feed, swipes, and recommendations.
3. **Content pipeline** — A curated dataset or open API supplies outfit/product images and metadata; we ingest or link this via the BaaS so the app always gets a consistent feed.

Optionally, an AI/embedding step (e.g. inside a BaaS cloud function) consumes swipe data and returns a ranked feed or recommendation list.

```mermaid
flowchart LR
  subgraph client [Mobile App]
    RN[React Native Expo]
  end
  subgraph backend [BaaS]
    Auth[Auth]
    DB[(DB)]
    CF[Cloud Functions]
  end
  subgraph content [Content]
    Dataset[Curated Dataset / API]
  end
  RN --> Auth
  RN --> DB
  RN --> CF
  CF --> Dataset
  CF --> DB
```

- **App → BaaS:** Auth (login/signup), read/write swipes and profile, request feed and recommendations.
- **BaaS → Content:** Ingest or resolve item metadata and image URLs (e.g. from `items` table populated from the dataset/API).
- **BaaS functions:** Feed generation, submit swipe, My Style query, and (optionally) recommendation ranking.

---

## 3. Tech stack

| Layer | Choice | Notes |
|-------|--------|--------|
| **Mobile** | React Native + Expo (managed workflow) | Single codebase for iOS/Android; Expo simplifies builds and OTA updates. |
| **Navigation** | Expo Router | File-based routing; fits Expo and keeps navigation declarative. |
| **State** | React state + context for UI; BaaS for persistence | Swipes, likes, and profile live in the backend. Optional: React Query or SWR for feed/API caching and refetch. |
| **Backend** | **Supabase** (BaaS) | Postgres for structured data (users, items, swipes); built-in Auth and RLS; Edge Functions for feed and recommendation logic. SQL and RLS give clear rules for multi-tenant data. |
| **Content** | Curated fashion/outfit dataset or public product API | Images and metadata stored or linked in Supabase (e.g. `items` table + storage or URL-only). See Content pipeline below. |
| **AI/ML (MVP)** | Simple ranking in Edge Function | No custom training for MVP. Store swipes; rank by tag/category overlap or a small embedding-based similarity. Contract: user id + optional params → ordered list of item ids (or full payload). |

---

## 4. Data model (high level)

We keep the model minimal and additive.

- **Users** — Id (from Supabase Auth), `created_at`, optional onboarding flags or preference fields (e.g. in a `profiles` table keyed by auth user id).
- **Items** — Id, `image_url` (or storage key), `source` (e.g. dataset name), metadata (category, brand, color, style tags, etc.) for filtering and ranking. Populated from the content pipeline.
- **Swipes** — `user_id`, `item_id`, `direction` (left/right), `timestamp`. Right swipes drive “My Style” and recommendation logic; all swipes can be used for learning.
- **Style profile (derived)** — No separate table for MVP. “Style profile” = set of right-swiped item ids plus, if we add it, a precomputed user vector or tag aggregate. Derived from swipes (and optionally refreshed by a function).

No full schema DDL in this doc; that can live in the repo or a separate spec.

---

## 5. Content pipeline

- **Source:** Curated dataset or open API — e.g. DeepFashion, a fashion e-commerce API, or a fixed JSON/CSV export of outfit/product metadata and image URLs.
- **Ingestion:** One-time or periodic load of images (or URLs only) and metadata into Supabase: e.g. `items` table plus Storage for blobs, or URL-only rows. Script or Edge Function can run ingestion/refresh.
- **Serving:** App never talks to the dataset directly. It requests feed/recommendations from Supabase; backend returns item list (and optionally pre-signed URLs for Storage). Content source is an implementation detail behind the BaaS.

---

## 6. Core flows (how they work)

- **Onboarding** — Short optional form (e.g. style preferences). Persist to user profile in BaaS. Then navigate to the main swipe feed.
- **Swipe session** — App fetches next N items from feed API. For each swipe: send `(user_id, item_id, direction)` to BaaS; update local queue; optionally prefetch next page. Card stack should animate smoothly (e.g. card off-screen on swipe).
- **Feed generation** — Backend returns an ordered list of item ids (or full item payload). MVP: random or “explore” order; v2: order by similarity to user’s likes (tags or embeddings). Document in-product that the feed improves as they swipe more.
- **My Style** — Query BaaS for the user’s right swipes; join to `items` for display. Show as grid or list. Optional: “Recommended for you” block using the same ranking as feed.
- **Recommendations** — Same ranking logic as feed once we have enough likes; can be a dedicated “recommended products” endpoint returning real items from the curated dataset, with buy link if available in metadata.

---

## 7. AI / personalization approach

- **Inputs:** Item metadata (category, style tags, color, etc.) and per-user swipe history (likes = right swipes).
- **MVP strategy:** (1) Store every swipe in BaaS. (2) Rank feed/recommendations with simple rules: e.g. prefer items whose tags/category overlap with liked items; or use a small embedding model (item → vector) and rank by similarity to a “user vector” (e.g. average of liked item vectors). Implement in a Supabase Edge Function (or similar) so the app only calls “get feed” / “get recommendations.”
- **Contract:** Input: `user_id`, `limit`, optional filters. Output: ordered list of item ids or full item payload. This doc does not specify a particular ML framework — only intent and data flow.
- **Later:** Fine-tuned model, “why you might like this” explanations, real brand APIs.

---

## 8. Screens and navigation

- **Pattern:** Tab-based main app (e.g. Swipe, My Style, Profile). Onboarding as a modal or initial stack before tabs.
- **Screens:**
  - **Splash / loading** — First paint and auth/session check.
  - **Onboarding** — Optional style preferences; then go to Swipe.
  - **Swipe** — Card stack of outfit/product images; swipe left/right; AI learns from each swipe.
  - **My Style** — Grid (or list) of liked items; optional “Recommended for you” section.
  - **Profile** — Account, theme (e.g. dark/light), about.
- **Navigation:** Expo Router (file-based routes). One-line purpose per screen is as above; exact route names can follow Expo Router conventions (e.g. `(tabs)/index`, `(tabs)/my-style`, `(tabs)/profile`, `onboarding`).

---

## 9. BaaS usage (Supabase)

- **Auth:** Email/password or OTP for MVP. User id from Auth links to profile and swipes. Optional: anonymous auth for “try before sign-up,” then convert to permanent account.
- **Data:** Tables (or equivalent): `profiles` (or extend Auth metadata), `items`, `swipes`. Use RLS so users only read/write their own swipes and profile; `items` read-only for app users.
- **Functions (API surface):**
  - **Feed** — Returns ordered list of items for the swipe feed (user-specific order once we have ranking). In: `user_id`, `limit`. Out: list of items.
  - **Submit swipe** — Writes one row to `swipes`. In: `user_id`, `item_id`, `direction`. Out: success/error.
  - **My Style** — Returns user’s liked items (right swipes + item details). In: `user_id`. Out: list of items.
  - **Recommendations** (optional) — Same as feed with “recommended” sort; can be same endpoint with a flag or a separate one. In: `user_id`, `limit`. Out: list of items.

Full request/response shapes can live in a separate API spec or in the repo.

---

## 10. Out of scope / later

- Real brand partnership integrations (direct APIs, revenue share).
- Advanced ML (custom training, A/B tests, full “why you like this” model).
- Offline-first sync, push notifications, and sharing (from requirements nice-to-have).
- Full schema DDL and detailed API request/response examples (can live in a separate doc or repo).

This high-level doc is the single place for *how* we build StyleSwipe; details can be refined in code and supporting specs as we go.
