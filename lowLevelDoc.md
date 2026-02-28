# StyleSwipe — Low-Level Implementation Document

This document is the **implementation-grade** specification for building StyleSwipe. It does not repeat product vision; for "what" and "why," see [requirements.md](requirements.md) and [highLevelDoc.md](highLevelDoc.md). Here we specify exact schemas, APIs, constants, policies, and UI behavior so backend, Edge Functions, and mobile app can be implemented with minimal ambiguity.

**How to use this doc:** Implement in order (schema first, then Edge Functions, then client), or by domain (tags → content → API → auth → UI). Cross-reference section numbers when wiring pieces together.

**Conventions:** All IDs are UUID (v4). Timestamps are ISO8601 in UTC. JSON examples use TypeScript-friendly shapes. All tag and enum values are lowercase unless stated otherwise.

---

## 1. Tag taxonomy

### 1.1 Complete tag schema

Only tags from the list below may be stored in `inspiration_items.tags` and `products.tags`. Any other value must be normalized to one of these or rejected.

| Category | Valid tags |
|----------|------------|
| **style** | minimalist, bohemian, streetwear, classic, romantic, edgy, preppy, sporty, vintage, modern, casual, formal, artsy, glam, scandinavian, japanese, french, american |
| **color** | black, white, navy, gray, beige, brown, red, pink, blue, green, yellow, orange, purple, multicolor, neutral, pastel, earth |
| **material** | cotton, denim, leather, silk, wool, linen, polyester, velvet, knit, fleece, satin, corduroy |
| **occasion** | casual, formal, workout, party, office, weekend, travel, date, beach, outdoor |
| **category** | tops, bottoms, dresses, outerwear, shoes, accessories, bags, activewear, swimwear, loungewear |
| **fit** | slim, oversized, relaxed, fitted, high-waist, low-rise, cropped, long, short |
| **pattern** | solid, striped, floral, graphic, plaid, animal, abstract, geometric, tie-dye |

**Total:** 18 + 17 + 12 + 10 + 10 + 9 + 9 = **85 tags**. Adjust by adding/removing within categories as needed; keep this table the single source of truth.

### 1.2 Tag assignment rules

- **Inspiration items:** May use all categories. Same taxonomy as products so that learned tag_scores apply to both feed and recommendations. No "price" or "brand" on inspiration (no buy link).
- **Products:** Same taxonomy. Shopify (or other source) tags must be **normalized** to this schema via mapping or rules (see Section 3.4).
- **Assignment method (MVP):**
  - **Inspiration:** Manual curation or seed script. Each row in the seed JSON/CSV must include a `tags` array with values only from the table above.
  - **Products:** From Shopify product `tags` and variant/metadata; normalized via mapping table or rule-based replacement before insert into `products`.

### 1.3 Learning constants and edge cases

**Constants (configurable via env or config table):**

| Constant | Value | Recommended range | Purpose |
|----------|--------|--------------------|---------|
| `LIKE_BOOST` | 0.15 | 0.1 – 0.25 | Add to tag_scores for each tag on the inspiration item when user swipes right |
| `SKIP_PENALTY` | 0.05 | 0.02 – 0.1 | Subtract from tag_scores for each tag when user swipes left |
| `DECAY_FACTOR` | 0.98 | 0.95 – 0.99 | Multiply all other tags by this after boost/penalty (so preferences decay slightly) |

**Order of operations on each swipe:**

1. Load inspiration item's `tags` and user's current `tag_scores` (default missing tags to 0).
2. **Decay:** For every key in `tag_scores`, multiply value by `DECAY_FACTOR` (0.98). Do this first.
3. **Boost or penalty:** For each tag in the inspiration item: if direction is `like`, add `LIKE_BOOST`; if `skip`, subtract `SKIP_PENALTY`.
4. **Clamp:** For every key in `tag_scores`, clamp to [0, 1]. If after step 3 a value &lt; 0, set to 0; if &gt; 1, set to 1.
5. Persist updated `tag_scores` to `profiles`.

**Edge cases:**

