import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Clock, Calendar, ChevronRight, Star } from 'lucide-react-native';
import { Job } from '@/types';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

interface RecommendedJobCardProps {
  job: Job;
  onDirections: (job: Job) => void;
}

export function RecommendedJobCard({ job, onDirections }: RecommendedJobCardProps) {
  const router = useRouter();

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/jobs/${job.id}`)}
      android_ripple={{ color: 'rgba(0,0,0,0.03)', radius: 200 }}
    >
      <View style={styles.header}>
        <View style={styles.recommendedBadge}>
          <Star size={13} color={COLORS.primary} strokeWidth={2.2} fill={COLORS.accent} />
          <Text style={styles.recommendedText}>Recommended</Text>
        </View>
      </View>

      <Text style={styles.title}>{job.title}</Text>
      <Text style={styles.category}>{job.category} · {job.location}</Text>
      <Text style={styles.price}>R{job.price}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <MapPin size={15} color={COLORS.card} strokeWidth={2} />
          <Text style={styles.metaText}>{job.distanceKm} km away</Text>
        </View>
        <Text style={styles.dot}>·</Text>
        <View style={styles.metaItem}>
          <Clock size={15} color={COLORS.card} strokeWidth={2} />
          <Text style={styles.metaText}>{job.estimatedDuration}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Calendar size={15} color={COLORS.card} strokeWidth={2} />
          <Text style={styles.metaText}>{job.scheduledDate} · {job.scheduledTime}</Text>
        </View>
      </View>

      <Pressable style={styles.viewBtn} onPress={() => router.push(`/jobs/${job.id}`)}>
        <Text style={styles.viewText}>View Job</Text>
        <ChevronRight size={18} color={COLORS.primaryDark} strokeWidth={2.2} />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md + 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  recommendedText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.accent,
  },
  price: {
    fontFamily: FONTS.bold,
    fontSize: 34,
    color: COLORS.card,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 20,
    color: COLORS.card,
    marginBottom: 2,
  },
  category: {
    fontFamily: FONTS.medium,
    fontSize: 15,
    color: COLORS.card,
    opacity: 0.9,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
  },
  dot: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginTop: SPACING.md,
  },
  viewText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.primaryDark,
  },
});
