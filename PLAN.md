# StyleSwipe — Extremely Granular Implementation Plan

This document is a step-by-step build plan derived from [highLevelDoc.md](highLevelDoc.md) and [lowLevelDoc.md](lowLevelDoc.md). Each step is numbered, actionable, and includes verification. Follow in order; later steps depend on earlier ones.

**Conventions:**
- `$VARIABLE` = value you must fill in or obtain
- `path/to/file` = exact file path relative to project root
- `Section X.Y` = reference to lowLevelDoc.md section
- **Verify:** = action to confirm the step worked

---

## Phase 0: Prerequisites and environment

### Step 0.1 — Install Node.js 18+ LTS

- [x] 

1. Open terminal. Run: `node -v`
2. If version is < 18, install from [nodejs.org](https://nodejs.org) or via `nvm install 18`
3. **Verify:** `node -v` shows 18.x or higher
4. **Verify:** `npm -v` shows 9.x or higher

---

### Step 0.2 — Install Expo CLI (global, optional)

- [x] 

1. Run: `npm install -g expo-cli` (optional; npx works without it)
2. **Verify:** `npx expo --version` runs successfully

---

### Step 0.3 — Create Supabase account

- [x] 

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub or email
4. **Verify:** You land on the Supabase dashboard (Organization view)

---

### Step 0.4 — Create Supabase project

- [x] 

1. In Supabase dashboard, click "New project"
2. Select your Organization (or create one if prompted)
3. **Project name:** `styleswipe` (or `styleswipe-dev`)
4. **Database Password:** Generate a strong password; **save it in a password manager**. You will need it for local Supabase CLI later; for now you can use the dashboard only.
5. **Region:** Choose closest to you (e.g. `West US (North California)`)
6. Click "Create new project"
7. Wait 1–2 minutes for the project to initialize
8. **Verify:** You see the project dashboard with "Project API keys" visible

---

### Step 0.5 — Copy Supabase credentials to a safe place

- [x] 

1. In Supabase project, click **Project Settings** (gear icon, bottom left)
2. Click **API** in the sidebar
3. Copy and save:
   - **Project URL** (e.g. `https://abcdefgh.supabase.co`)
   - **anon public** key (under "Project API keys")
   - **service_role** key (under "Project API keys") — keep this secret; never put in client code
4. **Verify:** All three values are long strings (URL and JWT-like keys)

---

### Step 0.6 — Enable Email/Password auth in Supabase

- [ ] 

1. In Supabase project, click **Authentication** (left sidebar)
2. Click **Providers**
3. Find **Email** and ensure it is **enabled** (toggle ON)
4. Optional: Disable "Confirm email" for faster local testing (re-enable for production)
5. **Verify:** Email provider shows as enabled

---

## Phase 1: Local project structure

### Step 1.1 — Ensure project root has Expo structure

- [x] 

1. Open project root: `/Users/bradenpeterson/Hackathon/StyleSwipe`
2. **Verify** these files/folders exist:
   - `package.json`
   - `App.js` or `App.tsx`
   - `app.json`
   - `assets/`
   - `lib/supabase.js` or `lib/supabase.ts`
   - `.env.example`
3. If any are missing, follow [SETUP.md](SETUP.md) to scaffold or create them

---

### Step 1.2 — Create `.env` file with Supabase credentials

- [x] 

1. In project root, create file `.env`
2. Add these lines (replace placeholders with your values from Step 0.5):

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Verify:** `.env` is listed in `.gitignore` (it must never be committed)
4. **Verify:** No trailing spaces or quotes around values

---

### Step 1.3 — Install required npm dependencies

- [x] 

1. Open terminal in project root
2. Run:

```bash
npm install @supabase/supabase-js react-native-url-polyfill react-native-gesture-handler react-native-reanimated expo-router expo-linking expo-constants react-native-safe-area-context react-native-screens
```

3. If you get peer dependency errors, run: `npm install --legacy-peer-deps`
4. **Verify:** `node_modules/@supabase/supabase-js` exists
5. **Verify:** `node_modules/react-native-gesture-handler` exists

---

### Step 1.4 — Configure Expo Router (if using file-based routing)

- [x] 

1. Open `app.json`
2. Add or ensure this line exists: `"main": "expo-router/entry"`
3. If you use Expo Router, create directory `app/` in project root
4. **Verify:** `app.json` has `"main": "expo-router/entry"` when using Expo Router

---

### Step 1.5 — Verify Supabase client loads

- [x] 

1. Open `lib/supabase.js` (or `.ts`)
2. Ensure it contains (adjust for your file):
   - Import of `react-native-url-polyfill/auto` at top
   - Import of `createClient` from `@supabase/supabase-js`
   - Creation of client with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - Export of `supabase`
3. **Verify:** File exists and exports `supabase`

---

### Step 1.6 — Run the app (smoke test)

- [x] 

1. Run: `npm start`
2. Press `i` for iOS simulator or `a` for Android emulator, or scan QR code with Expo Go
3. **Verify:** App launches and shows content (even if it says "StyleSwipe" or "Open up App.js")
4. Stop the server with Ctrl+C when done

---

## Phase 2: Database schema (via migrations)

All schema changes live in the codebase as migration files and are applied with `supabase db push`. No manual SQL in the Supabase dashboard.

### Step 2.1 — Install Supabase CLI, init, and link project

- [x] 

1. Install CLI: `npm install -g supabase` or `brew install supabase/tap/supabase`
2. **Verify:** `supabase --version` prints a version number
3. Run: `supabase init` — creates `supabase/config.toml` and `supabase/migrations/`
4. **Verify:** `supabase/` directory exists with `migrations/` folder
5. Run: `supabase login` (opens browser to authenticate)
6. Run: `supabase link --project-ref YOUR_PROJECT_REF`
   - Find YOUR_PROJECT_REF in Supabase dashboard URL: `https://app.supabase.com/project/abcdefgh` → ref is `abcdefgh`
7. **Verify:** `supabase link` succeeds

---

### Step 2.2 — Create schema migration file

- [x] 

1. Create a new migration file in `supabase/migrations/` with a timestamp prefix, e.g. `supabase/migrations/20240227000000_initial_schema.sql`
   - You can run `supabase migration new initial_schema` to generate the filename, or create it manually
2. Paste the following SQL into the file (schema + indexes + RLS in one migration):

```sql
-- Tables
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
  price numeric(10, 2) NOT NULL,
  buy_url text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  metadata jsonb DEFAULT '{}'
);

CREATE TYPE swipe_direction AS ENUM ('like', 'skip');

-- Users swipe on inspiration_items; product recommendations derive from tag affinity (shared tags)
CREATE TABLE public.swipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.inspiration_items(id) ON DELETE CASCADE,
  direction swipe_direction NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);

-- Auto-update updated_at on profiles and products
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes (UNIQUE constraints already index user_id+item_id and external_id)
CREATE INDEX idx_swipes_user_id ON public.swipes(user_id);
CREATE INDEX idx_swipes_item_id ON public.swipes(item_id);
CREATE INDEX idx_inspiration_items_tags ON public.inspiration_items USING GIN(tags);
CREATE INDEX idx_products_tags ON public.products USING GIN(tags);

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.inspiration_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspiration_select" ON public.inspiration_items FOR SELECT TO authenticated USING (true);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select" ON public.products FOR SELECT TO authenticated USING (true);

ALTER TABLE public.swipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "swipes_select_own" ON public.swipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "swipes_insert_own" ON public.swipes FOR INSERT WITH CHECK (auth.uid() = user_id);
```

3. **Verify:** File is valid SQL; path is `supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql`

---

### Step 2.3 — Apply migrations to remote database

- [x] 

1. From project root, run: `supabase db push`
2. **Verify:** Output shows migration(s) applied successfully
3. **Verify:** In Supabase Dashboard → Table Editor, you see: `profiles`, `inspiration_items`, `products`, `swipes`
4. **Verify:** In Table Editor → profiles → RLS, it shows "RLS enabled" and 3 policies

---

## Phase 3: Mock data seeding

### Step 3.1 — Create `data` directory and mock files

- [x] 

1. In project root, create directory `data/`
2. Create file `data/mock-inspiration.json` with this structure (expand to 20+ items):

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400",
      "tags": ["minimalist", "black", "casual", "cotton", "tops"],
      "source": "mock"
    }
  ]
}
```

3. For each item: generate a UUID (e.g. use [uuidgenerator.net](https://www.uuidgenerator.net)), pick an image URL (Unsplash, Pexels, or placeholder), and assign 3–5 tags from the taxonomy in lowLevelDoc Section 2.1
4. **Verify:** File is valid JSON (run `node -e "require('./data/mock-inspiration.json')"`)

---

### Step 3.2 — Create `data/mock-products.json`

- [x] 

1. Create `data/mock-products.json` with structure:

```json
{
  "items": [
    {
      "id": "650e8400-e29b-41d4-a716-446655440001",
      "external_id": "mock-1",
      "title": "Classic Black Tee",
      "brand": "Mock Brand",
      "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
      "price": "29.00",
      "buy_url": "https://example.com/product/1",
      "tags": ["minimalist", "black", "cotton", "tops"]
    }
  ]
}
```

2. Add 20+ product entries; ensure each has unique `external_id`
3. **Verify:** Valid JSON; all tags are from Section 2.1 taxonomy

---

### Step 3.3 — Create seed script

- [x] 

1. Create directory `scripts/` if it does not exist
2. Create file `scripts/seed-inspiration.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role, not anon
);

