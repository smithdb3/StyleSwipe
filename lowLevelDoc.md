# StyleSwipe — Low-Level Implementation Document

This document is the **implementation-grade** specification for building StyleSwipe. It does not repeat product vision; for "what" and "why," see [requirements.md](requirements.md) and [highLevelDoc.md](highLevelDoc.md). Here we specify exact schemas, APIs, constants, policies, and UI behavior so backend, Edge Functions, and mobile app can be implemented with minimal ambiguity.

**How to use this doc:** Follow the Quick Start section first, then implement by phase (Foundation → Backend → Client → Testing). Or skip to specific sections by domain (tags → content → API → auth → UI). Cross-reference section numbers when wiring pieces together.

**Conventions:** All IDs are UUID (v4). Timestamps are ISO8601 in UTC. JSON examples use TypeScript-friendly shapes. All tag and enum values are lowercase unless stated otherwise.

---

## 0. Quick Start (5 min checklist)

**Use this to bootstrap a working demo in the shortest time:**

- [ ] Create Supabase project (`styleswipe-dev`)
- [ ] Copy/paste schema from section 4.1 into SQL editor
- [ ] Copy/paste RLS policies from section 7.3
- [ ] Deploy mock data (section 2.3 JSON) via SQL or seed script
- [ ] Deploy Edge Function skeleton (sections 6.1–6.4)
- [ ] Set environment secrets (section 10)
- [ ] Test: `curl -H "Authorization: Bearer $JWT" https://.../functions/v1/swipe-feed?user_id=YOUR_UUID&limit=5`
- [ ] Wire client to Edge Functions (section 8 + examples)

**First working feature:** Swipe feed returning 5 inspiration items, no ranking needed yet.

---

## 1. Implementation Sequence

**Follow this order to minimize blockers and build incrementally.**

### Phase 1: Foundation (Day 1)
**Outcome:** Database ready, mock data loaded, auth working.

1. **Supabase project setup**
   - Create project on `supabase.com`
   - Copy URL and keys to `.env.local`
   - Enable email/password auth in Supabase Dashboard

2. **Database schema + migrations**
   - Use SQL editor in Dashboard to run schema from section 4.1
   - Verify tables appear: `profiles`, `inspiration_items`, `products`, `swipes`
   - Create indexes from section 4.3

3. **RLS policies**
   - Enable RLS on all tables (section 7.3)
   - Test: As anonymous user, verify cannot access `swipes` or `profiles`

4. **Mock data seeding**
   - Copy mock JSON from section 2.3 & Appendix A
   - Run seed script (section A.1) or manually insert via SQL
   - Verify: `SELECT COUNT(*) FROM inspiration_items;` should return ≥ 20

5. **Auth test**
   - Signup user via Supabase CLI or SDK
   - Verify profile auto-created (if trigger implemented) or manually insert
   - Store JWT locally for testing

### Phase 2: Backend logic (Days 2–3)
**Outcome:** All Edge Functions deployed, tag scoring working.

6. **Edge Function: swipe-feed**
   - Create `supabase/functions/swipe-feed/`
   - Implement from section 6.1 (start with pseudocode, then add ranking)
   - Deploy: `supabase functions deploy swipe-feed`
   - Test: `curl -H "Authorization: Bearer $JWT" https://.../functions/v1/swipe-feed?user_id=UUID`

7. **Tag score update logic (helper)**
   - Implement `updateTagScores()` function (section A.2)
   - Write unit tests (section 12)
   - Verify: decay, boost/penalty, clamp work correctly

8. **Edge Function: submit-swipe**
   - Create `supabase/functions/submit-swipe/`
   - Implement from section 6.4 (insert swipe + update profile)
   - Use helper from step 7
   - Test: POST swipe, verify `profiles.tag_scores` updated

9. **Edge Function: my-style**
   - Create `supabase/functions/my-style/`
   - Query: `SELECT * FROM swipes WHERE user_id=$1 AND direction='like' JOIN inspiration_items`
   - Test: GET after liking items

10. **Edge Function: recommendations**
    - Create `supabase/functions/recommendations/`
    - Implement scoring and ranking from section 6.2
    - Handle cold start (random if < 5 swipes)
    - Return products sorted by score

11. **Shopify integration (optional for MVP, but useful for demo)**
    - Create `supabase/functions/sync-shopify-products/`
    - Implement GraphQL query from section A.3
    - Test manually: `supabase functions invoke sync-shopify-products`
    - (Skip if using mock products only)

### Phase 3: Client (Days 4–5)
**Outcome:** Mobile app wired to Edge Functions, swipe flow working.

12. **Auth screens (signup/login)**
    - Supabase client setup
    - Email/password signup + login screens
    - Session persistence (AsyncStorage)

13. **Onboarding flow**
    - Welcome, Style Picker, Color Picker, Category Picker screens
    - Save to profile (section 8.3)

14. **Swipe card component**
    - react-native-gesture-handler + react-native-reanimated
    - Implement gesture + animation (section 8.2)
    - Test: drag left/right with velocity detection

15. **Discover screen (swipe feed)**
    - Call `GET /swipe-feed` on mount
    - Post to `/submit-swipe` on each swipe
    - Queue management (section 9)

16. **My Style screen**
    - Call `GET /my-style`
    - Display grid of liked inspiration
    - Show Style DNA (top 5 tags)

17. **Recommendations screen**
    - Call `GET /recommendations`
    - Display product grid
    - "Buy Now" opens product URL (in-app browser)

18. **Profile screen**
    - Logout, theme toggle, account info

### Phase 4: Testing & polish (Day 6)
**Outcome:** Tests passing, no obvious bugs, ready for demo.

