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
import { supabase } from '../../lib/supabase';
import { spacing, colors, typography, radii, minTouchTarget } from '../../constants/theme';

export default function StylePickerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { queue, loading, error, submitSwipe, fetchMore } = useSwipeFeed(user?.id, 20);
  const [doneLoading, setDoneLoading] = useState(false);
  const [doneError, setDoneError] = useState(null);

  const handleDone = async () => {
    if (!user?.id) return;
    setDoneError(null);
    setDoneLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ has_onboarded: true })
        .eq('id', user.id);
      if (updateError) throw updateError;
      router.replace('/(tabs)/discover');
    } catch (err) {
      setDoneError(err.message || 'Something went wrong');
    } finally {
      setDoneLoading(false);
    }
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
      <Text style={styles.title}>Swipe on looks you like</Text>
      <Text style={styles.subtitle}>
        Your choices help us personalize your feed. You can always swipe more later.
      </Text>

      <View style={styles.stackWrap}>
        {loading && queue.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error.message}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchMore(20)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SwipeCardStack
            items={queue}
            onSwipe={submitSwipe}
            renderEmpty={() => (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>No more for now</Text>
                <Text style={styles.emptySubtitle}>Tap Done below to continue</Text>
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.footer}>
        {doneError ? (
          <Text style={styles.doneError}>{doneError}</Text>
        ) : null}
        <TouchableOpacity
          style={[styles.doneButton, doneLoading && styles.doneButtonDisabled]}
          onPress={handleDone}
          disabled={doneLoading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Done"
        >
          {doneLoading ? (
            <ActivityIndicator color={colors.primaryForeground} size="small" />
          ) : (
            <Text style={styles.doneButtonText}>Done</Text>
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
    marginBottom: spacing.xl,
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
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    ...typography.subtitle,
    color: colors.textSecondary,
  },
  footer: {
    marginTop: spacing.xl,
  },
  doneError: {
    ...typography.caption,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  doneButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.lg,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  doneButtonDisabled: {
    opacity: 0.6,
  },
  doneButtonText: {
    ...typography.button,
    color: colors.primaryForeground,
  },
});
