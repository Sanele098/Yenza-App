import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Navigation } from 'lucide-react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

interface DirectionsButtonProps {
  distanceKm: number;
  onPress: () => void;
  variant?: 'icon' | 'full';
}

export function DirectionsButton({ distanceKm, onPress, variant = 'icon' }: DirectionsButtonProps) {
  if (variant === 'full') {
    return (
      <Pressable style={styles.fullButton} onPress={onPress}>
        <Navigation size={18} color={COLORS.card} strokeWidth={2.2} />
        <Text style={styles.fullText}>Get Directions</Text>
      </Pressable>
    );
  }

  return (
    <Pressable style={styles.iconButton} onPress={onPress} hitSlop={8}>
      <Navigation size={18} color={COLORS.secondary} strokeWidth={2.2} />
      <Text style={styles.iconText}>{distanceKm} km</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.text,
  },
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  fullText: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.card,
  },
});
