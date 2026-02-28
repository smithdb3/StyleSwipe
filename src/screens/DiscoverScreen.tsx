import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useStore } from '../store/index';
import { SwipeDeck } from '../components/SwipeDeck';
import { extractTags } from '../engine/tagExtractor';

interface DiscoverScreenProps {
  navigation: any;
}

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({ navigation }) => {
  const profile = useStore(s => s.profile);
  const swipeQueue = useStore(s => s.swipeQueue);
  const isLoadingFeed = useStore(s => s.isLoadingFeed);
  const loadFeed = useStore(s => s.loadFeed);
  const updateProfileOnSwipe = useStore(s => s.updateProfileOnSwipe);
  const saveItem = useStore(s => s.saveItem);

  useEffect(() => {
    // Load initial feed on mount if empty
    if (swipeQueue.length === 0 && !isLoadingFeed) {
      loadFeed(true);
    }
  }, []);

  const handleSwipe = async (productId: string, direction: 'left' | 'right') => {
    const product = swipeQueue.find(p => p.id === productId);
    if (!product) return;

    const tags = extractTags(product);

    // Update profile
    await updateProfileOnSwipe(productId, direction === 'right' ? 'like' : 'skip', tags);

    // Save item if swiped right
    if (direction === 'right') {
      await saveItem(product);
    }
  };

  const handleSwipeDeckSwipe = (product: any, direction: 'left' | 'right') => {
    handleSwipe(product.id, direction);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>StyleSwipe</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyStyle')}>
          <Text style={styles.headerLink}>💾 My Style</Text>
        </TouchableOpacity>
      </View>

      <SwipeDeck
        products={swipeQueue}
        isLoading={isLoadingFeed}
        onSwipe={handleSwipeDeckSwipe}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  headerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
});
