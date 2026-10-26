import { View, Text, StyleSheet } from 'react-native';
import { JobStatus } from '@/types';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

interface JobStatusBadgeProps {
  status: JobStatus;
}

const STATUS_CONFIG: Record<JobStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: COLORS.textMuted + '1A', text: COLORS.textMuted, label: 'Draft' },
  open: { bg: COLORS.secondary + '1A', text: COLORS.secondary, label: 'Open' },
  assigned: { bg: COLORS.primary + '1A', text: COLORS.primary, label: 'Assigned' },
  in_progress: { bg: COLORS.warning + '1A', text: COLORS.warning, label: 'In progress' },
  awaiting_confirmation: { bg: COLORS.accent + '1A', text: COLORS.accentDark, label: 'Awaiting confirmation' },
  completed: { bg: COLORS.success + '1A', text: COLORS.success, label: 'Completed' },
  cancelled: { bg: COLORS.error + '1A', text: COLORS.error, label: 'Cancelled' },
  expired: { bg: COLORS.textMuted + '1A', text: COLORS.textMuted, label: 'Expired' },
};

export function JobStatusBadge({ status }: JobStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 1,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    letterSpacing: 0.3,
  },
});