19. **Unit tests**
    - Tag score update logic (section 12)
    - Style DNA derivation
    - Tag normalization (if implemented)

20. **Integration tests**
    - Swipe feed with mock data
    - Submit swipe + profile update
    - My Style + Recommendations

21. **E2E flow test**
    - Full user journey: login → onboarding → swipe → My Style → Recommendations

22. **Polish & edge cases**
    - Empty states (section 8.5)
    - Error handling (section 11)
    - Placeholder images for dead URLs

---

## 2. Tag taxonomy

### 2.1 Complete tag schema

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

### 2.2 Tag assignment rules

- **Inspiration items:** May use all categories. Same taxonomy as products so that learned tag_scores apply to both feed and recommendations. No "price" or "brand" on inspiration (no buy link).
- **Products:** Same taxonomy. Shopify (or other source) tags must be **normalized** to this schema via mapping or rules (see Section 3.4).
- **Assignment method (MVP):**
  - **Inspiration:** Manual curation or seed script. Each row in the seed JSON/CSV must include a `tags` array with values only from the table above.
  - **Products:** From Shopify product `tags` and variant/metadata; normalized via mapping table or rule-based replacement before insert into `products`.

### 2.3 Learning constants and edge cases

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
4. **Clamp:** For every key in `tag_scores`, clamp to [0, 1]. If after step 3 a value < 0, set to 0; if > 1, set to 1.
5. Persist updated `tag_scores` to `profiles`.

**Edge cases:**

- Tag in inspiration item not yet in profile: treat as 0 before decay; after boost/penalty it becomes 0.15 (like) or 0 (skip, clamped).
- Empty tag_scores (new user): after first swipe, only the item's tags get non-zero scores; decay applies to "all other" (none), so no decay step for first swipe if desired, or decay an empty object is no-op.

**Style DNA derivation:**

- **Top 5 tags:** Sort `tag_scores` by value descending. Tie-break by tag string ascending (lexicographic). Take the first 5 entries. If fewer than 5 keys exist, return all (e.g. 2 or 3). This is **up to 5**, not exactly 5.
- **Minimum threshold (optional):** Only include tags with score ≥ 0.2. If using threshold, apply after sort; then take top 5 from the filtered list. Document in UI: "Your top style tags" with count "3 of 5" if only 3 above threshold.

---

## 3. Content pipeline

### 3.1 Inspiration item source

- **Source:** Curated dataset: e.g. internal CSV/JSON of outfit images (URLs or paths), or a subset of a public dataset (e.g. DeepFashion with proper licensing). No specific vendor required; any set of image URLs + tags works.
- **Minimum for demo:** 50–100 inspiration items so that with "exclude seen" the feed does not exhaust in one session.
- **How they get into `inspiration_items`:** MVP = **seed script**. A Node or Deno script reads a JSON file (or CSV) and inserts rows via Supabase client (service role) or raw SQL. No admin UI for MVP. Example: `scripts/seed-inspiration.ts` and `data/inspiration.json`.
- **Required fields per inspiration item:** `id` (uuid), `image_url` (text), `tags` (array of strings from taxonomy), `source` (text, optional), `created_at` (set by DB default).

### 3.2 Image hosting

- **Strategy:** **External URLs only** for MVP. Store `image_url` pointing to the source (e.g. CDN, S3, or dataset host). Optionally add Supabase Storage later for ingested images; for seed data, URLs are sufficient.
- **Fallback for dead URLs:** If an image fails to load in the app, show a **placeholder image** (e.g. bundled asset `assets/placeholder-card.png` or a constant URL). Do not remove the item from the feed automatically; optional: mark item as `broken_image` in a future column and exclude from feed.
- **Image specs:** Swipe cards: aspect ratio **4:5** (portrait). Product grid: **1:1** or 4:5. Recommended min width 400px for cards. Store URLs as-is; client uses `resizeMode="cover"` and fixed aspect ratio.

### 3.3 Mock / fallback dataset

**When fallback is used:** Edge Function checks: if `inspiration_items` is empty (or env `USE_MOCK_FEED=true`), return mock payload. Same for Recommendations: if `products` is empty or Shopify errors, return mock products.

**Exact format — Inspiration (mock):**

See **Appendix A: Seed Data** for full 20+ item examples. Quick example:

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "image_url": "https://example.com/minimal-tee.jpg",
      "tags": ["minimalist", "black", "cotton", "tops", "casual"],
      "source": "mock"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "image_url": "https://example.com/boho-dress.jpg",
      "tags": ["bohemian", "multicolor", "silk", "dresses", "romantic"],
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

### 3.4 Content freshness

- **New inspiration:** MVP = one-time seed. Later: weekly or on-demand run of the seed script with new rows appended (no dedupe by URL required for MVP).
- **Recycling:** Swipe feed **never shows the same inspiration twice** to the same user. The feed query excludes `item_id` present in `swipes` for that `user_id`. When the user has seen all items, the feed returns an empty list; UI shows "No more inspiration for now" and optionally a CTA to invite more content later.

---

## 4. Shopify integration

### 4.1 API and credentials

- **API:** Shopify **Storefront API** (GraphQL) for product catalog and storefront URL. Version: **2024-01** (or current stable). Alternative: Admin API REST if we need admin-only fields; for MVP, Storefront API is sufficient for title, images, price, handle (for buy_url).
- **Credentials:** Store URL (e.g. `https://your-store.myshopify.com`), **Storefront API access token** (created in Shopify admin, with `unauthenticated_read_product_listings` scope). Stored in Supabase Edge Function secrets: `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_TOKEN`.
- **Rate limits:** Storefront API uses a leaky bucket (e.g. 60 points/sec). On 429, retry with exponential backoff (1s, 2s, 4s), max 3 retries. When Shopify is unreachable (timeout or 5xx): return **cached** products from `products` table if available; else return **mock products** (see 3.3) so the app never shows a hard error.