- Tag in inspiration item not yet in profile: treat as 0 before decay; after boost/penalty it becomes 0.15 (like) or 0 (skip, clamped).
- Empty tag_scores (new user): after first swipe, only the item's tags get non-zero scores; decay applies to "all other" (none), so no decay step for first swipe if desired, or decay an empty object is no-op.

**Style DNA derivation:**

- **Top 5 tags:** Sort `tag_scores` by value descending. Tie-break by tag string ascending (lexicographic). Take the first 5 entries. If fewer than 5 keys exist, return all (e.g. 2 or 3). This is **up to 5**, not exactly 5.
- **Minimum threshold (optional):** Only include tags with score ≥ 0.2. If using threshold, apply after sort; then take top 5 from the filtered list. Document in UI: "Your top style tags" with count "3 of 5" if only 3 above threshold.

---

## 2. Content pipeline

### 2.1 Inspiration item source

- **Source:** Curated dataset: e.g. internal CSV/JSON of outfit images (URLs or paths), or a subset of a public dataset (e.g. DeepFashion with proper licensing). No specific vendor required; any set of image URLs + tags works.
- **Minimum for demo:** 50–100 inspiration items so that with "exclude seen" the feed does not exhaust in one session.
- **How they get into `inspiration_items`:** MVP = **seed script**. A Node or Deno script reads a JSON file (or CSV) and inserts rows via Supabase client (service role) or raw SQL. No admin UI for MVP. Example: `scripts/seed-inspiration.ts` and `data/inspiration.json`.
- **Required fields per inspiration item:** `id` (uuid), `image_url` (text), `tags` (array of strings from taxonomy), `source` (text, optional), `created_at` (set by DB default).

### 2.2 Image hosting

- **Strategy:** **External URLs only** for MVP. Store `image_url` pointing to the source (e.g. CDN, S3, or dataset host). Optionally add Supabase Storage later for ingested images; for seed data, URLs are sufficient.
- **Fallback for dead URLs:** If an image fails to load in the app, show a **placeholder image** (e.g. bundled asset `assets/placeholder-card.png` or a constant URL). Do not remove the item from the feed automatically; optional: mark item as `broken_image` in a future column and exclude from feed.
- **Image specs:** Swipe cards: aspect ratio **4:5** (portrait). Product grid: **1:1** or 4:5. Recommended min width 400px for cards. Store URLs as-is; client uses `resizeMode="cover"` and fixed aspect ratio.

### 2.3 Mock / fallback dataset

**When fallback is used:** Edge Function checks: if `inspiration_items` is empty (or env `USE_MOCK_FEED=true`), return mock payload. Same for Recommendations: if `products` is empty or Shopify errors, return mock products.

**Exact format — Inspiration (mock):**

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "image_url": "https://example.com/placeholder-outfit-1.jpg",
      "tags": ["minimalist", "black", "casual"],
      "source": "mock"
    }
  ]
}
```

**Exact format — Products (mock):**

```json
{
  "items": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "title": "Classic Black Tee",
      "brand": "Mock Brand",
      "image_url": "https://example.com/placeholder-product-1.jpg",
      "price": "29.00",
      "buy_url": "https://example.com/product/1",
      "tags": ["minimalist", "black", "cotton", "tops"]
    }
  ]
}
```

Include at least 20 inspiration and 20 product mock records in repo under `data/mock-inspiration.json` and `data/mock-products.json`; Edge Functions read these from embedded JSON or fetch from a known path.

### 2.4 Content freshness

- **New inspiration:** MVP = one-time seed. Later: weekly or on-demand run of the seed script with new rows appended (no dedupe by URL required for MVP).
- **Recycling:** Swipe feed **never shows the same inspiration twice** to the same user. The feed query excludes `item_id` present in `swipes` for that `user_id`. When the user has seen all items, the feed returns an empty list; UI shows "No more inspiration for now" and optionally a CTA to invite more content later.

---

## 3. Shopify integration

### 3.1 API and credentials

- **API:** Shopify **Storefront API** (GraphQL) for product catalog and storefront URL. Version: **2024-01** (or current stable). Alternative: Admin API REST if we need admin-only fields; for MVP, Storefront API is sufficient for title, images, price, handle (for buy_url).
- **Credentials:** Store URL (e.g. `https://your-store.myshopify.com`), **Storefront API access token** (created in Shopify admin, with `unauthenticated_read_product_listings` scope). Stored in Supabase Edge Function secrets: `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_TOKEN`.
- **Rate limits:** Storefront API uses a leaky bucket (e.g. 60 points/sec). On 429, retry with exponential backoff (1s, 2s, 4s), max 3 retries. When Shopify is unreachable (timeout or 5xx): return **cached** products from `products` table if available; else return **mock products** (see 2.3) so the app never shows a hard error.

