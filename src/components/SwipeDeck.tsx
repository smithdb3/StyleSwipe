import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Text,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ShopifyProduct } from '../types/index';
import { SwipeCard } from './SwipeCard';

const { height } = Dimensions.get('window');

interface SwipeDeckProps {
  products: ShopifyProduct[];
  isLoading: boolean;
  onSwipe: (product: ShopifyProduct, direction: 'left' | 'right') => void;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({
  products,
  isLoading,
  onSwipe,
}) => {
  const currentIndex = useRef(0);

  const handleSwipe = (direction: 'left' | 'right') => {
    if (currentIndex.current >= products.length) return;

    const product = products[currentIndex.current];

    // Haptic feedback
    if (direction === 'right') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Light);
    }

    onSwipe(product, direction);
    currentIndex.current += 1;
  };

  // Simulate swipe by removing top card
  React.useEffect(() => {
    // Reset index when products change (new batch loaded)
    currentIndex.current = 0;
  }, [products]);

  if (isLoading && products.length === 0) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Discovering your style...</Text>
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No more items. Check back soon!</Text>
      </View>
    );
  }

  const currentProduct = products[currentIndex.current];

  return (
    <View style={styles.container}>
      <SwipeCard
        product={currentProduct}
        onPress={() => {
          // Simulate swipe right on press
          handleSwipe('right');
        }}
      />

      <View style={styles.actionHints}>
        <View style={styles.hint}>
          <Text style={styles.hintText}>← Swipe Left</Text>
        </View>
        <View style={[styles.hint, styles.rightHint]}>
          <Text style={styles.hintText}>Swipe Right →</Text>
        </View>
      </View>

      {/* External swipe gesture handling would go here in a real implementation */}
      <View style={styles.cardCount}>
        <Text style={styles.countText}>
          {currentIndex.current + 1} of {products.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  actionHints: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    gap: 32,
  },
  hint: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#ffe6e6',
    alignItems: 'center',
  },
  rightHint: {
    backgroundColor: '#e6ffe6',
  },
  hintText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  cardCount: {
    paddingHorizontal: 16,
  },
  countText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