### 4.2 Product ingestion flow

- **How:** **Scheduled sync** via a cron-triggered Edge Function (e.g. `sync-shopify-products`) that runs daily. Function fetches products from Storefront API (first 100–250, paginated if needed), normalizes tags, and upserts into `products` by `external_id` (Shopify product id).
- **Frequency:** Every 24 hours. Idempotency: upsert on `external_id`; update `updated_at`, `title`, `image_url`, `price`, `buy_url`, `tags`.

### 4.3 Field mapping

| Shopify (Storefront API) | products column |
|--------------------------|------------------|
| `product.id` (GID) | `external_id` (strip `gid://shopify/Product/` prefix or store full GID) |
| `product.title` | `title` |
| `product.vendor` | `brand` |
| First `product.images.edges[0].node.url` | `image_url` |
| `product.variants.edges[0].node.priceV2.amount` | `price` (text or numeric) |
| `product.onlineStoreUrl` or `https://{store}/products/{handle}` | `buy_url` |
| `product.tags` (array) → normalized | `tags` (text[]) |
| — | `metadata` (optional jsonb: raw Shopify payload or extra fields) |

### 4.4 Tag normalization

- **Strategy:** **Rule-based mapping** plus lowercase/trim. Maintain a mapping object in code or DB (see Appendix B for example). Steps:
  1. Lowercase and trim Shopify tag
  2. Replace by mapping table
  3. If result in StyleSwipe taxonomy, add to `tags` array
  4. Else **drop** (do not add unmapped tags)

**Example mapping object:**

```json
{
  "boho": "bohemian",
  "bohemian": "bohemian",
  "street-wear": "streetwear",
  "streetwear": "streetwear",
  "b&w": "black",
  "black_white": "black",
  "casual_wear": "casual",
  "multi-colored": "multicolor",
  "colorful": "multicolor",
  "denim_jean": "denim"
}
```

---

## 5. Full database schema (DDL)

### 5.1 Tables

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

### 5.2 Enums

- `swipe_direction`: `like`, `skip` (see DDL above).

### 5.3 Indexes

```sql
CREATE INDEX idx_swipes_user_id ON public.swipes(user_id);
CREATE INDEX idx_swipes_item_id ON public.swipes(item_id);
CREATE INDEX idx_swipes_user_item ON public.swipes(user_id, item_id);

CREATE INDEX idx_inspiration_items_tags ON public.inspiration_items USING GIN(tags);
CREATE INDEX idx_products_tags ON public.products USING GIN(tags);
CREATE INDEX idx_products_external_id ON public.products(external_id);
```

### 5.4 Tag column type and queries

- **Type:** `text[]` for both `inspiration_items.tags` and `products.tags`.
- **Containment:** "Item has tag X" → `'X' = ANY(tags)` or `tags @> ARRAY['X']::text[]`.
- **Ranking (average score):** In application code, load profile `tag_scores` and for each item compute `score = avg(profile.tag_scores[t] for t in item.tags, default 0)`. In SQL (e.g. in Edge Function): possible via LATERAL or a function that unnests item tags and joins to a key-value representation of tag_scores; for MVP, scoring in JS after fetching rows is acceptable.

---

## 6. API request/response contracts

**Base URL:** `https://<project_ref>.supabase.co/functions/v1/`

**Auth:** All endpoints require header `Authorization: Bearer <user_jwt>`. Validate JWT and ensure `user_id` in request equals `sub` from JWT; otherwise 403.

**Error body (all 4xx/5xx):** `{ "message": string, "code"?: string }`. Status codes: 400 (validation), 401 (missing/invalid token), 403 (forbidden), 404 (resource not found), 500 (server error).

### 6.1 Swipe feed

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

### 6.2 Submit swipe

- **Method:** POST
- **Path:** `/submit-swipe`
- **Body:** `{ "user_id": string (uuid), "item_id": string (uuid), "direction": "like" | "skip" }`
- **Response 200:** `{ "ok": true }`. Do not return next item or updated tag_scores in response (client uses local queue and refetches feed when needed).

### 6.3 My Style

- **Method:** GET
- **Path:** `/my-style`
- **Query:** `user_id` (uuid)
- **Response 200:** `{ "items": InspirationItem[] }` (only items the user swiped `like` on). Order: most recent first. No pagination for MVP (or cap at 100).

### 6.4 Recommendations

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

## 7. Edge Function logic

### 7.1 Swipe feed ranking (TypeScript skeleton)