### 3.2 Product ingestion flow

- **How:** **Scheduled sync** via a cron-triggered Edge Function (e.g. `sync-shopify-products`) that runs daily. Function fetches products from Storefront API (first 100–250, paginated if needed), normalizes tags, and upserts into `products` by `external_id` (Shopify product id).
- **Frequency:** Every 24 hours. Idempotency: upsert on `external_id`; update `updated_at`, `title`, `image_url`, `price`, `buy_url`, `tags`.

### 3.3 Field mapping

| Shopify (Storefront API) | products column |
|--------------------------|------------------|
| `product.id` (GID) | `external_id` (strip `gid://shopify/Product/` prefix or store full GID) |
| `product.title` | `title` |
| `product.vendor` | `brand` |
| First `product.images.edges[0].node.url` | `image_url` |
| `product.variants.edges[0].node.price` | `price` (text or numeric) |
| `product.onlineStoreUrl` or `https://{store}/products/{handle}` | `buy_url` |
| `product.tags` (array) → normalized | `tags` (text[]) |
| — | `metadata` (optional jsonb: raw Shopify payload or extra fields) |

### 3.4 Tag normalization

- **Strategy:** **Rule-based mapping** plus lowercase/trim. Maintain a mapping object in code or DB: e.g. `{ "boho": "bohemian", "b&w": "black", "white": "white" }`. Steps: (1) lowercase, (2) trim, (3) replace by mapping table, (4) if result in StyleSwipe taxonomy, add to `tags` array; else **drop** (do not add unmapped tags). Unmapped tags are not stored; only taxonomy tags are allowed.

---

## 4. Full database schema (DDL)

### 4.1 Tables

```sql
-- Extend auth.users; profiles 1:1 with auth user
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  has_onboarded boolean NOT NULL DEFAULT false,
  tag_scores jsonb NOT NULL DEFAULT '{}',
  preferred_styles text[] NOT NULL DEFAULT '{}',
  preferred_colors text[] NOT NULL DEFAULT '{}',
  preferred_categories text[] NOT NULL DEFAULT '{}'
);

-- tag_scores shape: { "minimalist": 0.72, "black": 0.68, "casual": 0.5 }
COMMENT ON COLUMN public.profiles.tag_scores IS 'Map of tag string to affinity score in [0, 1]';

CREATE TABLE public.inspiration_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  image_url text NOT NULL,
  source text,
  tags text[] NOT NULL DEFAULT '{}'
);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  title text NOT NULL,
  brand text,
  image_url text NOT NULL,
  price text NOT NULL,
  buy_url text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  metadata jsonb DEFAULT '{}'
);

CREATE TYPE swipe_direction AS ENUM ('like', 'skip');

CREATE TABLE public.swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inspiration_items(id) ON DELETE CASCADE,
  direction swipe_direction NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);
```

### 4.2 Enums

- `swipe_direction`: `like`, `skip` (see DDL above).

### 4.3 Indexes

```sql
CREATE INDEX idx_swipes_user_id ON public.swipes(user_id);
CREATE INDEX idx_swipes_item_id ON public.swipes(item_id);
CREATE INDEX idx_swipes_user_item ON public.swipes(user_id, item_id);

CREATE INDEX idx_inspiration_items_tags ON public.inspiration_items USING GIN(tags);
CREATE INDEX idx_products_tags ON public.products USING GIN(tags);
CREATE INDEX idx_products_external_id ON public.products(external_id);
```

