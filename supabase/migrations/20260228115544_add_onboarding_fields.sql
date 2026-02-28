-- Add onboarding questionnaire fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS style_goals text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.profiles.gender IS 'User gender: female, male, non_binary, prefer_not_to_say';
COMMENT ON COLUMN public.profiles.age_range IS 'User age range: 18_24, 25_34, 35_44, 45_54, 55_plus';
COMMENT ON COLUMN public.profiles.style_goals IS 'User style goals/interests: casual, professional, trendy, athletic, minimalist, bohemian, streetwear, classic';