```typescript
// supabase/functions/swipe-feed/index.ts
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "../_shared/cors.ts";

export default async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Validate JWT
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const afterId = url.searchParams.get("after_id");

    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Missing authorization header");

    const jwt = authHeader.replace("Bearer ", "");
    const { data: decoded, error: jwtError } = await verifyJWT(jwt);
    if (jwtError || decoded.sub !== userId) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Initialize Supabase client with service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
    );

    // 3. Load profile (tag_scores)
    const { data: profile } = await supabase
      .from("profiles")
      .select("tag_scores")
      .eq("id", userId)
      .single();

    const tagScores = profile?.tag_scores || {};

    // 4. Get seen item_ids
    const { data: seenData } = await supabase
      .from("swipes")
      .select("item_id")
      .eq("user_id", userId)
      .limit(5000); // Bound to avoid large subquery

    const seenIds = seenData?.map((s: any) => s.item_id) || [];

    // 5. Fetch unseen inspiration items
    let query = supabase
      .from("inspiration_items")
      .select("*")
      .limit(limit);

    if (seenIds.length > 0) {
      query = query.not("id", "in", `(${seenIds.map((id) => `'${id}'`).join(",")})`);
    }

    const { data: items } = await query;

    // 6. Score and sort (in JavaScript)
    const scored = items.map((item: any) => ({
      ...item,
      score: scoreItem(item, tagScores),
    }));

    scored.sort((a, b) => b.score - a.score);

    const result = scored.map((item: any) => ({
      id: item.id,
      image_url: item.image_url,
      tags: item.tags,
      source: item.source,
    }));

    return new Response(JSON.stringify({ items: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("swipe-feed error:", error);
    return new Response(
      JSON.stringify({ message: error.message, code: "FEED_ERROR" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

// Helper: score an item by average tag affinity
function scoreItem(item: any, tagScores: any): number {
  if (!item.tags || item.tags.length === 0) return 0;
  const sum = item.tags.reduce((acc: number, tag: string) => {
    return acc + (tagScores[tag] ?? 0);
  }, 0);
  return sum / item.tags.length;
}

// Stub: verifyJWT should decode and verify JWT with Supabase
async function verifyJWT(jwt: string) {
  // Use Supabase JWT verification or a library
  // For now, a stub
  return { data: { sub: "user-id" }, error: null };
}
```

### 7.2 Recommendations ranking (pseudocode)

```
1. Validate JWT; userId = JWT.sub.
2. Load profile (tag_scores).
3. Count swipes for user.
4. If tag_scores empty or user has < 5 swipes: return products ORDER BY random() LIMIT limit (cold start).
5. Else: load all products (or paginated); for each, score = average(profile.tag_scores[t] ?? 0 for t in product.tags). Missing tags use 0.
6. Sort by score DESC; return top limit.
```

### 7.3 Already-seen exclusion

- Query: `WHERE id NOT IN (SELECT item_id FROM swipes WHERE user_id = $1)`. Index on `(user_id, item_id)` makes the subquery efficient. For MVP no limit on subquery size; if swipes table grows very large, consider `WHERE id NOT IN (SELECT item_id FROM swipes WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5000)` to bound work.

### 7.4 Tag score update transaction

```typescript
// Core logic for updating tag scores (extracted into helper function)
export function updateTagScores(
  currentScores: Record<string, number>,
  itemTags: string[],
  direction: "like" | "skip",
  likeBoost = 0.15,
  skipPenalty = 0.05,
  decayFactor = 0.98
): Record<string, number> {
  const newScores = { ...currentScores };

  // 1. Decay all existing tags
  Object.keys(newScores).forEach((tag) => {
    newScores[tag] = newScores[tag] * decayFactor;
  });

  // 2. Apply boost or penalty to item tags
  itemTags.forEach((tag) => {
    if (!newScores[tag]) newScores[tag] = 0;
    if (direction === "like") {
      newScores[tag] += likeBoost;
    } else {
      newScores[tag] -= skipPenalty;
    }
  });

  // 3. Clamp to [0, 1]
  Object.keys(newScores).forEach((tag) => {
    newScores[tag] = Math.max(0, Math.min(1, newScores[tag]));
  });

  return newScores;
}
```

**Transaction in Edge Function:**

```typescript
// In submit-swipe Edge Function
async function submitSwipe(userId, itemId, direction) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. BEGIN (Supabase manages this)
  // 2. Insert swipe
  await supabase.from("swipes").insert({
    user_id: userId,
    item_id: itemId,
    direction: direction,
  });

  // 3. Get item tags
  const { data: item } = await supabase
    .from("inspiration_items")
    .select("tags")
    .eq("id", itemId)
    .single();

  // 4. Get profile with lock (FOR UPDATE)
  const { data: profile } = await supabase
    .from("profiles")
    .select("tag_scores")
    .eq("id", userId)
    .single();

  // 5. Update tag_scores
  const newScores = updateTagScores(
    profile.tag_scores || {},
    item.tags,
    direction
  );

  // 6. Update profile
  await supabase
    .from("profiles")
    .update({ tag_scores: newScores, updated_at: new Date() })
    .eq("id", userId);

  // 7. COMMIT (automatic)
  return { ok: true };
}
```

Concurrent swipes: last-write-wins per profile row. We do not merge concurrent updates for MVP.

### 7.5 Edge Function execution context

- Edge Functions call Supabase Postgres via **service role** key (bypass RLS). Always validate that `user_id` in request body/query equals JWT `sub`; never trust client to act for another user. Reject with 403 if mismatch.

---

## 8. Auth flows and RLS policies

### 8.1 Auth flow

- **Signup:** `supabase.auth.signUp({ email, password })`. Confirm email if required by project settings.
- **Login:** `supabase.auth.signInWithPassword({ email, password })`.
- **Session:** Stored on device by Supabase client; refresh token used to get new access token automatically. Default session duration follows Supabase (e.g. 1 hour access token, longer refresh). No custom expiry for MVP.
- **Persistence:** Supabase client persists session in secure storage (e.g. AsyncStorage or Keychain); app restores session on launch.

### 8.2 Anonymous auth

- **MVP:** Optional. If enabled: `signInAnonymously()`. User can swipe and build profile. **Account conversion:** When user adds email/password, use `linkIdentity` (or updateUser) so the same auth user gets an email; no data migration needed because profile and swipes are already keyed by that user id. If we required a new sign-up (new user id), we would need to migrate swipes and profile from anonymous id to new id in a transaction; for MVP, prefer anonymous + link so no migration.
- If anonymous not enabled: require sign-up or login before accessing Discover; show auth gate on app open when no session.

