import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, colors, typography } from '../../constants/theme';

/**
 * Placeholder for Step 7.4 — Color Picker.
 * Replace with multi-select grid of color swatches → writes preferred_colors.
 * On Next → navigate to /onboarding/category.
 */
export default function ColorPickerScreen() {
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
      <Text style={styles.title}>Color Picker</Text>
      <Text style={styles.subtitle}>Step 7.4 — Add color swatches and Next → Category Picker</Text>
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