### 4.4 Tag column type and queries

- **Type:** `text[]` for both `inspiration_items.tags` and `products.tags`.
- **Containment:** "Item has tag X" → `'X' = ANY(tags)` or `tags @> ARRAY['X']::text[]`.
- **Ranking (average score):** In application code, load profile `tag_scores` and for each item compute `score = avg(profile.tag_scores[t] for t in item.tags, default 0)`. In SQL (e.g. in Edge Function): possible via LATERAL or a function that unnests item tags and joins to a key-value representation of tag_scores; for MVP, scoring in JS after fetching rows is acceptable.

---

## 5. API request/response contracts

**Base URL:** `https://<project_ref>.supabase.co/functions/v1/`

**Auth:** All endpoints require header `Authorization: Bearer <user_jwt>`. Validate JWT and ensure `user_id` in request equals `sub` from JWT; otherwise 403.

**Error body (all 4xx/5xx):** `{ "message": string, "code"?: string }`. Status codes: 400 (validation), 401 (missing/invalid token), 403 (forbidden), 404 (resource not found), 500 (server error).

### 5.1 Swipe feed

- **Method:** GET
- **Path:** `/swipe-feed` or `/feed`
- **Query:** `user_id` (uuid), `limit` (optional, default 20, max 50), `after_id` (optional, uuid for cursor).
- **Response 200:** `{ "items": InspirationItem[] }`

```ts
interface InspirationItem {
  id: string;
  image_url: string;
  tags: string[];
  source?: string;
}
```

**Pagination:** Cursor-based. Pass `after_id` = last item id from previous response to get the next page. Default limit 20, max 50.

### 5.2 Submit swipe

- **Method:** POST
- **Path:** `/submit-swipe`
- **Body:** `{ "user_id": string (uuid), "item_id": string (uuid), "direction": "like" | "skip" }`
- **Response 200:** `{ "ok": true }`. Do not return next item or updated tag_scores in response (client uses local queue and refetches feed when needed).

### 5.3 My Style

- **Method:** GET
- **Path:** `/my-style`
- **Query:** `user_id` (uuid)
- **Response 200:** `{ "items": InspirationItem[] }` (only items the user swiped `like` on). Order: most recent first. No pagination for MVP (or cap at 100).

### 5.4 Recommendations

- **Method:** GET
- **Path:** `/recommendations`
- **Query:** `user_id` (uuid), `limit` (optional, default 20, max 50)
- **Response 200:** `{ "items": Product[] }`

```ts
interface Product {
  id: string;
  title: string;
  brand: string | null;
  image_url: string;
  price: string;
  buy_url: string;
  tags: string[];
}
```

**Cold start:** When user has fewer than 5 swipes (or empty `tag_scores`), return **random** products (or order by `created_at` desc) so the Recommendations page is never empty. Optionally seed from `preferred_styles` / `preferred_colors` if onboarding was completed: score products by overlap with preferred_* and then sort; otherwise random.

**Pagination:** Offset: `offset` (default 0), `limit` (default 20, max 50). Or cursor by `id`; document one approach (e.g. offset for MVP).

---

## 6. Edge Function logic

### 6.1 Swipe feed ranking (pseudocode)

```
1. Validate JWT; set userId = JWT.sub. Reject if query.user_id != userId.
2. Load profile for userId (tag_scores). If none, create default profile with tag_scores = {}.
3. Get seen item_ids: SELECT item_id FROM swipes WHERE user_id = userId.
4. Query: SELECT * FROM inspiration_items WHERE id != ALL(seen_ids) ORDER BY ... LIMIT limit.
   Scoring (in app logic after fetch if needed):
   - For each inspiration_items row: score = average(profile.tag_scores[t] for t in item.tags, default 0).
   - Sort by score DESC. If tag_scores empty, sort by random() or created_at DESC.
5. Return { items: sortedAndLimitedRows }.
```

**Formula:** `score(item) = (1/|item.tags|) * sum(profile.tag_scores[t] ?? 0 for t in item.tags)`. Items with no tags: score 0.

### 6.2 Recommendations ranking (pseudocode)