### 8.3 RLS policies

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

### 8.4 Edge Function auth

- Request header `Authorization: Bearer <jwt>`. Verify JWT with Supabase; extract `sub`. Compare to `user_id` in body/query; if different, return 403. Internal DB calls use service role key only; RLS is bypassed in Edge Functions.

### 8.5 Logout

- Client: `supabase.auth.signOut()`. Clear local caches (React Query cache, any in-memory feed queue, AsyncStorage keys for feed/recommendations if stored). Supabase invalidates the session server-side on signOut. No token blacklist for MVP.

---

## 9. UI / component breakdown

### 9.1 Screen list

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

### 9.2 Swipe card component

- **Libraries:** `react-native-gesture-handler` + `react-native-reanimated`.
- **Gesture:** Pan gesture on top card. Drag right → card follows with rotation (e.g. +15° at full drag); drag left → -15°. Release: if velocity > **400** to the right → trigger "like" and animate card off to the right; if velocity < -400 to the left → trigger "skip" and animate off to the left; else spring back to center.
- **Animation:** Duration ~200ms for exit; spring config (e.g. damping 15, stiffness 150) for snap-back. Opacity of next card: scale from 0.95 to 1 when it becomes top.
- **Stack:** Pre-render **3** cards (top interactive, next 2 below). Top card has gesture handler; on swipe, remove from local queue and show next. Refill queue when remaining < 3 (call swipe-feed again with cursor or next batch).
- **Dimensions:** Card width = screen width minus padding (e.g. 24); aspect ratio 4:5 for height.

### 9.3 Onboarding detail

- **Welcome:** No write. "Skip" → set has_onboarded = true, preferred_* = [], navigate to Discover. "Next" → navigate to Style Picker.
- **Style Picker:** Multi-select from style tags (e.g. minimalist, streetwear, …). Write to `preferred_styles` on "Complete" (or pass to next screen and write at end).
- **Color Picker:** Multi-select from color tags. → `preferred_colors`.
- **Category Picker:** Multi-select from category tags. → `preferred_categories`.
- **On Complete:** Upsert profile: `has_onboarded = true`, `preferred_styles`, `preferred_colors`, `preferred_categories`. Optionally seed `tag_scores`: for each tag in preferred_*, set tag_scores[tag] = 0.5 (or 0.3). On Skip (from any screen): has_onboarded = true, preferred_* = [], tag_scores = {}.
- **Supabase call:** `supabase.from('profiles').upsert({ id: user.id, has_onboarded: true, preferred_styles: [...], ... }, { onConflict: 'id' })`.

### 9.4 Recommendations page layout

- **Layout:** **Grid**, 2 columns. Card: image (aspect 1:1 or 4:5), brand (small text), title (one line), price, "Buy Now" button.
- **Buy Now:** Open `product.buy_url` with `Linking.openURL(buy_url)` (system browser) or `expo-web-browser.openBrowserAsync(buy_url)` (in-app). Document choice: **in-app browser** for MVP so user stays in app. No affiliate append for MVP unless specified.

### 9.5 Loading, empty, and error states

- **Discover:** Loading = full-screen skeleton or spinner. Empty = "No more inspiration for now" + illustration/CTA. Error = "Something went wrong" + Retry button.
- **My Style:** Loading = grid skeleton. Empty = "Nothing saved yet — start swiping" + link to Discover. Error = Retry.
- **Recommendations:** Loading = grid skeleton. Empty = "Swipe more to get recommendations" (cold start returns items, so empty only if products table empty). Error = Retry; optionally show mock products as fallback.
- **Onboarding:** Error on profile save = inline message under button + "Try again".
- **Profile:** Error on load = Retry.

---

## 10. Client state management and data flow

### 10.1 React Native hooks example

```typescript
// hooks/useSwipeFeed.ts
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export interface InspirationItem {
  id: string;
  image_url: string;
  tags: string[];
  source?: string;
}

export const useSwipeFeed = (userId: string, initialLimit = 20) => {
  const [queue, setQueue] = useState<InspirationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMore = async (limit = initialLimit, afterId?: string) => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase.functions.invoke(
        "swipe-feed",
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, limit, after_id: afterId }),
        }
      );

      if (err) throw err;
      setQueue((prev) => [...prev, ...data.items]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const submitSwipe = async (itemId: string, direction: "like" | "skip") => {
    try {
      await supabase.functions.invoke("submit-swipe", {
        method: "POST",
        body: { user_id: userId, item_id: itemId, direction },
      });

      // Optimistically remove from queue
      setQueue((prev) => prev.slice(1));

      // Prefetch if queue is low
      if (queue.length < 3) {
        fetchMore(initialLimit);
      }
    } catch (e) {
      console.error("Submit swipe error:", e);
    }
  };

  useEffect(() => {
    fetchMore(initialLimit);
  }, [userId]);

  return { queue, submitSwipe, loading, error };
};
```

### 10.2 Profile management

- **Profile:** Stored in Supabase; on app load fetch once and cache in React Query (or Zustand). Refetch after onboarding complete and optionally after each swipe if we want Style DNA to update live in My Style (or refetch when user navigates to My Style).

### 10.3 Feed queue (Discover)

- **Feed queue (Discover):** Client state (useState or Zustand): array of inspiration items. On mount: GET swipe-feed, set queue. On swipe: POST submit-swipe, remove top item from queue optimistically. When queue length < 3: GET swipe-feed again (with cursor if supported), append to queue.

### 10.4 Recommendations & My Style caching

