import React, { useRef } from 'react';
import { Image, StyleSheet, Dimensions, Text } from 'react-native';
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

export function SwipeCard({ item, onSwipe, enabled = true }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const hasFiredRef = useRef(false);

  const triggerSwipe = (direction, startX, startY, startRotation) => {
    if (hasFiredRef.current) return;
    if (onSwipe && item?.id) {
      hasFiredRef.current = true;
      onSwipe(item.id, direction, startX, startY, startRotation);
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(enabled)
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
        runOnJS(triggerSwipe)('like', startX, startY, startRotation);
      } else if (vx < -VELOCITY_THRESHOLD) {
        runOnJS(triggerSwipe)('skip', startX, startY, startRotation);
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

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(translateX.value / 80, 0), 1),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(-translateX.value / 80, 0), 1),
  }));

  if (!item?.image_url) return null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <Image
          source={{ uri: item.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
        <Animated.View style={[styles.likeLabel, likeOpacity]}>
          <Text style={styles.likeLabelText}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.nopeLabel, nopeOpacity]}>
          <Text style={styles.nopeLabelText}>NOPE</Text>
        </Animated.View>
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
  likeLabel: {
    position: 'absolute',
    top: 16,
    left: 16,
    borderWidth: 3,
    borderColor: '#2ecc71',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: '-15deg' }],
  },
  likeLabelText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2ecc71',
  },
  nopeLabel: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderWidth: 3,
    borderColor: '#e74c3c',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    transform: [{ rotate: '15deg' }],
  },
  nopeLabelText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e74c3c',
  },
});

export const CARD_DIMENSIONS = { width: CARD_WIDTH, height: CARD_HEIGHT };
