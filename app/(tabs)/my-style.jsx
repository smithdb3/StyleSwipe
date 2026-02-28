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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useMyStyle } from '../../hooks/useMyStyle';
import { spacing, colors, typography, radii, minTouchTarget } from '../../constants/theme';
import { isNetworkError } from '../../lib/errorUtils';

const NUM_COLUMNS = 2;
const ASPECT_RATIO = 5 / 4; // height : width = 5 : 4

function StyleDnaBanner({ topTags }) {
  if (topTags.length === 0) return null;
  return (
    <View style={styles.dnaWrap}>
      <Text style={styles.dnaLabel}>Your style:</Text>
      <View style={styles.chipRow}>
        {topTags.map((tag) => (
          <View key={tag} style={styles.chip}>
            <Text style={styles.chipText}>{tag}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function GridItem({ item }) {
  const [imageError, setImageError] = useState(false);
  if (!item?.image_url) return null;
  return (
    <View style={styles.gridItem}>
      {imageError ? (
        <View style={styles.gridImagePlaceholder} />
      ) : (
        <Image
          source={{ uri: item.image_url }}
          style={styles.gridImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
        />
      )}
    </View>
  );
}

export default function MyStyleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { user } = useAuth();
  const { items, topTags, loading, error, refetch } = useMyStyle(user?.id);

  const horizontalPadding = spacing.xl + Math.max(insets.left, insets.right);
  const gap = spacing.sm;
  const contentWidth = windowWidth - horizontalPadding * 2;
  const itemWidth = (contentWidth - gap) / NUM_COLUMNS;
  const itemHeight = itemWidth * ASPECT_RATIO;

  const padding = {
    paddingTop: insets.top + spacing.lg,
    paddingBottom: insets.bottom + spacing.xl,
    paddingHorizontal: horizontalPadding,
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
          <Text style={styles.errorText}>
            {isNetworkError(error) ? 'Check your connection' : 'Something went wrong'}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={refetch}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, padding]}>
      <StyleDnaBanner topTags={topTags} />
      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Nothing saved yet — start swiping</Text>
          <TouchableOpacity
            style={styles.discoverLink}
            onPress={() => router.replace('/(tabs)/discover')}
            activeOpacity={0.8}
          >
            <Text style={styles.discoverLinkText}>Go to Discover</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          numColumns={NUM_COLUMNS}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={[styles.row, { marginBottom: gap }]}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <View style={[styles.gridItemWrap, { width: itemWidth, height: itemHeight }]}>
              <GridItem item={item} />
            </View>
          )}
        />
      )}
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
  dnaWrap: {
    marginBottom: spacing.lg,
  },
  dnaLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
  },
  chipText: {
    ...typography.caption,
    color: colors.text,
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
    marginBottom: spacing.lg,
  },
  discoverLink: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    minHeight: minTouchTarget,
    justifyContent: 'center',
  },
  discoverLinkText: {
    ...typography.link,
    color: colors.primary,
  },
  gridContent: {
    paddingBottom: spacing.xl,
  },
  row: {
    gap: spacing.sm,
  },
  gridItemWrap: {
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  gridItem: {
    width: '100%',
    height: '100%',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
  },
});
