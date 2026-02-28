import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { SwipeCard, CARD_DIMENSIONS } from './SwipeCard';
import { colors, typography } from '../constants/theme';

const { width: CARD_WIDTH, height: CARD_HEIGHT } = CARD_DIMENSIONS;

/**
 * Back card: shows the next item's image when we're in "exiting" state.
 * Only rendered when exitingId is set and nextItem exists. Do not reveal next image until current card is decided.
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
  const [exitingId, setExitingId] = useState(null);
  const [exitDirection, setExitDirection] = useState(null);

  const visible = items.slice(0, 3);
  const topItem = items[0] ?? null;
  const nextItem = visible[1];
  const isExiting = topItem && exitingId === topItem.id;

  // Prefetch next card's image so it's ready when we reveal it after swipe
  useEffect(() => {
    if (nextItem?.image_url) {
      Image.prefetch(nextItem.image_url).catch(() => {});
    }
  }, [nextItem?.image_url]);

  const handleSwipeStart = useCallback(
    (itemId, direction, _startX, _startY, _startRotation) => {
      setExitingId(itemId);
      setExitDirection(direction);
    },
    []
  );

  const handleExitComplete = useCallback(
    (itemId, direction) => {
      onSwipe(itemId, direction);
      setExitingId(null);
      setExitDirection(null);
    },
    [onSwipe]
  );

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
      {/* When exiting: show next card image behind the sliding top card (do not reveal until decided) */}
      {exitingId && nextItem ? (
        <View style={styles.backCardWrap}>
          <BackCardWithImage item={nextItem} />
        </View>
      ) : null}
      {/* Gray placeholders when not exiting (behind top card) */}
      {!exitingId && visible.length > 1 ? (
        visible.slice(1, 3).map((item, index) => (
          <View
            key={`back-${index}-${item.id}`}
            style={[styles.backCard, styles.backCardPlaceholderOnly, { zIndex: 2 - index }]}
          >
            <View style={styles.cardPlaceholder} />
          </View>
        ))
      ) : null}
      {/* Top card: same instance animates off when isExiting, then onExitComplete */}
      {topItem ? (
        <View style={styles.topCard}>
          <SwipeCard
            key={topItem.id}
            item={topItem}
            onSwipeStart={handleSwipeStart}
            onExitComplete={handleExitComplete}
            isExiting={isExiting}
            exitDirection={isExiting ? exitDirection : null}
            enabled={!isExiting}
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