- **Recommendations:** Fetch on tab focus (or once when Recommendations tab is first opened). Cache with React Query; stale time e.g. 5 minutes so revisiting tab doesn't refetch every time.
- **My Style:** Fetch when tab is focused; or cache and invalidate when user returns from Discover (optional).

---

## 11. Environment and configuration

### 11.1 Supabase project setup checklist

- [ ] Create project on `supabase.com` (e.g. `styleswipe-dev`)
- [ ] Get `SUPABASE_URL` and `SUPABASE_ANON_KEY` from Project Settings → API
- [ ] Get `SUPABASE_SERVICE_ROLE_KEY` from same location (keep secret!)
- [ ] Enable email/password auth in Authentication → Providers
- [ ] Set up custom SMTP (optional, for email verification)
- [ ] Create `.env.local` in repo root (never commit):

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=ey...
SUPABASE_SERVICE_ROLE_KEY=ey...
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
SHOPIFY_STOREFRONT_TOKEN=shpua_...
```

### 11.2 Environment variables

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

## 12. Error handling and logging

**Client:**

- Network error (fetch failed): Show "Check your connection" + Retry. 401: Redirect to login or show auth modal. 4xx/5xx: Show generic "Something went wrong" + Retry. Log full error to console in __DEV__; in production optionally send to crash reporting (e.g. Sentry).

**Edge Functions:**

- Log every request (request id, user_id, path) and every error (message, stack). Return 4xx for validation/auth errors, 5xx only for unexpected errors. Log format: `{ "requestId": "...", "userId": "...", "error": "..." }`. Logs visible in Supabase Dashboard → Edge Functions → Logs.

---

## 13. Testing approach

### 13.1 Unit tests (tag score update)

```typescript
// test/updateTagScores.test.ts
import { updateTagScores } from "@/lib/tagScoring";

describe("updateTagScores", () => {
  test("like boost adds 0.15 to tag scores", () => {
    const current = { minimalist: 0.5 };
    const tags = ["minimalist", "black"];
    const result = updateTagScores(current, tags, "like");

    expect(result.minimalist).toBe(0.65); // 0.5 * 0.98 + 0.15 = 0.64, rounded to 0.65
    expect(result.black).toBe(0.15);
  });

  test("skip penalty subtracts 0.05", () => {
    const current = { minimalist: 0.1 };
    const tags = ["minimalist"];
    const result = updateTagScores(current, tags, "skip");

    expect(result.minimalist).toBeCloseTo(0.048); // 0.1 * 0.98 - 0.05, clamped to 0
  });

  test("decay applies to all tags before boost", () => {
    const current = { minimalist: 0.8, other: 0.5 };
    const result = updateTagScores(current, ["minimalist"], "like");

    // other: 0.5 * 0.98 = 0.49
    expect(result.other).toBeCloseTo(0.49);
  });

  test("clamps scores to [0, 1]", () => {
    const current = { tag: 0.95 };
    const result = updateTagScores(current, ["tag"], "like");

    // 0.95 * 0.98 + 0.15 = 1.081, clamped to 1
    expect(result.tag).toBe(1);
  });

  test("handles empty scores on first swipe", () => {
    const current = {};
    const tags = ["minimalist", "black"];
    const result = updateTagScores(current, tags, "like");

    expect(result.minimalist).toBe(0.15);
    expect(result.black).toBe(0.15);
  });
});
```

### 13.2 Style DNA derivation

```typescript
test("Style DNA returns top 5 tags sorted by score", () => {
  const scores = {
    minimalist: 0.9,
    black: 0.85,
    casual: 0.7,
    cotton: 0.6,
    tops: 0.5,
    white: 0.4,
  };

  const result = getStyleDNA(scores);

  expect(result).toEqual(["minimalist", "black", "casual", "cotton", "tops"]);
});

test("Style DNA applies tie-break by lexicographic order", () => {
  const scores = { zebra: 0.5, apple: 0.5 };
  const result = getStyleDNA(scores);

  expect(result).toEqual(["apple", "zebra"]); // Alphabetical
});

test("Style DNA returns fewer than 5 if threshold applied", () => {
  const scores = { high: 0.9, low1: 0.15, low2: 0.1 };
  const result = getStyleDNA(scores, { threshold: 0.2 });

  expect(result).toEqual(["high"]); // Only score >= 0.2
});
```

### 13.3 Integration tests (Edge Functions)

```typescript
// test/swipe-feed.integration.test.ts
describe("swipe-feed Edge Function", () => {
  test("returns items excluding seen ones", async () => {
    const userId = "test-user";
    const item1 = await createInspiration({ tags: ["minimalist"] });
    const item2 = await createInspiration({ tags: ["bohemian"] });

    // Record a swipe
    await createSwipe(userId, item1.id, "like");

    // Fetch feed
    const response = await invokeFunction("swipe-feed", {
      user_id: userId,
      limit: 10,
    });

    const ids = response.items.map((item) => item.id);
    expect(ids).not.toContain(item1.id);
    expect(ids).toContain(item2.id);
  });

  test("scores items by tag match", async () => {
    const userId = "test-user";
    const profile = await getProfile(userId);
    profile.tag_scores = { minimalist: 0.9, bohemian: 0.1 };
    await updateProfile(profile);

    const item1 = await createInspiration({ tags: ["minimalist"] });
    const item2 = await createInspiration({ tags: ["bohemian"] });

    const response = await invokeFunction("swipe-feed", {
      user_id: userId,
      limit: 10,
    });

    // item1 should appear before item2 (higher score)
    expect(response.items[0].id).toBe(item1.id);
    expect(response.items[1].id).toBe(item2.id);
  });
});

