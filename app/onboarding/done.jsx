import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { spacing, colors, typography, radii, minTouchTarget } from '../../constants/theme';

export default function DoneScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ has_onboarded: true })
        .eq('id', user.id);

      if (error) throw error;
      router.replace('/(tabs)/discover');
    } catch (err) {
      console.error('Complete onboarding failed:', err);
      setLoading(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + spacing.xxl,
          paddingBottom: insets.bottom + spacing.xl,
          paddingHorizontal: spacing.xl + Math.max(insets.left, insets.right),
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/logo_cropped.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.subtitle}>
          We've learned your style. Now let's find you amazing pieces.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleStart}
          disabled={loading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Start finding my style"
        >
          {loading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text style={styles.primaryButtonText}>Start finding my style</Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: spacing.xxl,
  },
  logo: {
    width: 125,
    height: 125,
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
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    gap: spacing.md,
  },
  primaryButton: {
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
  primaryButtonText: {
    ...typography.button,
    color: colors.primaryForeground,
  },
});
