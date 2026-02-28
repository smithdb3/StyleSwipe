import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SwipeCard, CARD_DIMENSIONS } from './SwipeCard';
import { colors, typography } from '../constants/theme';

const { width: CARD_WIDTH, height: CARD_HEIGHT } = CARD_DIMENSIONS;

export function SwipeCardStack({ items, onSwipe, renderEmpty }) {
  const [exitingId, setExitingId] = useState(null);
  const [exitDirection, setExitDirection] = useState(null);

  const topItem = items[0] ?? null;
  const isExiting = topItem && exitingId === topItem.id;

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
      {/* Back cards - placeholders behind top card */}
      {items.slice(1, 3).map((item, index) => (
        <View
          key={`back-${index}-${item.id}`}
          style={[styles.backCard, { zIndex: 2 - index }]}
        >
          <View style={styles.cardPlaceholder} />
        </View>
      ))}
      {/* Single top card: handles drag + exit animation, then onExitComplete */}
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
  backCard: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    top: 0,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  backCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
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
