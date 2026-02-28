import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { PickerTile } from '../../components/onboarding/PickerTile';
import { supabase } from '../../lib/supabase';
import { spacing, colors, typography, radii, minTouchTarget } from '../../constants/theme';

const COLOR_OPTIONS = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Brown', 'Gray'];

export default function ColorPickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleColor = (color) => {
    const updated = new Set(selected);
    if (updated.has(color)) {
      updated.delete(color);
    } else {
      updated.add(color);
    }
    setSelected(updated);
  };

  const handleNext = async () => {
    if (!user?.id) return;
    setError(null);
    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ preferred_colors: Array.from(selected) })
        .eq('id', user.id);
      if (updateError) throw updateError;
      router.push('/onboarding/category');
    } catch (err) {
      setError(err.message || 'Failed to save colors');
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
        <Text style={styles.title}>What colors do you love?</Text>
        <Text style={styles.subtitle}>
          Select as many as you'd like. This helps us personalize your recommendations.
        </Text>

        <View style={styles.grid}>
          {COLOR_OPTIONS.map((color) => (
            <PickerTile
              key={color}
              label={color}
              selected={selected.has(color)}
              onPress={() => toggleColor(color)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={loading || selected.size === 0}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Next"
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <Text style={styles.buttonText}>Next</Text>
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
