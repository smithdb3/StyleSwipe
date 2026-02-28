import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { ShopifyProduct } from '../types/index';

const { width, height } = Dimensions.get('window');

interface SwipeCardProps {
  product: ShopifyProduct;
  onPress?: () => void;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({ product, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.95}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: product.image }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.overlay}>
          <View style={styles.info}>
            <Text style={styles.brand} numberOfLines={1}>
              {product.brand}
            </Text>
            <Text style={styles.title} numberOfLines={2}>
              {product.title}
            </Text>
            <Text style={styles.price}>{product.price}</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.instruction}>Swipe right to love • Swipe left to skip</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    height: height * 0.6,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  info: {
    gap: 4,
  },
  brand: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  price: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  instruction: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
