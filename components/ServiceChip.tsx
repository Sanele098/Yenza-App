import { Text, StyleSheet } from 'react-native';
import { Pressable } from 'react-native';
import { JobCategory } from '@/types';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

interface ServiceChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: React.ReactNode;
}

export function ServiceChip({ label, selected, onPress, icon }: ServiceChipProps) {
  return (
    <Pressable
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      disabled={!onPress}
    >
      {icon}
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 1,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  chipSelected: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  text: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.text,
  },
  textSelected: {
    color: COLORS.primary,
    fontFamily: FONTS.semiBold,
  },
});
