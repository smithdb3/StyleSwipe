import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { radii, colors } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

/**
 * SwipeCard — displays a single inspiration item as a full-screen card.
 *
 * TODO (Phase 3, §9.2): Wrap with react-native-gesture-handler PanGestureHandler
 * and react-native-reanimated Animated.View for swipe physics.
 *
 * @param {{ item: { image_url: string, id: string } }} props
 */
export function SwipeCard({ item }) {
  return (
    <View style={styles.card}>
      <Image
        source={{ uri: item.image_url }}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: width,
    height: height,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
