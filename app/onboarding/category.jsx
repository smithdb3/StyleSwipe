import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { PickerTile } from '../../components/onboarding/PickerTile';
import { supabase } from '../../lib/supabase';
import { spacing, colors, typography, radii, minTouchTarget } from '../../constants/theme';

const CATEGORY_OPTIONS = ['Shirts', 'Pants', 'Dresses', 'Shoes', 'Accessories', 'Outerwear', 'Skirts', 'Shorts'];

export default function CategoryPickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleCategory = (category) => {
    const updated = new Set(selected);
    if (updated.has(category)) {
      updated.delete(category);
    } else {
      updated.add(category);
    }
    setSelected(updated);
  };

  const handleComplete = async () => {
    if (!user?.id) return;
    setError(null);
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          has_onboarded: true,
          preferred_categories: Array.from(selected),
        })
        .eq('id', user.id);
      if (updateError) throw updateError;
      router.replace('/(tabs)/discover');
    } catch (err) {
      setError(err.message || 'Failed to save categories');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.xl,
          paddingBottom: insets.bottom + spacing.xl,
          paddingHorizontal: spacing.xl + Math.max(insets.left, insets.right),
        },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <Text style={styles.title}>What do you like to shop for?</Text>
        <Text style={styles.subtitle}>
          Select your favorite categories. You can customize this later.
        </Text>

        <View style={styles.grid}>
          {CATEGORY_OPTIONS.map((category) => (
            <PickerTile
              key={category}
              label={category}
              selected={selected.has(category)}
              onPress={() => toggleCategory(category)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleComplete}
          disabled={loading || selected.size === 0}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Complete"
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <Text style={styles.buttonText}>Complete</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollView: {
    flex: 1,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  footer: {
    gap: spacing.md,
  },
  error: {
    ...typography.caption,
    color: colors.error,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.lg,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.button,
    color: colors.primaryForeground,
  },
});
