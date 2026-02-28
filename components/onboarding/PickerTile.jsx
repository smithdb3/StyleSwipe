import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, typography, radii, spacing, minTouchTarget } from '../../constants/theme';

/**
 * PickerTile — a selectable multi-choice tile used across all onboarding picker steps
 * (Style Picker, Color Picker, Category Picker).
 *
 * @param {{ label: string, selected: boolean, onPress: () => void }} props
 */
export function PickerTile({ label, selected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.tile, selected && styles.selected]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    margin: spacing.xs,
    backgroundColor: colors.background,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  labelSelected: {
    color: colors.primaryForeground,
  },
});
