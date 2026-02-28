import React, { useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SwipeCard, CardContent, CARD_DIMENSIONS } from './SwipeCard';
import { colors, typography } from '../constants/theme';

const { width: CARD_WIDTH, height: CARD_HEIGHT } = CARD_DIMENSIONS;

const SwipeCardStackComponent = forwardRef(({ items, onSwipe, renderEmpty, onPressLike, onPressSkip }, ref) => {
  const topCardRef = useRef(null);

  const visible = items.slice(0, 3);
  const topItem = visible[0];
  const displayRest = visible.slice(1, 3);

  const handleSwipeFromCard = useCallback(
    (itemId, direction) => {
      onSwipe(itemId, direction);
    },
    [onSwipe]
  );

  const handleProgrammaticLike = useCallback(() => {
    topCardRef.current?.swipe?.('like');
  }, []);

  const handleProgrammaticSkip = useCallback(() => {
    topCardRef.current?.swipe?.('skip');
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      swipeLike: handleProgrammaticLike,
      swipeSkip: handleProgrammaticSkip,
    }),
    [handleProgrammaticLike, handleProgrammaticSkip]
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
      {/* Back cards - full content (image + tags) so next card is visible and consistent when it becomes top */}
      {displayRest.map((item, index) => (
        <View
          key={`back-${index}-${item.id}`}
          style={[styles.backCard, { zIndex: 2 - index }]}
        >
          {item?.image_url ? (
            <CardContent item={item} />
          ) : (
            <View style={styles.cardPlaceholder} />
          )}
        </View>
      ))}
      {/* Top card (interactive) - same instance animates off, then onSwipe fires on completion */}
      {topItem ? (
        <View style={styles.topCard}>
          <SwipeCard
            ref={topCardRef}
            key={topItem.id}
            item={topItem}
            onSwipe={handleSwipeFromCard}
            enabled={true}
          />
        </View>
      ) : null}
    </View>
  );
});

export const SwipeCardStack = SwipeCardStackComponent;

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
  backCard: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    top: 0,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
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
