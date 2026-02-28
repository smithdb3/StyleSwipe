import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';

interface StyleDNABadgeProps {
  tags: Array<[string, number]>;
}

export const StyleDNABadge: React.FC<StyleDNABadgeProps> = ({ tags }) => {
  const renderTag = ({ item }: { item: [string, number] }) => {
    const [tagName, score] = item;
    const percentage = Math.round(score * 100);

    return (
      <View style={styles.tagContainer}>
        <View style={styles.tagLabel}>
          <Text style={styles.tagName}>
            {tagName.charAt(0).toUpperCase() + tagName.slice(1)}
          </Text>
          <Text style={styles.tagScore}>{percentage}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${percentage}%` },
            ]}
          />
        </View>
      </View>
    );
  };

  if (tags.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>
          Start swiping to discover your style DNA
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Style DNA</Text>
      <FlatList
        data={tags}
        renderItem={renderTag}
        keyExtractor={(item) => item[0]}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  tagContainer: {
    gap: 6,
  },
  tagLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textTransform: 'capitalize',
  },
  tagScore: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000',
    borderRadius: 2,
  },
  empty: {
    paddingHorizontal: 16,
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
