import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PickerTile } from '../../components/onboarding/PickerTile';
import { spacing, colors, typography, radii, minTouchTarget } from '../../constants/theme';

const GENDER_OPTIONS = ['Female', 'Male', 'Non-binary', 'Prefer not to say'];

export default function GenderScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(null);

  const handleSelectGender = (gender) => {
    setSelected(gender);
  };

  const handleNext = () => {
    if (!selected) return;
    router.push('/onboarding/age');
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
        <Text style={styles.title}>How do you identify?</Text>
        <Text style={styles.subtitle}>
          This helps us personalize your recommendations for you.
        </Text>

        <View style={styles.grid}>
          {GENDER_OPTIONS.map((gender) => (
            <PickerTile
              key={gender}
              label={gender}
              selected={selected === gender}
              onPress={() => handleSelectGender(gender)}
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
