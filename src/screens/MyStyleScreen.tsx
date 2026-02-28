import React, { useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useStore } from '../store/index';
import { SavedProductCard } from '../components/SavedProductCard';
import { StyleDNABadge } from '../components/StyleDNABadge';
import { getTopTags } from '../engine/styleEngine';

interface MyStyleScreenProps {
  navigation: any;
}

export const MyStyleScreen: React.FC<MyStyleScreenProps> = ({ navigation }) => {
  const profile = useStore(s => s.profile);
  const savedItems = useStore(s => s.savedItems);
  const removeItem = useStore(s => s.removeItem);
  const loadSavedItems = useStore(s => s.loadSavedItems);

  useEffect(() => {
    loadSavedItems();
  }, []);

  const topTags = profile ? getTopTags(profile, 5) : [];

  const renderSavedItem = ({ item }: { item: any }) => (
    <SavedProductCard item={item} onRemove={removeItem} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Style</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
          <Text style={styles.headerLink}>🔄 Discover</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={savedItems}
        renderItem={renderSavedItem}
        keyExtractor={item => item.productId}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <StyleDNABadge tags={topTags} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No saved items yet</Text>
            <Text style={styles.emptySubtext}>
              Start swiping to build your style collection
            </Text>
          </View>
        }
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
  listContent: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  columnWrapper: {
    paddingHorizontal: 8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    lineHeight: 20,
  },
});
