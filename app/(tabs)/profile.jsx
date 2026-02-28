import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { TAXONOMY, getAllTags } from '../../constants/tags';
import { spacing, colors, typography, radii, minTouchTarget } from '../../constants/theme';

const CATEGORY_LABELS = {
  style: 'Style',
  color: 'Color',
  material: 'Material',
  occasion: 'Occasion',
  category: 'Category',
  fit: 'Fit',
  pattern: 'Pattern',
};

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('tag_scores, preferred_styles, preferred_colors, preferred_categories')
        .eq('id', user.id)
        .single();
      if (fetchError) throw fetchError;
      setProfile(data);
      const scores = data?.tag_scores ?? {};
      const preferred = new Set([
        ...(data?.preferred_styles ?? []),
        ...(data?.preferred_colors ?? []),
        ...(data?.preferred_categories ?? []),
      ]);
      const withScores = new Set(
        Object.entries(scores)
          .filter(([, v]) => typeof v === 'number' && v > 0)
          .map(([k]) => k)
      );
      setSelectedTags(new Set([...preferred, ...withScores]));
    } catch (e) {
      setError(e?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace('/sign-up');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
    setSaveMessage(null);
  };

  const handleSavePreferences = async () => {
    if (!user?.id) return;
    setSaveLoading(true);
    setSaveMessage(null);
    try {
      const current = profile?.tag_scores ?? {};
      const newScores = {};
      const allTags = getAllTags();
      for (const tag of allTags) {
        if (selectedTags.has(tag)) {
          newScores[tag] = Math.max(current[tag] ?? 0, 0.5);
        } else {
          newScores[tag] = 0;
        }
      }
      const preferred_styles = TAXONOMY.style.filter((t) => selectedTags.has(t));
      const preferred_colors = TAXONOMY.color.filter((t) => selectedTags.has(t));
      const preferred_categories = TAXONOMY.category.filter((t) => selectedTags.has(t));

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          tag_scores: newScores,
          preferred_styles,
          preferred_colors,
          preferred_categories,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      setProfile((p) => ({
        ...p,
        tag_scores: newScores,
        preferred_styles,
        preferred_colors,
        preferred_categories,
      }));
      setSaveMessage('Saved');
    } catch (e) {
      setSaveMessage(e?.message ?? 'Failed to save');
    } finally {
      setSaveLoading(false);
    }
  };

  const padding = {
    paddingTop: insets.top + spacing.lg,
    paddingBottom: insets.bottom + spacing.xl,
    paddingHorizontal: spacing.xl + Math.max(insets.left, insets.right),
  };

  if (!user) return null;

  if (loading && !profile) {
    return (
      <View style={[styles.container, padding]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View style={[styles.container, padding]}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadProfile}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const initial = user?.email ? user.email.trim().charAt(0).toUpperCase() : '?';

  return (
    <ScrollView
      style={[styles.container, padding]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.email} numberOfLines={1}>
          {user?.email ?? ''}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Adjust your tags</Text>
        <Text style={styles.sectionSubtitle}>
          Select tags that match your preferences. They influence your feed and recommendations.
        </Text>
        {Object.entries(TAXONOMY).map(([key, tags]) => (
          <View key={key} style={styles.categoryBlock}>
            <Text style={styles.categoryLabel}>{CATEGORY_LABELS[key] ?? key}</Text>
            <View style={styles.chipRowWrap}>
              {tags.map((tag) => {
                const selected = selectedTags.has(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagChip, selected && styles.tagChipSelected]}
                    onPress={() => toggleTag(tag)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tagChipText, selected && styles.tagChipTextSelected]}>
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        {saveMessage ? (
          <Text style={saveMessage === 'Saved' ? styles.saveSuccess : styles.saveError}>
            {saveMessage}
          </Text>
        ) : null}
        <TouchableOpacity
          style={[styles.saveButton, saveLoading && styles.saveButtonDisabled]}
          onPress={handleSavePreferences}
          disabled={saveLoading}
          activeOpacity={0.8}
        >
          {saveLoading ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text style={styles.saveButtonText}>Save preferences</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutButtonText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  retryButtonText: {
    ...typography.link,
    color: colors.primary,
  },
  avatarRow: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: {
    ...typography.title,
    fontSize: 28,
    color: colors.text,
  },
  email: {
    ...typography.body,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.title,
    fontSize: 20,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  categoryBlock: {
    marginBottom: spacing.lg,
  },
  categoryLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  chipRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagChipText: {
    ...typography.caption,
    color: colors.text,
  },
  tagChipTextSelected: {
    color: colors.primaryForeground,
  },
  saveSuccess: {
    ...typography.caption,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  saveError: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.md,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.primaryForeground,
  },
  logoutButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButtonText: {
    ...typography.link,
    color: colors.error,
  },
});