```
1. Validate JWT; userId = JWT.sub.
2. Load profile (tag_scores).
3. If tag_scores empty or user has < 5 swipes: return products ORDER BY random() LIMIT limit (cold start).
4. Else: load all products (or paginated); for each, score = average(profile.tag_scores[t] ?? 0 for t in product.tags). Missing tags use 0.
5. Sort by score DESC; return top limit.
```

### 6.3 Already-seen exclusion

- Query: `WHERE id NOT IN (SELECT item_id FROM swipes WHERE user_id = $1)`. Index on `(user_id, item_id)` makes the subquery efficient. For MVP no limit on subquery size; if swipes table grows very large, consider `WHERE id NOT IN (SELECT item_id FROM swipes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5000)` to bound work.

### 6.4 Tag score update transaction

```
1. BEGIN.
2. INSERT INTO swipes (user_id, item_id, direction) VALUES ($userId, $itemId, $direction) ON CONFLICT (user_id, item_id) DO NOTHING (or UPDATE direction); if conflict and already swiped, optionally skip profile update.
3. SELECT tags FROM inspiration_items WHERE id = $itemId.
4. SELECT tag_scores FROM profiles WHERE id = $userId FOR UPDATE.
5. In JS: apply decay, then boost/penalty, then clamp (see 1.3). Build new tag_scores JSON.
6. UPDATE profiles SET tag_scores = $newScores, updated_at = now() WHERE id = $userId.
7. COMMIT.
```

Concurrent swipes: last-write-wins per profile row. We do not merge concurrent updates for MVP.

### 6.5 Edge Function execution context

- Edge Functions call Supabase Postgres via **service role** key (bypass RLS). Always validate that `user_id` in request body/query equals JWT `sub`; never trust client to act for another user. Reject with 403 if mismatch.

---

## 7. Auth flows and RLS policies

### 7.1 Auth flow

- **Signup:** `supabase.auth.signUp({ email, password })`. Confirm email if required by project settings.
- **Login:** `supabase.auth.signInWithPassword({ email, password })`.
- **Session:** Stored on device by Supabase client; refresh token used to get new access token automatically. Default session duration follows Supabase (e.g. 1 hour access token, longer refresh). No custom expiry for MVP.
- **Persistence:** Supabase client persists session in secure storage (e.g. AsyncStorage or Keychain); app restores session on launch.

### 7.2 Anonymous auth

- **MVP:** Optional. If enabled: `signInAnonymously()`. User can swipe and build profile. **Account conversion:** When user adds email/password, use `linkIdentity` (or updateUser) so the same auth user gets an email; no data migration needed because profile and swipes are already keyed by that user id. If we required a new sign-up (new user id), we would need to migrate swipes and profile from anonymous id to new id in a transaction; for MVP, prefer anonymous + link so no migration.
- If anonymous not enabled: require sign-up or login before accessing Discover; show auth gate on app open when no session.

### 7.3 RLS policies

```sql
-- profiles: user can only read/write own row
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- inspiration_items: read-only for authenticated
ALTER TABLE public.inspiration_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspiration_select" ON public.inspiration_items FOR SELECT TO authenticated USING (true);

-- products: read-only for authenticated
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated USING (true);

-- swipes: user can select and insert own only
ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "swipes_select_own" ON public.swipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "swipes_insert_own" ON public.swipes FOR INSERT WITH CHECK (auth.uid() = user_id);
-- No UPDATE/DELETE for MVP (or add DELETE for "remove from My Style" later).
```

### 7.4 Edge Function auth

- Request header `Authorization: Bearer <jwt>`. Verify JWT with Supabase; extract `sub`. Compare to `user_id` in body/query; if different, return 403. Internal DB calls use service role key only; RLS is bypassed in Edge Functions.

### 7.5 Logout

- Client: `supabase.auth.signOut()`. Clear local caches (React Query cache, any in-memory feed queue, AsyncStorage keys for feed/recommendations if stored). Supabase invalidates the session server-side on signOut. No token blacklist for MVP.

---

## 8. UI / component breakdown

### 8.1 Screen list

