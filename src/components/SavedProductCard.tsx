import React from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { SavedItem } from '../types/index';

interface SavedProductCardProps {
  item: SavedItem;
  onRemove: (productId: string) => void;
}

export const SavedProductCard: React.FC<SavedProductCardProps> = ({
  item,
  onRemove,
}) => {
  const handleBuyPress = async () => {
    try {
      const canOpen = await Linking.canOpenURL(item.buyUrl);
      if (canOpen) {
        await Linking.openURL(item.buyUrl);
      } else {
        Alert.alert('Cannot open link', 'Unable to open the product page');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open product link');
    }
  };

  const handleRemove = () => {
    Alert.alert(
      'Remove item',
      'Are you sure you want to remove this item from your style collection?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Remove',
          onPress: () => onRemove(item.productId),
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <Text style={styles.brand} numberOfLines={1}>
          {item.brand}
        </Text>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.price}>{item.price}</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.buyButton]}
            onPress={handleBuyPress}
          >
            <Text style={styles.buyButtonText}>Buy Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.removeButton]}
            onPress={handleRemove}
          >
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 12,
    gap: 8,
  },
  brand: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  price: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: '#000',
  },
  buyButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  removeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
  },
  removeButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});