describe("submit-swipe Edge Function", () => {
  test("inserts swipe and updates profile", async () => {
    const userId = "test-user";
    const item = await createInspiration({ tags: ["minimalist", "black"] });

    const response = await invokeFunction("submit-swipe", {
      user_id: userId,
      item_id: item.id,
      direction: "like",
    });

    expect(response.ok).toBe(true);

    // Verify swipe recorded
    const swipes = await getSwipes(userId);
    expect(swipes).toHaveLength(1);
    expect(swipes[0].item_id).toBe(item.id);

    // Verify profile updated
    const profile = await getProfile(userId);
    expect(profile.tag_scores.minimalist).toBeCloseTo(0.15);
    expect(profile.tag_scores.black).toBeCloseTo(0.15);
  });
});
```

### 13.4 E2E flow test

```typescript
// test/e2e.test.ts
describe("E2E user flow", () => {
  test("complete signup → swipe → my-style → recommendations", async () => {
    // 1. Signup
    const user = await signUp("user@example.com", "password123");
    expect(user.id).toBeTruthy();

    // 2. Complete onboarding
    await updateProfile(user.id, {
      has_onboarded: true,
      preferred_styles: ["minimalist"],
    });

    // 3. Fetch and swipe items
    const feed = await invokeFunction("swipe-feed", {
      user_id: user.id,
      limit: 5,
    });
    expect(feed.items.length).toBeGreaterThan(0);

    await invokeFunction("submit-swipe", {
      user_id: user.id,
      item_id: feed.items[0].id,
      direction: "like",
    });

    // 4. Fetch My Style
    const myStyle = await invokeFunction("my-style", { user_id: user.id });
    expect(myStyle.items).toHaveLength(1);

    // 5. Fetch Recommendations
    const recommendations = await invokeFunction("recommendations", {
      user_id: user.id,
    });
    expect(recommendations.items.length).toBeGreaterThan(0);
  });
});
```

### 13.5 Where tests live

- Edge Functions: `/supabase/functions/<name>/` or repo root `tests/functions/`.
- Client: `__tests__/` or `*.test.tsx` next to components.

---

## 14. Deployment and environments

### 14.1 Supabase deployment

- **Schema:** Run migrations via `supabase db push` or by executing SQL in Dashboard.
- **Example:** `supabase db push --local` to test locally first.

### 14.2 Edge Functions deployment

- **Deploy:** `supabase functions deploy swipe-feed`
- **Cron for sync-shopify-products:** Configure in Dashboard (Settings → Cron Jobs) to run daily at 2am UTC.
- **Secrets:** Set in Dashboard (Settings → Edge Functions → Secrets).

### 14.3 Expo deployment

- **EAS Build:** `eas build --platform ios --profile preview`
- **TestFlight:** `eas submit --platform ios`
- **Play Store:** `eas submit --platform android`
- **Env vars:** Set in `eas.json` and `.env` per environment.

### 14.4 CI/CD (optional)

- **On push to main:** Run unit and integration tests.
- **On tag/release:** Deploy Edge Functions and build mobile app.

---

## 15. Performance and security checklist

**Performance:**

- Feed and Recommendations: default limit 20, max 50.
- Index on swipes (user_id, item_id) for efficient seen-item exclusion.
- My Style: single query with join (swipes + inspiration_items), no N+1.
- Consider caching product list in Edge Function for 5–10 min if Shopify is slow.
- Profile fetch: cache in client (React Query, Zustand) with 5-min stale time.

**Security:**

- RLS enabled on all tables (verify in Dashboard).
- Edge Function validates `user_id = JWT sub` (reject with 403 if mismatch).
- No PII in logs (no email in logs; user_id ok).
- HTTPS only.
- Anon key in client; service role only in Edge Functions and never in client code.
- No secrets in repo (use `.env.local` + `.gitignore`).
- Rate limit Shopify API calls (exponential backoff on 429).

---

## 16. Troubleshooting

### Database / Auth issues

**Problem:** "Column 'tag_scores' doesn't exist"
- **Solution:** Run full schema from section 5.1. Check that migration was executed (look in Dashboard → SQL Editor history).

**Problem:** "RLS policy prevents query"
- **Solution:** Verify RLS is enabled on table (should say "ON" in Dashboard). Check that user JWT is valid and user_id in request matches JWT sub.

**Problem:** User can see other users' swipes
- **Solution:** Check RLS policy for swipes table. Should be `WHERE auth.uid() = user_id`.

### Edge Functions issues

**Problem:** "Authorization: Bearer header missing"
- **Solution:** Client must pass JWT from `supabase.auth.session().access_token` in header.

**Problem:** "429 Shopify rate limit"
- **Solution:** Implement exponential backoff (1s, 2s, 4s) and max 3 retries. Check that sync function is not running too frequently.

**Problem:** "No products in Recommendations"
- **Solution:** Verify that `products` table has rows. If empty, fall back to mock products (set `USE_MOCK_FEED=true` or check mock JSON). Verify Shopify credentials are correct (test query in GraphQL client first).

### Client app issues

**Problem:** "Swipe feed returns empty even after seeding"
- **Solution:** Verify mock data was seeded (`SELECT COUNT(*) FROM inspiration_items;`). Check that user is authenticated (JWT present). Check that user has not already swiped all items (`SELECT COUNT(*) FROM swipes WHERE user_id=?`).

**Problem:** "Tag scores not updating after swipe"
- **Solution:** Verify `/submit-swipe` is returning 200 OK. Check Edge Function logs (Dashboard → Edge Functions → Logs). Verify inspiration item has tags (not empty array).

**Problem:** "Gesture does not trigger swipe"
- **Solution:** Ensure `react-native-gesture-handler` is properly linked. Test velocity threshold (current: 400). Check that gesture responder is attached to card.

---

## 17. Appendix A: Seed data and scripts

### A.1 Seed inspiration items script

```typescript
// scripts/seed-inspiration.ts
import * as fs from "fs";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

