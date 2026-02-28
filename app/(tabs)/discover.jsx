import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useSwipeFeed } from '../../hooks/useSwipeFeed';
import { SwipeCardStack } from '../../components/SwipeCardStack';
import { spacing, colors, typography, radii, minTouchTarget } from '../../constants/theme';

/**
 * Discover screen — full-screen swipe feed (Phase 8).
 * Uses useSwipeFeed and SwipeCardStack; loading, error, and empty states.
 */
export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { queue, loading, error, submitSwipe, fetchMore, undoLastSwipe } = useSwipeFeed(user?.id, 20);
  const [activeFilter, setActiveFilter] = useState(null);
  const [swipeCount, setSwipeCount] = useState(0);

  const padding = {
    paddingTop: insets.top + spacing.lg,
    paddingBottom: insets.bottom + spacing.xl,
    paddingHorizontal: spacing.xl + Math.max(insets.left, insets.right),
  };

  const handleSwipe = async (itemId, direction) => {
    setSwipeCount((prev) => prev + 1);
    await submitSwipe(itemId, direction);
  };

  const FILTERS = ['All', 'tops', 'bottoms', 'shoes', 'outerwear', 'dresses', 'accessories'];

  const filteredQueue = activeFilter
    ? queue.filter(item => item.tags?.includes(activeFilter))
    : queue;

  const topItem = filteredQueue[0];

  if (!user) {
    return null;
  }

  return (
    <View style={[styles.container, padding]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/logo_cropped.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Discover</Text>
        </View>
        <Text style={styles.counter}>{swipeCount}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f}
            style={[
              styles.chip,
              activeFilter === (f === 'All' ? null : f) && styles.chipActive,
            ]}
            onPress={() => setActiveFilter(f === 'All' ? null : f)}
          >
            <Text
              style={[
                styles.chipText,
                activeFilter === (f === 'All' ? null : f) && styles.chipTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.stackWrap}>
        {loading && queue.length === 0 ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>Something went wrong</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => fetchMore(20)}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <SwipeCardStack
            items={filteredQueue}
            onSwipe={handleSwipe}
            renderEmpty={() => (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyTitle}>No more inspiration for now</Text>
              </View>
            )}
          />
        )}
      </View>

      {filteredQueue.length > 0 && (
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={undoLastSwipe} style={styles.actionButton}>
            <Ionicons name="arrow-undo" size={22} color={colors.text} />
            <Text style={styles.actionLabel}>Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => topItem?.buy_url && Linking.openURL(topItem.buy_url)}
            style={[styles.actionButton, !topItem?.buy_url && styles.actionButtonDisabled]}
          >
            <Ionicons name="bag-outline" size={22} color={colors.text} />
            <Text style={styles.actionLabel}>Shop</Text>
          </TouchableOpacity>
        </View>
      )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  logo: {
    width: 32,
    height: 32,
  },
  title: {
    ...typography.title,
    fontSize: 28,
    color: colors.text,
  },
  counter: {
    ...typography.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  filtersScroll: {
    marginBottom: spacing.lg,
    marginHorizontal: -spacing.xl,
  },
  filtersContent: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.label,
    color: colors.text,
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.primaryForeground,
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
    borderRadius: radii.button,
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
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: minTouchTarget,
    minWidth: 60,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.text,
    fontSize: 12,
  },
});
