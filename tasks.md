# StyleSwipe — Order of Operations

## Phase 1: Foundation

**Outcome:** Database ready, mock data loaded, auth working.

- [ ] Create Supabase project (`styleswipe-dev`), copy URL and keys to `.env.local`, enable email/password auth
- [ ] Run schema from §5.1 in SQL editor — verify `profiles`, `inspiration_items`, `products`, `swipes` exist
- [ ] Create indexes from §5.3
- [ ] Enable RLS and add policies from §8.3
- [ ] Create `data/mock-inspiration.json` and `data/mock-products.json` (20+ items each)
- [ ] Run seed script (Appendix A.1) or manually insert mock data via SQL
- [ ] Verify: `SELECT COUNT(*) FROM inspiration_items;` returns ≥ 20
- [ ] Sign up a test user, verify profile auto-creation, store JWT for testing

---

## Phase 2: Backend Logic

**Outcome:** All Edge Functions deployed, tag scoring working.

- [ ] Implement `updateTagScores()` helper (Appendix A.2) and unit tests
- [ ] Create `swipe-feed` Edge Function (skeleton from §7.1)
- [ ] Deploy `swipe-feed`, test with curl
- [ ] Create `submit-swipe` Edge Function (insert swipe + update profile via helper)
- [ ] Test: POST swipe, verify `profiles.tag_scores` updates
- [ ] Create `my-style` Edge Function (liked inspiration items)
- [ ] Create `recommendations` Edge Function (scoring, cold start, ranking)
- [ ] (Optional) Create `sync-shopify-products` for Shopify integration
- [ ] Set Edge Function secrets (§11.2)

---

## Phase 3: Client

**Outcome:** Mobile app wired to Edge Functions, swipe flow working.

- [ ] Initialize Expo project, add Supabase client, auth screens (signup/login)
- [ ] Implement onboarding flow (Welcome → Style → Color → Category pickers)
- [ ] Build swipe card component (gesture-handler + reanimated, §9.2)
- [ ] Build Discover screen: call `swipe-feed`, `submit-swipe`, queue management
- [ ] Build My Style screen (grid + Style DNA)
- [ ] Build Recommendations screen (product grid + Buy Now)
- [ ] Build Profile screen (logout, theme, account)
- [ ] Add loading, empty, and error states (§9.5)

---

## Phase 4: Testing & Polish

**Outcome:** Tests passing, no obvious bugs, ready for demo.

- [ ] Unit tests: tag scoring, Style DNA, tag normalization
- [ ] Integration tests: swipe feed, submit-swipe, my-style, recommendations
- [ ] E2E flow test: login → onboarding → swipe → My Style → Recommendations
- [ ] Polish: empty states, error handling, placeholder images for dead URLs

---

## Quick Start (≈30 min)

**First working feature:** Swipe feed returning 5 inspiration items (no ranking yet).

- [ ] Create Supabase project
- [ ] Run schema (§5.1) + RLS (§8.3)
- [ ] Seed mock data (§2.3)
- [ ] Deploy `swipe-feed` skeleton (§6.1–6.4)
- [ ] Set env secrets (§11)
- [ ] Test: `curl -H "Authorization: Bearer $JWT" .../swipe-feed?user_id=UUID&limit=5`
- [ ] Wire client to Edge Functions

---

## Key Dependencies

- **Step 9 before 12:** `updateTagScores` is used by `submit-swipe`
- **Step 10 before 21:** `swipe-feed` must exist before Discover can call it
- **Step 18 before 19–25:** Auth + Supabase client must be in place before screens
- **Step 20 before 21:** Swipe card component is needed for Discover
