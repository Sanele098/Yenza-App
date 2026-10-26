import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, AlertCircle, FileX } from 'lucide-react-native';
import { VerificationItem } from '@/types';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

interface VerificationRowProps {
  item: VerificationItem;
}

const iconFor = (status: VerificationItem['status']) => {
  if (status === 'verified')
    return <CheckCircle2 size={20} color={COLORS.success} strokeWidth={2} />;
  if (status === 'not_verified')
    return <AlertCircle size={20} color={COLORS.warning} strokeWidth={2} />;
  return <FileX size={20} color={COLORS.textMuted} strokeWidth={2} />;
};

const labelFor = (status: VerificationItem['status']) => {
  if (status === 'verified') return 'Verified';
  if (status === 'not_verified') return 'Not verified';
  return 'Not provided';
};

const colorFor = (status: VerificationItem['status']) => {
  if (status === 'verified') return COLORS.success;
  if (status === 'not_verified') return COLORS.warning;
  return COLORS.textMuted;
};

export function VerificationRow({ item }: VerificationRowProps) {
  return (
    <View style={styles.row}>
      {iconFor(item.status)}
      <View style={styles.content}>
        <Text style={styles.label}>{item.label}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
      <Text style={[styles.status, { color: colorFor(item.status) }]}>
        {labelFor(item.status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm + 2,
    paddingVertical: SPACING.sm + 2,
  },
  content: {
    flex: 1,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.text,
    marginBottom: 2,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 18,
  },
  status: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
  },
});
