import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PickerTile } from '../../components/onboarding/PickerTile';
import { spacing, colors, typography, radii, minTouchTarget } from '../../constants/theme';

const STYLE_GOAL_OPTIONS = ['Casual', 'Professional', 'Trendy', 'Athletic', 'Minimalist', 'Bohemian', 'Streetwear', 'Classic'];

export default function StyleGoalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(new Set());

  const toggleGoal = (goal) => {
    const updated = new Set(selected);
    if (updated.has(goal)) {
      updated.delete(goal);
    } else {
      updated.add(goal);
    }
    setSelected(updated);
  };

  const handleNext = () => {
    if (selected.size === 0) return;
    router.push('/onboarding/swipe');
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
        <Text style={styles.title}>What style goals do you have?</Text>
        <Text style={styles.subtitle}>
          Select all that apply. This helps us understand your style.
        </Text>

        <View style={styles.grid}>
          {STYLE_GOAL_OPTIONS.map((goal) => (
            <PickerTile
              key={goal}
              label={goal}
              selected={selected.has(goal)}
              onPress={() => toggleGoal(goal)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, selected.size === 0 && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={selected.size === 0}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Next"
        >
          <Text style={styles.buttonText}>Next</Text>
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
