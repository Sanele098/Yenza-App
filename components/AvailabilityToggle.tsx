import { View, Text, StyleSheet } from 'react-native';
import { Switch } from 'react-native';
import { COLORS, FONTS, SPACING } from '@/constants/theme';

interface AvailabilityToggleProps {
  available: boolean;
  onToggle: () => void;
}

export function AvailabilityToggle({ available, onToggle }: AvailabilityToggleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={[styles.dot, { backgroundColor: available ? COLORS.success : COLORS.textMuted }]} />
        <Text style={styles.label}>Available for work</Text>
      </View>
      <Switch
        value={available}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.border, true: COLORS.primary }}
        thumbColor={available ? '#FFFFFF' : '#FFFFFF'}
        ios_backgroundColor={COLORS.border}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: COLORS.text,
  },
});
