import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Image,
  useWindowDimensions,
  Linking,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useRecommendations } from '../../hooks/useRecommendations';
import { spacing, colors, typography, radii, minTouchTarget } from '../../constants/theme';

const NUM_COLUMNS = 2;
const IMAGE_ASPECT = 5 / 4; // height : width = 5 : 4

function ProductCard({ product, itemWidth, onBuyNow }) {
  const imageHeight = itemWidth * IMAGE_ASPECT;
  if (!product) return null;
  const raw = product.price;
  const priceDisplay =
    raw != null && raw !== ''
      ? typeof raw === 'string' && (raw.startsWith('$') || isNaN(Number(raw)))
        ? raw
        : `$${Number(raw).toFixed(2)}`
      : '—';

  return (
    <View style={[styles.card, { width: itemWidth }]}>
      <Image
        source={{ uri: product.image_url }}
        style={[styles.cardImage, { height: imageHeight }]}
        resizeMode="cover"
      />
      <View style={styles.cardInfo}>
        {product.brand ? (
          <Text style={styles.brand} numberOfLines={1}>
            {product.brand}
          </Text>
        ) : null}
        <Text style={styles.cardTitle} numberOfLines={2}>
          {product.title ?? ''}
        </Text>
        <Text style={styles.price}>{priceDisplay}</Text>
        <TouchableOpacity
          style={styles.buyButton}
          onPress={() => onBuyNow(product)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Buy Now"
        >
          <Text style={styles.buyButtonText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function RecommendationsScreen() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { user } = useAuth();
  const { items, loading, error, refetch } = useRecommendations(user?.id, 20);
  const [refreshing, setRefreshing] = useState(false);

  const horizontalPadding = spacing.xl + Math.max(insets.left, insets.right);
  const gap = spacing.sm;
  const contentWidth = windowWidth - horizontalPadding * 2;
  const itemWidth = (contentWidth - gap) / NUM_COLUMNS;

  const padding = {
    paddingTop: insets.top + spacing.lg,
    paddingBottom: insets.bottom + spacing.xl,
    paddingHorizontal: horizontalPadding,
  };

  const handleBuyNow = (product) => {
    if (product?.buy_url) Linking.openURL(product.buy_url);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (!user) {
    return null;
  }

  if (loading && items.length === 0) {
    return (
      <View style={[styles.container, padding]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, padding]}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>Something went wrong</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={[styles.container, padding]}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Swipe more to get recommendations</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, padding]}>
      <FlatList
        data={items}
        numColumns={NUM_COLUMNS}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={[styles.row, { marginBottom: gap }]}
        contentContainerStyle={styles.gridContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        renderItem={({ item }) => (
          <ProductCard product={item} itemWidth={itemWidth} onBuyNow={handleBuyNow} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...typography.body,
    color: colors.error,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    borderRadius: radii.button,
  },
  retryButtonText: {
    ...typography.link,
    color: colors.primary,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 22,
    color: colors.text,
    textAlign: 'center',
  },
  gridContent: {
    paddingBottom: spacing.xl,
  },
  row: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    backgroundColor: colors.border,
  },
  cardInfo: {
    padding: spacing.sm,
  },
  brand: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  cardTitle: {
    ...typography.caption,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  price: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  buyButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.button,
    paddingVertical: spacing.sm,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyButtonText: {
    ...typography.button,
    color: colors.primaryForeground,
  },
});