// Read mock data from file or embed directly
const mockInspiration = JSON.parse(
  fs.readFileSync("./data/mock-inspiration.json", "utf-8")
);

async function seed() {
  console.log(`Seeding ${mockInspiration.items.length} inspiration items...`);

  const { error } = await supabase
    .from("inspiration_items")
    .insert(mockInspiration.items);

  if (error) {
    console.error("❌ Seed failed:", error);
  } else {
    console.log(
      `✓ Seeded ${mockInspiration.items.length} items successfully`
    );
  }
}

seed();
```

### A.2 Tag score update helper function

```typescript
// lib/tagScoring.ts
export const LEARNING_CONSTANTS = {
  LIKE_BOOST: 0.15,
  SKIP_PENALTY: 0.05,
  DECAY_FACTOR: 0.98,
};

export function updateTagScores(
  currentScores: Record<string, number>,
  itemTags: string[],
  direction: "like" | "skip",
  constants = LEARNING_CONSTANTS
): Record<string, number> {
  const newScores = { ...currentScores };

  // Step 1: Decay all tags
  Object.keys(newScores).forEach((tag) => {
    newScores[tag] = newScores[tag] * constants.DECAY_FACTOR;
  });

  // Step 2: Apply boost or penalty
  itemTags.forEach((tag) => {
    if (newScores[tag] === undefined) newScores[tag] = 0;
    if (direction === "like") {
      newScores[tag] += constants.LIKE_BOOST;
    } else {
      newScores[tag] -= constants.SKIP_PENALTY;
    }
  });

  // Step 3: Clamp to [0, 1]
  Object.keys(newScores).forEach((tag) => {
    newScores[tag] = Math.max(0, Math.min(1, newScores[tag]));
  });

  return newScores;
}

export function getStyleDNA(
  tagScores: Record<string, number>,
  options = { threshold: 0, limit: 5 }
): string[] {
  let entries = Object.entries(tagScores);

  // Filter by threshold
  if (options.threshold > 0) {
    entries = entries.filter(([, score]) => score >= options.threshold);
  }

  // Sort by score (desc), then by tag name (asc) for tie-break
  entries.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    return a[0].localeCompare(b[0]);
  });

  return entries.slice(0, options.limit).map(([tag]) => tag);
}
```

### A.3 Shopify sync function

```typescript
// supabase/functions/sync-shopify-products/index.ts
import { createClient } from "@supabase/supabase-js";

const SHOPIFY_QUERY = `
  query {
    products(first: 100) {
      edges {
        node {
          id
          title
          vendor
          images(first: 1) {
            edges {
              node {
                url
              }
            }
          }
          variants(first: 1) {
            edges {
              node {
                priceV2 {
                  amount
                }
              }
            }
          }
          onlineStoreUrl
          tags
        }
      }
    }
  }
`;

export default async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  const storeDomain = Deno.env.get("SHOPIFY_STORE_DOMAIN");
  const token = Deno.env.get("SHOPIFY_STOREFRONT_TOKEN");

  const response = await fetch(`https://${storeDomain}/api/2024-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token || "",
    },
    body: JSON.stringify({ query: SHOPIFY_QUERY }),
  });

  const { data } = await response.json();
  const products = data.products.edges.map((edge) => {
    const node = edge.node;
    return {
      external_id: node.id.replace("gid://shopify/Product/", ""),
      title: node.title,
      brand: node.vendor,
      image_url: node.images.edges[0]?.node.url || "",
      price: node.variants.edges[0]?.node.priceV2.amount || "0",
      buy_url: node.onlineStoreUrl,
      tags: normalizeTags(node.tags),
    };
  });

  const { error } = await supabase.from("products").upsert(products, {
    onConflict: "external_id",
  });

  if (error) {
    console.error("Sync failed:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ synced: products.length }), {
    status: 200,
  });
};

function normalizeTags(shopifyTags: string[]): string[] {
  const mapping = {
    boho: "bohemian",
    "street-wear": "streetwear",
    b_w: "black",
  };

  const VALID_TAGS = [
    "minimalist",
    "bohemian",
    "streetwear",
    "casual",
    "black",
    "white",
    "cotton",
    "denim",
    // ... add all from section 2.1
  ];

  return shopifyTags
    .map((tag) => {
      const normalized = (mapping[tag] || tag).toLowerCase().trim();
      return VALID_TAGS.includes(normalized) ? normalized : null;
    })
    .filter((tag) => tag !== null) as string[];
}
```

### A.4 Full mock data example

See separate `data/mock-inspiration.json` and `data/mock-products.json` files in repo (minimum 20 each).

---

## 18. Quick reference: Common commands

```bash
# Local Supabase setup
supabase start
supabase db push --local
supabase functions deploy swipe-feed

# Edge Function testing
supabase functions invoke swipe-feed --local \
  --header "Authorization: Bearer $JWT" \
  --arg user_id="UUID" --arg limit="20"

# Expo setup
npx expo init my-app
npm install @supabase/supabase-js react-native-gesture-handler react-native-reanimated

# Build and submit
eas build --platform ios --profile preview
eas submit --platform ios
```

---

This low-level document, together with [highLevelDoc.md](highLevelDoc.md) and [requirements.md](requirements.md), is sufficient to implement StyleSwipe end-to-end with minimal ambiguity. Use the Quick Start (section 0) for first 30 minutes, then follow Implementation Sequence (section 1).