| Screen | Route (Expo Router) | Data fetched | Supabase / Edge Function |
|--------|---------------------|--------------|---------------------------|
| Splash | `(tabs)/` or root | Session check | `supabase.auth.getSession()` |
| Onboarding Welcome | `onboarding/index` | — | — |
| Style Picker | `onboarding/style` | — | — |
| Color Picker | `onboarding/color` | — | — |
| Category Picker | `onboarding/category` | — | — |
| Discover (swipe) | `(tabs)/index` | Inspiration feed | GET swipe-feed; POST submit-swipe on each swipe |
| My Style | `(tabs)/my-style` | Liked inspiration | GET my-style |
| Recommendations | `(tabs)/recommendations` | Shoppable products | GET recommendations |
| Profile | `(tabs)/profile` | Profile | `supabase.from('profiles').select().eq('id', user.id).single()` |

On completion of onboarding (Complete or Skip): upsert profile via `supabase.from('profiles').upsert(...)`.

### 8.2 Swipe card component

- **Libraries:** `react-native-gesture-handler` + `react-native-reanimated`.
- **Gesture:** Pan gesture on top card. Drag right → card follows with rotation (e.g. +15° at full drag); drag left → -15°. Release: if velocity &gt; **400** to the right → trigger "like" and animate card off to the right; if velocity &lt; -400 to the left → trigger "skip" and animate off to the left; else spring back to center.
- **Animation:** Duration ~200ms for exit; spring config (e.g. damping 15, stiffness 150) for snap-back. Opacity of next card: scale from 0.95 to 1 when it becomes top.
- **Stack:** Pre-render **3** cards (top interactive, next 2 below). Top card has gesture handler; on swipe, remove from local queue and show next. Refill queue when remaining &lt; 3 (call swipe-feed again with cursor or next batch).
- **Dimensions:** Card width = screen width minus padding (e.g. 24); aspect ratio 4:5 for height.

### 8.3 Onboarding detail

- **Welcome:** No write. "Skip" → set has_onboarded = true, preferred_* = [], navigate to Discover. "Next" → navigate to Style Picker.
- **Style Picker:** Multi-select from style tags (e.g. minimalist, streetwear, …). Write to `preferred_styles` on "Complete" (or pass to next screen and write at end).
- **Color Picker:** Multi-select from color tags. → `preferred_colors`.
- **Category Picker:** Multi-select from category tags. → `preferred_categories`.
- **On Complete:** Upsert profile: `has_onboarded = true`, `preferred_styles`, `preferred_colors`, `preferred_categories`. Optionally seed `tag_scores`: for each tag in preferred_*, set tag_scores[tag] = 0.5 (or 0.3). On Skip (from any screen): has_onboarded = true, preferred_* = [], tag_scores = {}.
- **Supabase call:** `supabase.from('profiles').upsert({ id: user.id, has_onboarded: true, preferred_styles: [...], ... }, { onConflict: 'id' })`.

### 8.4 Recommendations page layout

- **Layout:** **Grid**, 2 columns. Card: image (aspect 1:1 or 4:5), brand (small text), title (one line), price, "Buy Now" button.
- **Buy Now:** Open `product.buy_url` with `Linking.openURL(buy_url)` (system browser) or `expo-web-browser.openBrowserAsync(buy_url)` (in-app). Document choice: **in-app browser** for MVP so user stays in app. No affiliate append for MVP unless specified.

### 8.5 Loading, empty, and error states

- **Discover:** Loading = full-screen skeleton or spinner. Empty = "No more inspiration for now" + illustration/CTA. Error = "Something went wrong" + Retry button.
- **My Style:** Loading = grid skeleton. Empty = "Nothing saved yet — start swiping" + link to Discover. Error = Retry.
- **Recommendations:** Loading = grid skeleton. Empty = "Swipe more to get recommendations" (cold start returns items, so empty only if products table empty). Error = Retry; optionally show mock products as fallback.
- **Onboarding:** Error on profile save = inline message under button + "Try again".
- **Profile:** Error on load = Retry.

---

## 9. Client state management and data flow

