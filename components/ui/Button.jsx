import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, typography, radii, minTouchTarget } from '../../constants/theme';

/**
 * Primary action button. Used throughout the app for CTAs.
 *
 * @param {{ label: string, onPress: () => void, loading?: boolean, disabled?: boolean, variant?: 'primary' | 'ghost' }} props
 */
export function Button({ label, onPress, loading = false, disabled = false, variant = 'primary' }) {
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[styles.base, isPrimary ? styles.primary : styles.ghost]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isPrimary ? colors.primaryForeground : colors.textSecondary} />
      ) : (
        <Text style={[styles.label, isPrimary ? styles.labelPrimary : styles.labelGhost]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.button,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  label: {
    ...typography.button,
  },
  labelPrimary: {
    color: colors.primaryForeground,
  },
  labelGhost: {
    color: colors.textSecondary,
  },
});
