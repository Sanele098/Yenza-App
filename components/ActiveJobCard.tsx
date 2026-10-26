import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Calendar, Clock, Navigation, ChevronRight, CheckCircle2 } from 'lucide-react-native';
import { Job } from '@/types';
import { JobStatusBadge } from './JobStatusBadge';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

interface ActiveJobCardProps {
  job: Job;
  onDirections: (job: Job) => void;
}

export function ActiveJobCard({ job, onDirections }: ActiveJobCardProps) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/jobs/${job.id}`)}
      android_ripple={{ color: 'rgba(0,0,0,0.03)', radius: 200 }}
    >
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <CheckCircle2 size={16} color={COLORS.primary} strokeWidth={2.2} />
          <Text style={styles.sectionLabel}>Your Active Job</Text>
        </View>
        <JobStatusBadge status={job.status} />
      </View>

      <Text style={styles.title}>{job.title}</Text>

      <View style={styles.metaRow}>
        <MapPin size={15} color={COLORS.textMuted} strokeWidth={2} />
        <Text style={styles.metaText}>{job.location}</Text>
      </View>

      <View style={styles.metaRow}>
        <Calendar size={15} color={COLORS.textMuted} strokeWidth={2} />
        <Text style={styles.metaText}>{job.scheduledDate}</Text>
        <Text style={styles.dot}>·</Text>
        <Clock size={15} color={COLORS.textMuted} strokeWidth={2} />
        <Text style={styles.metaText}>{job.scheduledTime}</Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.price}>R{job.price}</Text>
        <View style={styles.actions}>
          <Pressable
            style={styles.directionsBtn}
            onPress={(e) => {
              e.stopPropagation?.();
              onDirections(job);
            }}
          >
            <Navigation size={17} color={COLORS.secondary} strokeWidth={2.2} />
            <Text style={styles.directionsText}>Directions</Text>
          </Pressable>
          <View style={styles.viewBtn}>
            <Text style={styles.viewText}>View</Text>
            <ChevronRight size={16} color={COLORS.primary} strokeWidth={2.2} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md + 2,
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.primary,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 17,
    color: COLORS.text,
    marginBottom: SPACING.sm - 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  dot: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm + 2,
    paddingTop: SPACING.sm + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  price: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.primary,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  directionsText: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.secondary,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.primary,
  },
});
