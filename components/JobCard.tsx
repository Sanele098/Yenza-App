import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Clock, Calendar, Navigation, Wifi, ChevronRight } from 'lucide-react-native';
import { Job, JobCategory } from '@/types';
import { ServiceIcon } from '@/components/ServiceIcon';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

interface JobCardProps {
  job: Job;
  onDirections: (job: Job) => void;
}

const CATEGORY_COLORS: Record<JobCategory, string> = {
  Cleaning: '#159B83',
  Gardening: '#2D8A4F',
  'Moving Assistance': '#E8A93A',
  Painting: '#6C5CE7',
  'Car Washing': '#0984E3',
  'Event Assistance': '#E17055',
  'General Labour': '#636E72',
  Plumbing: '#0984E3',
  Electrical: '#FDCB6E',
  Carpentry: '#D4A574',
  Welding: '#D64545',
  Tiling: '#00B894',
  Mechanics: '#2D3436',
  'Solar Installation': '#F4C95D',
  Digital: '#159B83',
  Remote: '#176B4D',
  Other: '#636E72',
};

const CATEGORY_BG: Record<JobCategory, string> = {
  Cleaning: '#E0F4F1',
  Gardening: '#E8F5EC',
  'Moving Assistance': '#FBF0DA',
  Painting: '#EFEDF9',
  'Car Washing': '#DBEFFC',
  'Event Assistance': '#FBE6DF',
  'General Labour': '#E3E5E6',
  Plumbing: '#DBEFFC',
  Electrical: '#FCF3D9',
  Carpentry: '#F2E8DC',
  Welding: '#F8DEDE',
  Tiling: '#DCF5EC',
  Mechanics: '#DDE0E1',
  'Solar Installation': '#FBF1D7',
  Digital: '#E0F4F1',
  Remote: '#DDF4EC',
  Other: '#E3E5E6',
};

function formatDate(iso: string): string {
  if (!iso) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  return iso;
}

export function JobCard({ job, onDirections }: JobCardProps) {
  const router = useRouter();
  const accentColor = CATEGORY_COLORS[job.category] ?? COLORS.primary;
  const accentBg = CATEGORY_BG[job.category] ?? '#DDF4EC';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/jobs/${job.id}`)}
    >
      <View style={[styles.colorStrip, { backgroundColor: accentColor }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconBubble, { backgroundColor: accentBg }]}>
            <ServiceIcon category={job.category} size={22} color={accentColor} />
          </View>
          <View style={styles.headerRight}>
            {job.isRemote ? (
              <View style={[styles.remoteBadge, { backgroundColor: accentColor }]}>
                <Wifi size={11} color={COLORS.card} strokeWidth={2.4} />
                <Text style={styles.remoteBadgeText}>Remote</Text>
              </View>
            ) : (
              <View style={[styles.distanceBadge, { backgroundColor: accentBg }]}>
                <MapPin size={11} color={accentColor} strokeWidth={2.4} />
                <Text style={[styles.distanceText, { color: accentColor }]}>{job.distanceKm} km away</Text>
              </View>
            )}
            <ChevronRight size={18} color={COLORS.textMuted} strokeWidth={2.2} />
          </View>
        </View>

        <Text style={styles.categoryLabel} numberOfLines={1}>{job.category}</Text>
        <Text style={styles.title} numberOfLines={2}>{job.title}</Text>
        <Text style={styles.location} numberOfLines={1}>{job.location}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Calendar size={13} color={COLORS.textMuted} strokeWidth={2.2} />
            <Text style={styles.metaText} numberOfLines={1}>{formatDate(job.scheduledDate)} · {job.scheduledTime}</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <Clock size={13} color={COLORS.textMuted} strokeWidth={2.2} />
            <Text style={styles.metaText} numberOfLines={1}>{job.estimatedDuration}</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>Budget</Text>
            <Text style={styles.price}>R{job.price}</Text>
          </View>
          {!job.isRemote && (
            <Pressable
              style={({ pressed }) => [styles.directionButton, pressed && styles.directionButtonPressed]}
              onPress={(event) => {
                event.stopPropagation?.();
                onDirections(job);
              }}
              hitSlop={8}
            >
              <Navigation size={16} color={COLORS.primary} strokeWidth={2.2} />
              <Text style={styles.directionText}>Directions</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  cardPressed: {
    borderColor: COLORS.primary,
    shadowOpacity: 0,
    elevation: 0,
    transform: [{ scale: 0.99 }],
  },
  colorStrip: {
    height: 6,
    width: '100%',
  },
  cardBody: {
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm + 2,
  },
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  remoteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  remoteBadgeText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.card,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  distanceText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
  },
  categoryLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  title: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
    lineHeight: 21,
    color: COLORS.text,
    marginBottom: 3,
  },
  location: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.sm + 2,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: COLORS.border,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  priceLabel: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  price: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.text,
  },
  directionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F2',
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  directionButtonPressed: {
    backgroundColor: '#DDF4EC',
  },
  directionText: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.primary,
  },
});
