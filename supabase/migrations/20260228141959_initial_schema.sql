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

-- Indexes
CREATE INDEX idx_swipes_user_id ON public.swipes(user_id);
CREATE INDEX idx_swipes_item_id ON public.swipes(item_id);
CREATE INDEX idx_swipes_user_item ON public.swipes(user_id, item_id);
CREATE INDEX idx_inspiration_items_tags ON public.inspiration_items USING GIN(tags);
CREATE INDEX idx_products_tags ON public.products USING GIN(tags);
CREATE INDEX idx_products_external_id ON public.products(external_id);

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