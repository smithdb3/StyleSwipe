import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, colors, typography } from '../../constants/theme';

/**
 * Placeholder for Step 7.5 — Category Picker.
 * Replace with multi-select list of categories (pants, shirts, shoes, etc.) → writes preferred_categories.
 * On Complete → upsert profile with has_onboarded=true, navigate to /(tabs)/discover.
 */
export default function CategoryPickerScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.xl,
          paddingHorizontal: spacing.xl + Math.max(insets.left, insets.right),
        },
      ]}
    >
      <Text style={styles.title}>Category Picker</Text>
      <Text style={styles.subtitle}>Step 7.5 — Add categories and Complete → Discover</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.title,
    color: colors.text,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