const data = JSON.parse(fs.readFileSync('./data/mock-inspiration.json', 'utf8'));

async function seed() {
  const { error } = await supabase.from('inspiration_items').insert(data.items);
  if (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
  console.log(`Seeded ${data.items.length} inspiration items`);
}

seed();
```

3. Add `dotenv` to devDependencies: `npm install dotenv --save-dev`
4. Create `.env` entry for `SUPABASE_SERVICE_ROLE_KEY` (from Step 0.5) — only if running seed from Node; otherwise use Supabase Dashboard to insert manually
5. **Verify:** Script exists; for manual seed, use SQL Editor instead (see Step 3.4)

---

### Step 3.4 — Insert mock data via Supabase SQL Editor (alternative to script)

- [x] 

1. Convert `data/mock-inspiration.json` items to SQL INSERT format. Example for one row:

```sql
INSERT INTO public.inspiration_items (id, image_url, tags, source) VALUES
  ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', ARRAY['minimalist','black','casual','cotton','tops'], 'mock');
```

2. Repeat for all 20+ inspiration items; batch into one INSERT with multiple rows separated by commas
3. Run the INSERT in SQL Editor
4. **Verify:** `SELECT COUNT(*) FROM inspiration_items;` returns 20 or more

---

### Step 3.5 — Insert mock products

- [x] 

1. Similarly convert `data/mock-products.json` to SQL INSERT
2. Example:

```sql
INSERT INTO public.products (external_id, title, brand, image_url, price, buy_url, tags) VALUES
  ('mock-1', 'Classic Black Tee', 'Mock Brand', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', '29.00', 'https://example.com/product/1', ARRAY['minimalist','black','cotton','tops']);
```

3. Run INSERT for all products
4. **Verify:** `SELECT COUNT(*) FROM products;` returns 20 or more

---

## Phase 5: Edge Functions setup

**Note:** Supabase CLI, `supabase init`, and `supabase link` are already done in Phase 2.

### Step 5.1 — Create `swipe-feed` Edge Function

- [x] 

1. Run: `supabase functions new swipe-feed` (requires Supabase CLI from Phase 2)
2. This creates `supabase/functions/swipe-feed/index.ts`
3. Implement the function using the skeleton from lowLevelDoc Section 7.1
4. Key logic:
   - Validate JWT; extract `user_id` from query; ensure `user_id === JWT.sub`
   - Load profile `tag_scores`
   - Get seen `item_id`s from `swipes` for this user
   - Query `inspiration_items` where `id NOT IN (seen_ids)`
   - Score each item: `score = avg(tag_scores[t] for t in item.tags, default 0)`
   - Sort by score DESC; return top `limit` items
5. **Verify:** Function file exists and has correct imports

---

### Step 5.2 — Create shared CORS helper

- [x] 

1. Create `supabase/functions/_shared/cors.ts` (or `cors.js`):

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
```

2. **Verify:** File exists and is imported in each Edge Function

---

### Step 5.3 — Create `submit-swipe` Edge Function

- [x] 

1. Run: `supabase functions new submit-swipe`
2. Implement:
   - Parse POST body: `user_id`, `item_id`, `direction`
   - Validate JWT; ensure `user_id === JWT.sub`
   - INSERT into `swipes`
   - Load inspiration item `tags` and profile `tag_scores`
   - Call `updateTagScores()` helper (see lowLevelDoc Section 7.4 and Appendix A.2)
   - UPDATE `profiles` SET `tag_scores = newScores`, `updated_at = now()` WHERE `id = user_id`
   - Return `{ ok: true }`
3. **Verify:** Function handles duplicate (user_id, item_id) — use ON CONFLICT DO NOTHING or check before insert

---

### Step 5.4 — Create `updateTagScores` helper (for Edge Functions)

- [x] 

1. Create `supabase/functions/_shared/tagScoring.ts` (or inline in submit-swipe)
2. Implement exactly as in lowLevelDoc Appendix A.2:
   - Decay all tags by 0.98
   - Add 0.15 for like, subtract 0.05 for skip
   - Clamp to [0, 1]
3. **Verify:** Logic matches Section 2.3 order of operations

---

### Step 5.5 — Create `my-style` Edge Function

- [ ] 

1. Run: `supabase functions new my-style`
2. Implement:
   - Validate JWT; `user_id` from query === JWT.sub
   - Query: `SELECT ii.* FROM swipes s JOIN inspiration_items ii ON s.item_id = ii.id WHERE s.user_id = $userId AND s.direction = 'like' ORDER BY s.created_at DESC`
   - Return `{ items: [...] }`
3. **Verify:** Response shape matches Section 6.3 (InspirationItem[])

---

### Step 5.6 — Create `recommendations` Edge Function

- [ ] 

1. Run: `supabase functions new recommendations`
2. Implement:
   - Validate JWT; `user_id` from query === JWT.sub
   - Load profile `tag_scores` and count swipes
   - If `tag_scores` empty or swipes < 5: return products ORDER BY random() LIMIT limit (cold start)
   - Else: load products, score each by avg(tag_scores[t]), sort by score DESC, return top limit
3. **Verify:** Cold start returns products; warm path returns ranked products

---

### Step 5.7 — Set Edge Function secrets

- [ ] 

1. In Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Add:
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = your service_role key
3. **Verify:** Secrets are set (values are masked)

---

### Step 5.8 — Deploy Edge Functions

- [ ] 

1. Run: `supabase functions deploy swipe-feed`
2. Run: `supabase functions deploy submit-swipe`
3. Run: `supabase functions deploy my-style`
4. Run: `supabase functions deploy recommendations`
5. **Verify:** Each deploy prints a success message with function URL

---

### Step 5.9 — Test swipe-feed with curl

- [ ] 

1. Sign up a test user in Supabase Authentication → Users → Add user (or via app)
2. Copy the user's JWT (from app session or create via API)
3. Run:

```bash
curl -H "Authorization: Bearer YOUR_JWT" "https://YOUR_PROJECT_REF.supabase.co/functions/v1/swipe-feed?user_id=USER_UUID&limit=5"
```

4. **Verify:** Response is `{ "items": [...] }` with inspiration items (or empty if all seen)

---

## Phase 6: Auth screens (client)

### Step 6.1 — Create auth context or session hook

- [ ] 

1. Create `contexts/AuthContext.jsx` (or `AuthContext.tsx`)
2. Use `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange()`
3. Expose: `user`, `loading`, `signOut`, `signIn`, `signUp`
4. **Verify:** Context provides session to app

---

### Step 6.2 — Create Sign Up screen

- [ ] 

1. Create route: `app/(auth)/sign-up.jsx` or a dedicated screen component
2. Fields: email (text input), password (secure text input)
3. On submit: `supabase.auth.signUp({ email, password })`
4. Handle error: show message if signup fails
5. On success: navigate to Discover or Onboarding
6. **Verify:** New user appears in Supabase Authentication → Users

---

### Step 6.3 — Create Login screen

- [ ] 

1. Create route: `app/(auth)/login.jsx`
2. Fields: email, password
3. On submit: `supabase.auth.signInWithPassword({ email, password })`
4. On success: navigate to main app
5. **Verify:** Session persists after app restart (Supabase client stores it)

---

### Step 6.4 — Create profile on first sign-in (trigger or client)

- [ ] 

1. Option A: Database trigger that inserts into `profiles` when `auth.users` gets new row
2. Option B: In client, after signUp/signIn, call `supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id' })`
3. **Verify:** After signup, `profiles` has a row for the new user

---

## Phase 7: Onboarding flow

### Step 7.1 — Create onboarding route group

- [ ] 

1. Create `app/onboarding/_layout.jsx` with a stack navigator
2. Create `app/onboarding/index.jsx` (Welcome screen)
3. **Verify:** Route `onboarding` is navigable

---

### Step 7.2 — Welcome screen

- [ ] 

1. Content: "Learn your style by swiping" + "Get Started" and "Skip" buttons
2. "Get Started" → navigate to `onboarding/style`
3. "Skip" → set `has_onboarded = true`, `preferred_* = []`, navigate to Discover
4. **Verify:** Skip writes to profile and navigates away

---

### Step 7.3 — Style Picker screen

- [ ] 

1. Display multi-select list of style tags from taxonomy (Section 2.1): minimalist, bohemian, streetwear, etc.
2. User taps to select/deselect
3. "Next" → navigate to Color Picker; pass selections in state or context
4. **Verify:** Selections are stored (state/context)

---

### Step 7.4 — Color Picker screen

- [ ] 

1. Display color tags: black, white, navy, etc.
2. Multi-select; "Next" → Category Picker
4. **Verify:** Selections stored

---

### Step 7.5 — Category Picker screen

- [ ] 

1. Display category tags: tops, bottoms, dresses, etc.
2. "Complete" → call `supabase.from('profiles').upsert({ id: user.id, has_onboarded: true, preferred_styles: [...], preferred_colors: [...], preferred_categories: [...] })`
3. Optionally seed `tag_scores` from preferred tags (each = 0.5)
4. Navigate to Discover
5. **Verify:** Profile updated; `has_onboarded` is true

---

## Phase 8: Discover (swipe) screen

### Step 8.1 — Create Discover tab/screen

- [ ] 

1. Create `app/(tabs)/index.jsx` (or equivalent for Discover)
2. Screen fetches feed on mount
3. **Verify:** Screen is the default tab

---

### Step 8.2 — Implement `useSwipeFeed` hook

- [ ] 

1. Create `hooks/useSwipeFeed.js` (or `.ts`)
2. State: `queue` (array of items), `loading`, `error`
3. On mount: call Edge Function `swipe-feed` with `user_id`, `limit=20`
4. Expose: `submitSwipe(itemId, direction)` which calls `submit-swipe` and removes item from queue
5. When `queue.length < 3`: fetch more (call swipe-feed again with cursor or next batch)
6. **Verify:** Hook returns queue and submitSwipe; see lowLevelDoc Section 10.1

---

### Step 8.3 — Create SwipeCard component

- [ ] 

1. Install and use `react-native-gesture-handler` and `react-native-reanimated`
2. Wrap card in `GestureDetector` with `Pan` gesture
3. On drag: rotate card ±15° based on x offset; animate opacity
4. On release: if velocity.x > 400 → like; if velocity.x < -400 → skip; else spring back
5. Call `onSwipe(itemId, direction)` when like or skip
6. **Verify:** Card responds to drag; velocity threshold triggers callback; see Section 9.2

---

### Step 8.4 — Create card stack

- [ ] 

1. Render 3 cards: top card interactive, next 2 beneath (scaled 0.95, offset)
2. Use `position: absolute` or `zIndex` so cards stack
3. On swipe: animate top card off-screen (e.g. translateX to 500 or -500)
4. Remove from queue; next card becomes top
5. **Verify:** Only top card is draggable; stack shows next cards

---

### Step 8.5 — Wire Discover screen to hook and cards

- [ ] 

1. Call `useSwipeFeed(userId)`
2. Map `queue` to card stack; pass top item to SwipeCard
3. On `submitSwipe`: pass `itemId` and `direction` from gesture
4. Loading state: show spinner or skeleton
5. Empty state: "No more inspiration for now" when queue empty and no more from API
6. Error state: "Something went wrong" + Retry button
7. **Verify:** Full flow: load feed → swipe → card disappears → next appears → submit-swipe called

---

## Phase 9: My Style screen

### Step 9.1 — Create My Style tab/screen

- [ ] 

1. Create `app/(tabs)/my-style.jsx`
2. **Verify:** Tab appears in tab bar

---

### Step 9.2 — Fetch liked inspiration

- [ ] 

1. On mount (or tab focus): call Edge Function `my-style` with `user_id`
2. Store result in state or React Query
3. **Verify:** Response is `{ items: InspirationItem[] }`

---

### Step 9.3 — Display Style DNA banner

- [ ] 

1. Fetch profile `tag_scores` (from Supabase `profiles` table or include in my-style response)
2. Compute top 5 tags: sort by score desc, tie-break by name asc, take first 5
3. Display as chips or badges: "Your style: minimalist, black, casual, cotton, tops"
4. **Verify:** Style DNA shows correct tags; see Section 2.3 Style DNA derivation

---

### Step 9.4 — Display liked items grid

- [ ] 

1. Use `FlatList` or `ScrollView` with 2 columns
2. Each cell: image (aspect 4:5), optional caption
3. Empty state: "Nothing saved yet — start swiping" + link to Discover
4. **Verify:** Grid shows only items user swiped right on

---

## Phase 10: Recommendations screen

### Step 10.1 — Create Recommendations tab

- [ ] 

1. Create `app/(tabs)/recommendations.jsx`
2. **Verify:** Tab appears

---

### Step 10.2 — Fetch recommendations

- [ ] 

1. On mount/tab focus: call Edge Function `recommendations` with `user_id`, `limit=20`
2. Store in state or React Query
3. **Verify:** Response is `{ items: Product[] }` with buy_url

---

### Step 10.3 — Display product grid

- [ ] 

1. Grid, 2 columns
2. Each card: image, brand, title, price, "Buy Now" button
3. **Verify:** Layout matches Section 9.4

---

### Step 10.4 — Implement Buy Now

- [ ] 

1. On "Buy Now" tap: `Linking.openURL(product.buy_url)` or `expo-web-browser.openBrowserAsync(product.buy_url)`
2. **Verify:** Opens product URL in browser

---

## Phase 11: Profile screen

### Step 11.1 — Create Profile tab

- [ ] 

1. Create `app/(tabs)/profile.jsx`
2. Display: user email (from session), optional avatar

---

### Step 11.2 — Logout button

- [ ] 

1. On tap: `supabase.auth.signOut()`
2. Clear any local caches (feed queue, React Query cache)
3. Navigate to Sign Up / Login
4. **Verify:** Session cleared; user must log in again

---

### Step 11.3 — Theme toggle (optional)

- [ ] 

1. Add toggle for light/dark mode
2. Store preference in AsyncStorage or profile
3. Apply theme to app (e.g. via context)

---

## Phase 12: Navigation and routing

### Step 12.1 — Define tab layout

- [ ] 

1. Create `app/(tabs)/_layout.jsx`
2. Tabs: Discover (index), My Style, Recommendations, Profile
3. Icons and labels for each tab
4. **Verify:** All 4 tabs navigable

---

### Step 12.2 — Auth gate

- [ ] 

1. If no session: show Sign Up / Login (or redirect to auth stack)
2. If session exists and `has_onboarded` false: redirect to onboarding
3. If session and onboarded: show main tabs
4. **Verify:** Flow matches: signup → onboarding (or skip) → Discover

---

## Phase 13: Error handling and polish

### Step 13.1 — Global error handling

- [ ] 

1. Wrap app in error boundary (optional)
2. For network errors: show "Check your connection" + Retry
3. For 401: redirect to login
4. **Verify:** Errors don't crash app; user sees recoverable message

---

### Step 13.2 — Placeholder for dead images

- [ ] 

1. Use `Image` component with `onError` handler
2. On error: show fallback image (e.g. `assets/placeholder-card.png`)
3. **Verify:** Broken image URLs don't show broken icon; placeholder appears

---

### Step 13.3 — Haptic feedback on swipe

- [ ] 

1. Import `expo-haptics`
2. On like: `Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)`
3. On skip: `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`
4. **Verify:** Device vibrates on swipe (on physical device)

---

## Phase 14: Testing (optional for MVP)

### Step 14.1 — Unit test: updateTagScores

- [ ] 

1. Create `__tests__/tagScoring.test.js`
2. Test cases from lowLevelDoc Section 13.1
3. Run: `npm test` (if Jest configured)
4. **Verify:** All tests pass

---

### Step 14.2 — Integration test: swipe flow

- [ ] 

1. Use Supabase local or test project
2. Seed test data; create test user
3. Call swipe-feed, submit-swipe, my-style in sequence
4. Assert profile tag_scores updated
5. **Verify:** Integration test passes

---

## Phase 15: Deployment

### Step 15.1 — EAS Build setup

- [ ] 

1. Run: `npm install -g eas-cli`
2. Run: `eas login`
3. Run: `eas build:configure`
4. **Verify:** `eas.json` created

---

### Step 15.2 — Build for iOS (TestFlight)

- [ ] 

1. Run: `eas build --platform ios --profile preview`
2. Wait for build to complete
3. Run: `eas submit --platform ios` to upload to TestFlight
4. **Verify:** Build appears in Expo dashboard; TestFlight receives build

---

### Step 15.3 — Build for Android

- [ ] 

1. Run: `eas build --platform android --profile preview`
2. Download APK or submit to Play Store
3. **Verify:** APK runs on device

---

## Quick reference: File checklist

| File / path | Purpose |
|-------------|---------|
| `.env` | Supabase URL + anon key (never commit) |
| `lib/supabase.js` | Supabase client |
| `app/(tabs)/_layout.jsx` | Tab navigator |
| `app/(tabs)/index.jsx` | Discover (swipe) screen |
| `app/(tabs)/my-style.jsx` | My Style screen |
| `app/(tabs)/recommendations.jsx` | Recommendations screen |
| `app/(tabs)/profile.jsx` | Profile screen |
| `app/onboarding/` | Onboarding stack |
| `hooks/useSwipeFeed.js` | Swipe feed + submit logic |
| `components/SwipeCard.jsx` | Gesture + animation card |
| `supabase/migrations/` | Database schema + RLS (versioned) |
| `supabase/functions/swipe-feed/` | Edge Function |
| `supabase/functions/submit-swipe/` | Edge Function |
| `supabase/functions/my-style/` | Edge Function |
| `supabase/functions/recommendations/` | Edge Function |
| `data/mock-inspiration.json` | Seed data |
| `data/mock-products.json` | Seed data |

---

## Cross-reference to lowLevelDoc

| Topic | lowLevelDoc section |
|-------|---------------------|
| Tag taxonomy (full list) | 2.1 |
| Learning constants (boost, penalty, decay) | 2.3 |
| Style DNA derivation | 2.3 |
| Content pipeline, mock format | 3 |
| Shopify integration | 4 |
| Full DDL | 5 |
| API contracts | 6 |
| Edge Function logic | 7 |
| Auth, RLS | 8 |
| UI/component spec | 9 |
| Client state, useSwipeFeed | 10 |
| Env vars | 11 |
| Testing | 13 |
| Appendix (seed script, tagScoring, Shopify sync) | 17 |

---

This plan, when followed step-by-step, produces a working StyleSwipe app from scratch. Adjust steps if your project already has some pieces (e.g. skip Phase 1 if Expo is set up).