- **Profile:** Stored in Supabase; on app load fetch once and cache in React Query (or Zustand). Refetch after onboarding complete and optionally after each swipe if we want Style DNA to update live in My Style (or refetch when user navigates to My Style).
- **Feed queue (Discover):** Client state (useState or Zustand): array of inspiration items. On mount: GET swipe-feed, set queue. On swipe: POST submit-swipe, remove top item from queue optimistically. When queue length &lt; 3: GET swipe-feed again (with cursor if supported), append to queue.
- **Recommendations:** Fetch on tab focus (or once when Recommendations tab is first opened). Cache with React Query; stale time e.g. 5 minutes so revisiting tab doesn’t refetch every time.
- **My Style:** Fetch when tab is focused; or cache and invalidate when user returns from Discover (optional).

---

## 10. Environment and configuration

**Expo (client):**

- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key.

**Supabase Edge Functions (secrets):**

- `SUPABASE_SERVICE_ROLE_KEY` — For DB access from Edge Functions.
- `SHOPIFY_STORE_DOMAIN` — e.g. `your-store.myshopify.com`.
- `SHOPIFY_STOREFRONT_TOKEN` — Storefront API access token.
- Optional: `USE_MOCK_FEED` — if "true", return mock data from feed/recommendations.

Set via Supabase Dashboard → Project Settings → Edge Functions → Secrets. Do not commit secrets to repo; use `.env.example` with placeholder values.

---

## 11. Error handling and logging

**Client:**

- Network error (fetch failed): Show "Check your connection" + Retry. 401: Redirect to login or show auth modal. 4xx/5xx: Show generic "Something went wrong" + Retry. Log full error to console in __DEV__; in production optionally send to crash reporting (e.g. Sentry).

**Edge Functions:**

- Log every request (request id, user_id, path) and every error (message, stack). Return 4xx for validation/auth errors, 5xx only for unexpected errors. Log format: `{ "requestId": "...", "userId": "...", "error": "..." }`. Logs visible in Supabase Dashboard → Edge Functions → Logs.

---

## 12. Testing approach

- **Unit (MVP):** Tag score update: given current tag_scores, item tags, direction → assert new tag_scores (decay, boost/penalty, clamp). Style DNA: given tag_scores → assert top 5 order and tie-break.
- **Integration:** Edge Function swipe-feed: with seeded inspiration_items and swipes, assert returned items exclude seen and are ordered by score. Submit-swipe: assert swipes row inserted and profile tag_scores updated.
- **E2E (optional):** One flow: open app → complete or skip onboarding → swipe 2–3 items → open My Style → open Recommendations → tap Buy Now. Use Detox or Maestro; document in repo.
- **Where tests live:** Edge Functions: `/supabase/functions/<name>/` or repo root `tests/functions/`. Client: `__tests__/` or `*.test.tsx` next to components.

---

## 13. Deployment and environments

- **Supabase:** One project per environment (e.g. `styleswipe-dev`, `styleswipe-prod`). Run migrations via `supabase db push` or by executing SQL in Dashboard.
- **Edge Functions:** Deploy with `supabase functions deploy <name>`. Cron for sync-shopify-products: configure in Dashboard (e.g. daily at 2am UTC).
- **Expo:** EAS Build for iOS/Android; submit to TestFlight and Play Store. Env vars set in EAS secrets or `.env` per environment.
- **CI:** Optional — on push to main, run unit and integration tests; deploy Edge Functions on tag/release.

---

## 14. Performance and security checklist

**Performance:**

- Feed and Recommendations: default limit 20, max 50. Index on swipes (user_id, item_id). My Style: single query with join (swipes + inspiration_items), no N+1. Consider caching product list in Edge Function for 5–10 min if Shopify is slow.

**Security:**

- RLS enabled on all tables. Edge Function validates user_id = JWT sub. No PII in logs (no email in logs; user_id ok). HTTPS only. Anon key in client; service role only in Edge Functions and never in client. No secrets in repo.

---

This low-level document, together with [highLevelDoc.md](highLevelDoc.md) and [requirements.md](requirements.md), is sufficient to implement StyleSwipe end-to-end with minimal ambiguity.
