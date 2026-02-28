import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SwipeCard, CARD_DIMENSIONS } from './SwipeCard';
import { colors, typography } from '../constants/theme';

const { width: CARD_WIDTH, height: CARD_HEIGHT } = CARD_DIMENSIONS;

/**
 * Back card: shows the next item's image when we're in "exiting" state.
 * Only rendered when exitingItemId is set and visible[1] exists.
 */
function BackCardWithImage({ item }) {
  const [imageError, setImageError] = useState(false);
  if (!item?.image_url) return null;
  return (
    <View style={styles.backCard}>
      {imageError ? (
        <View style={styles.backCardPlaceholder} />
      ) : (
        <Image
          source={{ uri: item.image_url }}
          style={styles.backCardImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      )}
    </View>
  );
}

export function SwipeCardStack({ items, onSwipe, renderEmpty }) {
  const [exitingItemId, setExitingItemId] = useState(null);
  const [exitDirection, setExitDirection] = useState(null);

  const visible = items.slice(0, 3);
  const displayTop = visible[0]; // Always first item until parent removes it
  const nextItem = visible[1];

  // Prefetch next card's image so it's ready when we reveal it
  useEffect(() => {
    if (nextItem?.image_url) {
      Image.prefetch(nextItem.image_url).catch(() => {});
    }
  }, [nextItem?.image_url]);

  const handleSwipeStart = useCallback((itemId, direction) => {
    setExitingItemId(itemId);
    setExitDirection(direction);
  }, []);

  const handleExitComplete = useCallback(
    (itemId, direction) => {
      onSwipe(itemId, direction);
    },
    [onSwipe]
  );

  // Clear exiting state only after parent has removed the item from the list
  useEffect(() => {
    if (!exitingItemId) return;
    if (!items.some((i) => i.id === exitingItemId)) {
      setExitingItemId(null);
      setExitDirection(null);
    }
  }, [exitingItemId, items]);

  if (items.length === 0) {
    if (renderEmpty) return renderEmpty();
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No more for now</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* When exiting: show next card with image behind the sliding top card */}
      {exitingItemId && nextItem ? (
        <View style={styles.backCardWrap}>
          <BackCardWithImage item={nextItem} />
        </View>
      ) : null}
      {/* Optional: gray placeholders when not exiting (behind top card) */}
      {!exitingItemId && visible.length > 1 ? (
        visible.slice(1, 3).map((item, index) => (
          <View
            key={`back-${index}-${item.id}`}
            style={[styles.backCard, styles.backCardPlaceholderOnly, { zIndex: 2 - index }]}
          >
            <View style={styles.cardPlaceholder} />
          </View>
        ))
      ) : null}
      {/* Top card (always visible[0]); same instance animates off when isExiting */}
      {displayTop ? (
        <View style={styles.topCard}>
          <SwipeCard
            key={displayTop.id}
            item={displayTop}
            enabled={!exitingItemId}
            isExiting={exitingItemId === displayTop.id}
            exitDirection={exitingItemId === displayTop.id ? exitDirection : null}
            onSwipeStart={handleSwipeStart}
            onExitComplete={handleExitComplete}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + 40,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  topCard: {
    position: 'absolute',
    zIndex: 3,
  },
  backCardWrap: {
    position: 'absolute',
    top: 0,
    zIndex: 1,
  },
  backCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  backCardPlaceholderOnly: {
    position: 'absolute',
    top: 0,
  },
  backCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  backCardPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  cardPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    backgroundColor: '#e8e8e8',
  },
  empty: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
  },
});
