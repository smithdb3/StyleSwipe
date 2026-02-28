import React, { useState, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { SwipeCard, CARD_DIMENSIONS } from './SwipeCard';
import { colors, typography } from '../constants/theme';

const { width: CARD_WIDTH, height: CARD_HEIGHT } = CARD_DIMENSIONS;
const EXIT_DURATION = 200;

const ROTATION_MAX = 15;

function ExitingCard({ item, direction, onComplete, startTranslateX = 0, startTranslateY = 0, startRotation = 0 }) {
  const translateX = useSharedValue(startTranslateX);
  const translateY = useSharedValue(startTranslateY);
  const rotation = useSharedValue(startRotation);
  const SCREEN_WIDTH = Dimensions.get('window').width;
  const itemId = item?.id;
  const complete = () => onComplete(itemId, direction);

  useEffect(() => {
    const toX = direction === 'like' ? SCREEN_WIDTH * 1.2 : -SCREEN_WIDTH * 1.2;
    const toRotation = direction === 'like' ? ROTATION_MAX : -ROTATION_MAX;
    translateX.value = withTiming(toX, { duration: EXIT_DURATION }, () => {
      runOnJS(complete)();
    });
    translateY.value = withTiming(0, { duration: EXIT_DURATION });
    rotation.value = withTiming(toRotation, { duration: EXIT_DURATION });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  if (!item?.image_url) return null;

  return (
    <Animated.View style={[styles.exitingCard, animatedStyle]} pointerEvents="none">
      <Image
        source={{ uri: item.image_url }}
        style={styles.exitingCardImage}
        resizeMode="cover"
      />
    </Animated.View>
  );
}

const SwipeCardStackComponent = forwardRef(({ items, onSwipe, renderEmpty, onPressLike, onPressSkip }, ref) => {
  const [exitingCard, setExitingCard] = useState(null);

  const visible = items.slice(0, 3);
  const displayTop = exitingCard ? visible[1] : visible[0];
  const displayRest = exitingCard ? visible.slice(2, 4) : visible.slice(1, 3);

  const handleSwipeFromCard = useCallback(
    (itemId, direction, startTranslateX = 0, startTranslateY = 0, startRotation = 0) => {
      const cardItem = visible.find((i) => i.id === itemId) || displayTop;
      if (!cardItem) return;
      setExitingCard({
        item: cardItem,
        direction,
        startTranslateX,
        startTranslateY,
        startRotation,
      });
    },
    [visible, displayTop]
  );

  const handleProgrammaticLike = useCallback(() => {
    if (displayTop?.id) {
      handleSwipeFromCard(displayTop.id, 'like', 0, 0, 0);
    }
  }, [displayTop?.id, handleSwipeFromCard]);

  const handleProgrammaticSkip = useCallback(() => {
    if (displayTop?.id) {
      handleSwipeFromCard(displayTop.id, 'skip', 0, 0, 0);
    }
  }, [displayTop?.id, handleSwipeFromCard]);

  useImperativeHandle(ref, () => ({
    swipeLike: handleProgrammaticLike,
    swipeSkip: handleProgrammaticSkip,
  }));

  const handleExitingComplete = useCallback(
    (itemId, direction) => {
      onSwipe(itemId, direction);
      // Don't clear exitingCard here — wait until parent removes the item so we never re-show it
    },
    [onSwipe]
  );

  // Clear exiting overlay only after the item is no longer in the list (parent has updated)
  useEffect(() => {
    if (!exitingCard) return;
    if (!items.some((i) => i.id === exitingCard.item?.id)) {
      setExitingCard(null);
    }
  }, [exitingCard, items]);

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
      {/* Back cards - stacked directly on top of each other (no offset) */}
      {displayTop ? displayRest.map((item, index) => (
        <View
          key={`back-${index}-${item.id}`}
          style={[styles.backCard, { zIndex: 2 - index }]}
        >
          <View style={styles.cardPlaceholder} />
        </View>
      )) : null}
      {/* Top card (interactive) - key forces remount when top changes; hide when only exiting card left */}
      {displayTop ? (
        <View style={styles.topCard}>
          <SwipeCard
            key={displayTop.id}
            item={displayTop}
            onSwipe={handleSwipeFromCard}
            enabled={true}
          />
        </View>
      ) : null}
      {/* Exiting card overlay - animates off while next card is already swipeable */}
      {exitingCard ? (
        <View style={styles.exitingOverlay} pointerEvents="none">
          <ExitingCard
            item={exitingCard.item}
            direction={exitingCard.direction}
            onComplete={handleExitingComplete}
            startTranslateX={exitingCard.startTranslateX}
            startTranslateY={exitingCard.startTranslateY}
            startRotation={exitingCard.startRotation}
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
  exitingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  exitingCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  exitingCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
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
