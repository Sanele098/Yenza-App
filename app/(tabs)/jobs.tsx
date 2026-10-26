import { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, TextInput, Modal } from 'react-native';
import { MapPin, Briefcase, RefreshCw, Search, Bell, Menu, SlidersHorizontal, Star, X, ChevronRight, Clock, Calendar, Lightbulb, TrendingUp, ArrowRight } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useDrawer } from '@/context/DrawerContext';
import { Job } from '@/types';
import { JobCard } from '@/components/JobCard';
import { ActiveJobCard } from '@/components/ActiveJobCard';
import { SectionHeader } from '@/components/SectionHeader';
import { DirectionsModal } from '@/components/DirectionsModal';
import { SkillGapAnalysis } from '@/components/SkillGapAnalysis';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';
import { ALL_GENERAL_SERVICES, ALL_SKILLED_SERVICES } from '@/data/mockData';

const FILTERS = ['All jobs', 'Near me', 'Remote', 'Today'];

const STATUS_META = {
  available: { label: 'Available', color: COLORS.success },
  busy: { label: 'Busy', color: COLORS.warning },
  unavailable: { label: 'Unavailable', color: COLORS.textMuted },
} as const;

type LocationStatus = 'loading' | 'granted' | 'denied';

function distanceFromLocation(latitude: number, longitude: number, job: Job): number {
  const earthRadiusKm = 6371;
  const latitudeDelta = (job.latitude - latitude) * Math.PI / 180;
  const longitudeDelta = (job.longitude - longitude) * Math.PI / 180;
  const originLatitude = latitude * Math.PI / 180;
  const jobLatitude = job.latitude * Math.PI / 180;
  const value = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(originLatitude) * Math.cos(jobLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export default function JobsScreen() {
  const { worker, workerStatus, recommendedJob, availableJobs, activeJobs, skillDemand, skillGapAnalysis, skillGapLoading, skillGapLanguage, setSkillGapLanguage, generateSkillGapAnalysis, addSkillMilestone, updateMilestoneStatus } = useApp();
  const { openDrawer } = useDrawer();
  const router = useRouter();
  const [directionsJob, setDirectionsJob] = useState<Job | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All jobs');
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('loading');
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [recommendedDismissed, setRecommendedDismissed] = useState(false);
  const [recommendedSheetOpen, setRecommendedSheetOpen] = useState(false);
  const [skillGapSheetOpen, setSkillGapSheetOpen] = useState(false);

  const requestLocation = useCallback(async () => {
    setLocationStatus('loading');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setLocationStatus('denied');
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation(currentLocation);
      setLocationStatus('granted');
    } catch {
      setLocationStatus('denied');
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const openDirections = useCallback((job: Job) => setDirectionsJob(job), []);
  const closeDirections = useCallback(() => setDirectionsJob(null), []);

  const nearbyJobs = useMemo(() => {
    if (!location) return availableJobs;
    const { latitude, longitude } = location.coords;
    return availableJobs
      .map((job) => ({ ...job, distanceKm: distanceFromLocation(latitude, longitude, job) }))
      .sort((first, second) => first.distanceKm - second.distanceKm);
  }, [availableJobs, location]);

  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return nearbyJobs.filter((job) => {
      const matchesQuery = !normalizedQuery || [job.title, job.location, job.category, job.description]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesFilter = filter === 'All jobs'
        || (filter === 'Near me' && !job.isRemote && job.distanceKm <= 10)
        || (filter === 'Remote' && job.isRemote)
        || (filter === 'Today' && job.scheduledDate === 'Today');
      return matchesQuery && matchesFilter;
    });
  }, [nearbyJobs, filter, query]);

  const visibleJobs = filteredJobs.filter((job) => job.id !== recommendedJob?.id);
  const statusMeta = STATUS_META[workerStatus];
  const showRecommendedBanner = recommendedJob && !recommendedDismissed && !query.trim() && filter === 'All jobs' && workerStatus !== 'unavailable';

  const skillGapSummary = useMemo(() => {
    const allServices = [...ALL_GENERAL_SERVICES, ...ALL_SKILLED_SERVICES];
    const missing = allServices.filter((s) => !worker.services.includes(s));
    const demandMap: Record<string, typeof skillDemand[number]> = {};
    skillDemand.forEach((d) => { demandMap[d.service] = d; });
    const gaps = missing.map((service) => {
      const d = demandMap[service];
      const totalJobs = d?.totalJobs ?? 0;
      const openJobs = d?.openJobs ?? 0;
      const workerCount = d?.workerCount ?? 0;
      const demandScore = totalJobs * 2 + openJobs * 3;
      const opportunityScore = demandScore - workerCount * 1.5;
      return { service, totalJobs, openJobs, workerCount, opportunityScore, demandScore };
    }).sort((a, b) => b.opportunityScore - a.opportunityScore);
    const topGap = gaps[0];
    const totalOpenJobs = skillDemand.reduce((s, d) => s + d.openJobs, 0);
    const totalJobs = skillDemand.reduce((s, d) => s + d.totalJobs, 0);
    const coveredJobs = skillDemand.filter((d) => worker.services.includes(d.service)).reduce((s, d) => s + d.totalJobs, 0);
    const coverage = totalJobs > 0 ? Math.round((coveredJobs / totalJobs) * 100) : 0;
    return { topGap, gapsCount: gaps.length, coverage, totalOpenJobs };
  }, [worker.services, skillDemand]);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const openRecommended = () => setRecommendedSheetOpen(true);
  const closeRecommended = () => setRecommendedSheetOpen(false);
  const dismissRecommended = () => {
    setRecommendedDismissed(true);
    setRecommendedSheetOpen(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>Yenza</Text>
        <View style={styles.topActions}>
          <Pressable hitSlop={10}><Bell size={23} color={COLORS.card} strokeWidth={2} /></Pressable>
          <Pressable hitSlop={10} onPress={openDrawer}><Menu size={23} color={COLORS.card} strokeWidth={2} /></Pressable>
        </View>
      </View>

      <View style={styles.fixedHeader}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Hi, {worker.name.split(' ')[0]}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusPill, { backgroundColor: statusMeta.color }]}>
              <View style={styles.statusPillDot} />
              <Text style={styles.statusPillText}>{statusMeta.label}</Text>
            </View>
            <View style={styles.locationRow}>
              <MapPin size={15} color={COLORS.textMuted} strokeWidth={2.2} />
              <Text style={styles.locationText}>{worker.location || 'Location not set'}</Text>
            </View>
          </View>
        </View>

        <Pressable
          style={styles.skillGapCard}
          onPress={() => setSkillGapSheetOpen(true)}
        >
          <View style={styles.skillGapIcon}>
            <Lightbulb size={19} color={COLORS.secondary} strokeWidth={2.2} />
          </View>
          <View style={styles.skillGapCopy}>
            <Text style={styles.skillGapTitle}>
              {skillGapSummary.topGap
                ? `Learn ${skillGapSummary.topGap.service} next`
                : 'Build your skills'}
            </Text>
            <Text style={styles.skillGapText}>
              {skillGapSummary.topGap
                ? `${skillGapSummary.topGap.openJobs > 0
                    ? `${skillGapSummary.topGap.openJobs} open job${skillGapSummary.topGap.openJobs === 1 ? '' : 's'} now`
                    : 'High opportunity skill'} · ${skillGapSummary.coverage}% demand covered`
                : `You cover ${skillGapSummary.coverage}% of job demand — see your skill gap analysis`}
            </Text>
          </View>
          <View style={styles.skillGapArrow}>
            <ArrowRight size={18} color={COLORS.secondary} strokeWidth={2.2} />
          </View>
        </Pressable>

        <View style={styles.searchBox}>
          <Search size={20} color={COLORS.textMuted} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search jobs, services or locations"
            placeholderTextColor={COLORS.textMuted}
            returnKeyType="search"
          />
          <Pressable hitSlop={8}>
            <SlidersHorizontal size={19} color={COLORS.primary} strokeWidth={2} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((item) => (
            <Pressable key={item} style={[styles.filterChip, filter === item && styles.filterChipActive]} onPress={() => setFilter(item)}>
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
      >
        {activeJobs.length > 0 && (
          <View style={styles.section}>
            <SectionHeader title="Your Active Job" />
            {activeJobs.map((job) => <ActiveJobCard key={job.id} job={job} onDirections={openDirections} />)}
          </View>
        )}

        {workerStatus === 'unavailable' ? (
          <View style={styles.emptyState}>
            <Briefcase size={44} color={COLORS.textMuted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>You're unavailable</Text>
            <Text style={styles.emptyText}>Change your status from the drawer menu to see job opportunities near you.</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <SectionHeader title="Available Jobs" subtitle={filteredJobs.length > 0 ? `${filteredJobs.length} jobs nearby` : undefined} />
            {visibleJobs.length === 0 ? (
              <View style={styles.emptyState}>
                <Briefcase size={44} color={COLORS.textMuted} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>{query || filter !== 'All jobs' ? 'No matching jobs' : 'No jobs available nearby'}</Text>
                <Text style={styles.emptyText}>{query || filter !== 'All jobs' ? 'Try another search or filter.' : "We'll show new opportunities here when they become available."}</Text>
                <Pressable style={styles.refreshBtn} onPress={onRefresh}>
                  <RefreshCw size={18} color={COLORS.primary} strokeWidth={2.2} />
                  <Text style={styles.refreshText}>Refresh Jobs</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.jobsList}>{visibleJobs.map((job) => <JobCard key={job.id} job={job} onDirections={openDirections} />)}</View>
            )}
          </View>
        )}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {showRecommendedBanner && (
        <Pressable style={styles.recommendedBanner} onPress={openRecommended}>
          <View style={styles.recommendedBannerLeft}>
            <View style={styles.recommendedIcon}>
              <Star size={16} color={COLORS.card} strokeWidth={2.2} fill={COLORS.card} />
            </View>
            <View style={styles.recommendedBannerCopy}>
              <Text style={styles.recommendedBannerTitle}>Recommended for you</Text>
              <Text style={styles.recommendedBannerSubtitle}>{recommendedJob.title} · R{recommendedJob.price} · {recommendedJob.distanceKm} km</Text>
            </View>
          </View>
          <View style={styles.recommendedBannerRight}>
            <Text style={styles.recommendedBannerView}>View</Text>
            <ChevronRight size={16} color={COLORS.secondary} strokeWidth={2.2} />
          </View>
        </Pressable>
      )}

      <Modal visible={recommendedSheetOpen} transparent animationType="slide" onRequestClose={closeRecommended}>
        <Pressable style={styles.sheetBackdrop} onPress={closeRecommended} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetBadge}>
              <Star size={13} color={COLORS.accent} strokeWidth={2.2} fill={COLORS.accent} />
              <Text style={styles.sheetBadgeText}>Recommended for you</Text>
            </View>
            <Pressable style={styles.sheetCloseBtn} onPress={closeRecommended} hitSlop={8}>
              <X size={20} color={COLORS.card} strokeWidth={2.2} />
            </Pressable>
          </View>

          {recommendedJob && (
            <>
              <Text style={styles.sheetTitle}>{recommendedJob.title}</Text>
              <Text style={styles.sheetCategory}>{recommendedJob.category} · {recommendedJob.location}</Text>
              <Text style={styles.sheetPrice}>R{recommendedJob.price}</Text>

              <View style={styles.sheetMetaRow}>
                <View style={styles.sheetMetaItem}>
                  <MapPin size={15} color="rgba(255,255,255,0.85)" strokeWidth={2} />
                  <Text style={styles.sheetMetaText}>{recommendedJob.distanceKm} km away</Text>
                </View>
                <Text style={styles.sheetDot}>·</Text>
                <View style={styles.sheetMetaItem}>
                  <Clock size={15} color="rgba(255,255,255,0.85)" strokeWidth={2} />
                  <Text style={styles.sheetMetaText}>{recommendedJob.estimatedDuration}</Text>
                </View>
              </View>
              <View style={styles.sheetMetaRow}>
                <View style={styles.sheetMetaItem}>
                  <Calendar size={15} color="rgba(255,255,255,0.85)" strokeWidth={2} />
                  <Text style={styles.sheetMetaText}>{recommendedJob.scheduledDate} · {recommendedJob.scheduledTime}</Text>
                </View>
              </View>

              <View style={styles.sheetActions}>
                <Pressable style={styles.sheetDismissBtn} onPress={dismissRecommended}>
                  <Text style={styles.sheetDismissText}>Dismiss</Text>
                </Pressable>
                <Pressable style={styles.sheetViewBtn} onPress={() => { closeRecommended(); router.push(`/jobs/${recommendedJob.id}`); }}>
                  <Text style={styles.sheetViewText}>View Job</Text>
                  <ChevronRight size={18} color={COLORS.primaryDark} strokeWidth={2.2} />
                </Pressable>
              </View>
            </>
          )}
        </View>
      </Modal>

      <Modal visible={skillGapSheetOpen} transparent animationType="slide" onRequestClose={() => setSkillGapSheetOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setSkillGapSheetOpen(false)} />
        <View style={styles.gapSheet}>
          <View style={styles.gapSheetHandle} />
          <View style={styles.gapSheetHeader}>
            <View style={styles.gapSheetBadge}>
              <Lightbulb size={14} color={COLORS.secondary} strokeWidth={2.2} />
              <Text style={styles.gapSheetBadgeText}>Skill Gap Analysis</Text>
            </View>
            <Pressable style={styles.gapSheetCloseBtn} onPress={() => setSkillGapSheetOpen(false)} hitSlop={8}>
              <X size={20} color={COLORS.text} strokeWidth={2.2} />
            </Pressable>
          </View>
          <ScrollView style={styles.gapSheetScroll} showsVerticalScrollIndicator={false}>
            <SkillGapAnalysis
              workerServices={worker.services}
              skillDemand={skillDemand}
              experience={worker.experience}
              skillGapAnalysis={skillGapAnalysis}
              skillGapLoading={skillGapLoading}
              language={skillGapLanguage}
              onLanguageChange={setSkillGapLanguage}
              onGenerate={generateSkillGapAnalysis}
              onAddMilestone={addSkillMilestone}
              onUpdateMilestoneStatus={updateMilestoneStatus}
            />
            <View style={{ height: SPACING.xl }} />
          </ScrollView>
        </View>
      </Modal>

      <DirectionsModal visible={directionsJob !== null} job={directionsJob} onDismiss={closeDirections} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  fixedHeader: { backgroundColor: COLORS.background, paddingHorizontal: SPACING.md, paddingTop: SPACING.md },
  topBar: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingTop: SPACING.md, paddingBottom: SPACING.sm + 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scroll: { paddingHorizontal: SPACING.md, paddingBottom: SPACING.xl },
  brand: { fontFamily: FONTS.bold, fontSize: 30, color: COLORS.card, letterSpacing: -1 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  header: { marginBottom: SPACING.md },
  greeting: { fontFamily: FONTS.bold, fontSize: 25, color: COLORS.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SPACING.sm + 2, paddingVertical: 4, borderRadius: 12 },
  statusPillDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#FFFFFF' },
  statusPillText: { fontFamily: FONTS.semiBold, fontSize: 11, color: '#FFFFFF' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted },
  skillGapCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: '#EAF7F2', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#D5EEE4', padding: SPACING.sm, marginBottom: SPACING.md, shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  skillGapIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  skillGapCopy: { flex: 1 },
  skillGapTitle: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text },
  skillGapText: { fontFamily: FONTS.regular, fontSize: 11, lineHeight: 16, color: COLORS.textMuted, marginTop: 2 },
  skillGapArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, height: 50, marginBottom: SPACING.sm },
  searchInput: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text, padding: 0 },
  filters: { gap: SPACING.sm, paddingVertical: 2, paddingBottom: SPACING.md },
  filterChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.xl, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted },
  filterTextActive: { color: COLORS.card, fontFamily: FONTS.semiBold },
  section: { marginBottom: SPACING.sm },
  jobsList: { gap: SPACING.md },
  emptyState: { alignItems: 'center', paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.lg },
  emptyTitle: { fontFamily: FONTS.semiBold, fontSize: 17, color: COLORS.text, marginTop: SPACING.md, marginBottom: SPACING.xs + 1 },
  emptyText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.primary, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, marginTop: SPACING.lg },
  refreshText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.primary },
  recommendedBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#EAF7F2', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, borderTopWidth: 1, borderTopColor: '#D5EEE4', shadowColor: COLORS.shadow, shadowOffset: { width: 0, height: -3 }, shadowOpacity: 1, shadowRadius: 10, elevation: 5 },
  recommendedBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  recommendedIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  recommendedBannerCopy: { flex: 1 },
  recommendedBannerTitle: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.primary },
  recommendedBannerSubtitle: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  recommendedBannerRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  recommendedBannerView: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.secondary },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 35, 27, 0.5)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.primary, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING.xl, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'center', marginBottom: SPACING.md },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  sheetBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: SPACING.sm + 2, paddingVertical: 4, borderRadius: RADIUS.sm },
  sheetBadgeText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.accent },
  sheetCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.card, marginBottom: 2 },
  sheetCategory: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.card, opacity: 0.9 },
  sheetPrice: { fontFamily: FONTS.bold, fontSize: 34, color: COLORS.card, marginTop: SPACING.xs, marginBottom: SPACING.sm },
  sheetMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 5, flexWrap: 'wrap' },
  sheetMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sheetMetaText: { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  sheetDot: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  sheetActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg },
  sheetDismissBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md },
  sheetDismissText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.card },
  sheetViewBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: COLORS.accent, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md },
  sheetViewText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.primaryDark },
  gapSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.background, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, maxHeight: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10 },
  gapSheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginTop: SPACING.sm, marginBottom: SPACING.sm },
  gapSheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  gapSheetBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EAF7F2', paddingHorizontal: SPACING.sm + 2, paddingVertical: 5, borderRadius: RADIUS.sm },
  gapSheetBadgeText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.secondary },
  gapSheetCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  gapSheetScroll: { paddingHorizontal: SPACING.md },
});
