import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useSwipeFeed } from '../../hooks/useSwipeFeed';
import { SwipeCardStack } from '../../components/SwipeCardStack';
import { spacing, colors, typography, radii, minTouchTarget } from '../../constants/theme';

export default function OnboardingSwipeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { queue, loading, error, submitSwipe } = useSwipeFeed(user?.id, 20);

  const handleSwipe = async (itemId, direction) => {
    await submitSwipe(itemId, direction);
  };

  const handleDone = () => {
    router.replace('/onboarding/done');
  };

  const padding = {
    paddingTop: insets.top + spacing.lg,
    paddingBottom: insets.bottom + spacing.xl,
    paddingHorizontal: spacing.xl + Math.max(insets.left, insets.right),
  };

  if (!user) {
    return null;
  }

  return (
    <View style={[styles.container, padding]}>
      <View style={styles.header}>
        <Text style={styles.title}>Discover your style</Text>
        <Text style={styles.subtitle}>
          Swipe on looks you love. We'll learn your taste.
        </Text>
      </View>

      <View style={styles.stackWrap}>
        {loading && queue.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error.message}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => {}}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SwipeCardStack
            items={queue}
            onSwipe={handleSwipe}
            renderEmpty={() => (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>All done swiping!</Text>
              </View>
            )}
          />
        )}
      </View>

      <TouchableOpacity
        style={styles.doneButton}
        onPress={handleDone}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Done"
      >
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.title,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stackWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 320,
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
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    ...typography.link,
    color: colors.primary,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 22,
    color: colors.text,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.lg,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonText: {
    ...typography.button,
    color: colors.primaryForeground,
  },
});
