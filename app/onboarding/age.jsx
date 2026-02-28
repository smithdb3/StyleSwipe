import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PickerTile } from '../../components/onboarding/PickerTile';
import { spacing, colors, typography, radii, minTouchTarget } from '../../constants/theme';

const AGE_OPTIONS = ['18-24', '25-34', '35-44', '45-54', '55+'];

export default function AgeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(null);

  const handleSelectAge = (age) => {
    setSelected(age);
  };

  const handleNext = () => {
    if (!selected) return;
    router.push('/onboarding/style-goal');
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
        <Text style={styles.title}>What's your age range?</Text>
        <Text style={styles.subtitle}>
          We use this to tailor your recommendations.
        </Text>

        <View style={styles.grid}>
          {AGE_OPTIONS.map((age) => (
            <PickerTile
              key={age}
              label={age}
              selected={selected === age}
              onPress={() => handleSelectAge(age)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selected && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!selected}
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
