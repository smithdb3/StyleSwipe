import React, { useRef, useState, useEffect } from 'react';
import { View, Image, Text, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = (CARD_WIDTH * 5) / 4; // 4:5 aspect
const ROTATION_MAX = 15;
const VELOCITY_THRESHOLD = 400;
const SPRING_CONFIG = { damping: 15, stiffness: 150 };
const EXIT_DURATION = 200;

export function SwipeCard({
  item,
  onSwipe,
  enabled = true,
  isExiting = false,
  exitDirection = null,
  onSwipeStart,
  onExitComplete,
}) {
  const [imageError, setImageError] = useState(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const hasFiredRef = useRef(false);

  // When not exiting: on release with velocity, tell stack to start exit (do not submit yet)
  const triggerSwipeStart = (direction, startX, startY, startRotation) => {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;
    if (onSwipeStart && item?.id) {
      onSwipeStart(item.id, direction, startX, startY, startRotation);
    }
  };

  // Exit animation: run when isExiting becomes true; same card animates off, then onExitComplete
  useEffect(() => {
    if (!isExiting || !exitDirection || !item?.id || !onExitComplete) return;
    const toX = exitDirection === 'like' ? SCREEN_WIDTH * 1.2 : -SCREEN_WIDTH * 1.2;
    const toRotation = exitDirection === 'like' ? ROTATION_MAX : -ROTATION_MAX;
    translateX.value = withTiming(toX, { duration: EXIT_DURATION }, () => {
      runOnJS(onExitComplete)(item.id, exitDirection);
    });
    translateY.value = withTiming(0, { duration: EXIT_DURATION });
    rotation.value = withTiming(toRotation, { duration: EXIT_DURATION });
  }, [isExiting, exitDirection]);

  const panGesture = Gesture.Pan()
    .enabled(enabled && !isExiting)
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY * 0.3;
      rotation.value = (e.translationX / (CARD_WIDTH / 2)) * ROTATION_MAX;
    })
    .onEnd((e) => {
      const vx = e.velocityX;
      const startX = e.translationX;
      const startY = e.translationY * 0.3;
      const startRotation = (startX / (CARD_WIDTH / 2)) * ROTATION_MAX;
      if (vx > VELOCITY_THRESHOLD) {
        runOnJS(triggerSwipeStart)('like', startX, startY, startRotation);
      } else if (vx < -VELOCITY_THRESHOLD) {
        runOnJS(triggerSwipeStart)('skip', startX, startY, startRotation);
      } else {
        translateX.value = withSpring(0, SPRING_CONFIG);
        translateY.value = withSpring(0, SPRING_CONFIG);
        rotation.value = withSpring(0, SPRING_CONFIG);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  if (!item?.image_url) return null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        {imageError ? (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>Image unavailable</Text>
          </View>
        ) : (
          <Image
            source={{ uri: item.image_url }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e5e5',
  },
  placeholderText: {
    fontSize: 14,
    color: '#737373',
  },
});

export const CARD_DIMENSIONS = { width: CARD_WIDTH, height: CARD_HEIGHT };
