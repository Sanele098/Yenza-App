import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

interface ProfileCompletionCardProps {
  percentage: number;
  missingItems: string[];
}

export function ProfileCompletionCard({ percentage, missingItems }: ProfileCompletionCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile completion</Text>
        <Text style={styles.percentage}>{percentage}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percentage}%` }]} />
      </View>
      {missingItems.length > 0 && (
        <View style={styles.missingSection}>
          <Text style={styles.missingTitle}>Complete your profile</Text>
          {missingItems.map((item, i) => (
            <Text key={i} style={styles.missingItem}>
              · {item}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md + 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.text,
  },
  percentage: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.primary,
  },
  track: {
    height: 8,
    backgroundColor: COLORS.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  missingSection: {
    marginTop: SPACING.sm + 2,
  },
  missingTitle: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  missingItem: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
  },
});
