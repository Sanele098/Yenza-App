import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Bell, BriefcaseBusiness, ChevronRight, Clock3, Menu, Plus, Star, UserRound } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useDrawer } from '@/context/DrawerContext';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

export default function EmployerHomeScreen() {
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const { employer, employerJobs, candidates } = useApp();
  const activeJobs = employerJobs.filter((job) => !['Completed', 'Cancelled'].includes(job.status));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View><Text style={styles.brand}>Yenza</Text><Text style={styles.eyebrow}>Employer workspace</Text></View>
          <View style={styles.topActions}>
            <Pressable style={styles.roundButton}><Bell size={19} color={COLORS.text} strokeWidth={2} /></Pressable>
            <Pressable style={styles.roundButton} onPress={openDrawer}><Menu size={21} color={COLORS.text} strokeWidth={2.1} /></Pressable>
          </View>
        </View>

        <Text style={styles.greeting}>Hi, {employer.name.split(' ')[0]}</Text>
        <Text style={styles.subtitle}>Get the right help for your next job.</Text>

        <Pressable style={styles.postHero} onPress={() => router.push('/(tabs)/post-job' as never)}>
          <View style={styles.postIcon}><Plus size={22} color={COLORS.primary} strokeWidth={2.5} /></View>
          <View style={styles.postCopy}><Text style={styles.postTitle}>Post a new job</Text><Text style={styles.postSubtitle}>Describe the work and receive suitable applications.</Text></View>
          <ChevronRight size={20} color={COLORS.primary} strokeWidth={2} />
        </Pressable>

        <View style={styles.statsRow}>
          <View style={styles.statCard}><Text style={styles.statValue}>{activeJobs.length}</Text><Text style={styles.statLabel}>Active jobs</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{employerJobs.reduce((sum, job) => sum + job.applications, 0)}</Text><Text style={styles.statLabel}>Applications</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{employer.jobsCompleted}</Text><Text style={styles.statLabel}>Completed</Text></View>
        </View>

        <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Your active jobs</Text><Text style={styles.sectionSubtitle}>Keep work moving</Text></View><Pressable onPress={() => router.push('/(tabs)/my-jobs' as never)}><Text style={styles.link}>View all</Text></Pressable></View>
        {activeJobs.slice(0, 2).map((job) => (
          <Pressable key={job.id} style={styles.jobCard} onPress={() => router.push('/(tabs)/my-jobs' as never)}>
            <View style={styles.jobIcon}><BriefcaseBusiness size={19} color={COLORS.primary} strokeWidth={2} /></View>
            <View style={styles.jobCopy}><Text style={styles.jobTitle}>{job.title}</Text><Text style={styles.jobMeta}>{job.location} · {job.scheduledDate} at {job.scheduledTime}</Text><View style={styles.jobBottom}><Text style={styles.jobStatus}>{job.status}</Text><Text style={styles.jobPrice}>R{job.budget}</Text></View></View>
            <ChevronRight size={18} color={COLORS.textMuted} strokeWidth={2} />
          </Pressable>
        ))}

        <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>Recommended workers</Text><Text style={styles.sectionSubtitle}>Based on your recent jobs</Text></View><Pressable onPress={() => router.push('/(tabs)/workers' as never)}><Text style={styles.link}>Browse</Text></Pressable></View>
        {candidates.slice(0, 2).map((candidate) => (
          <Pressable key={candidate.id} style={styles.workerCard} onPress={() => router.push('/(tabs)/workers' as never)}>
            <View style={styles.workerAvatar}><UserRound size={22} color={COLORS.primary} strokeWidth={2} /></View>
            <View style={styles.workerCopy}><Text style={styles.workerName}>{candidate.name}</Text><Text style={styles.workerMeta}>{candidate.services.slice(0, 2).join(' · ')} · {candidate.location}</Text><View style={styles.ratingRow}><Star size={14} color={COLORS.accentDark} fill={COLORS.accent} /><Text style={styles.rating}>{candidate.rating} · {candidate.completedJobs} jobs</Text></View></View><Text style={styles.workerRate}>From R{candidate.rate}</Text>
          </Pressable>
        ))}
        <View style={styles.notice}><Clock3 size={18} color={COLORS.secondary} strokeWidth={2} /><Text style={styles.noticeText}>Payments and receipts will be available once a job is marked complete.</Text></View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background }, scroll: { padding: SPACING.md },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg }, brand: { fontFamily: FONTS.bold, fontSize: 29, color: COLORS.primary, letterSpacing: -1 }, eyebrow: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 2 }, topActions: { flexDirection: 'row', gap: SPACING.sm }, roundButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  greeting: { fontFamily: FONTS.bold, fontSize: 25, color: COLORS.text }, subtitle: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted, marginTop: 3, marginBottom: SPACING.lg },
  postHero: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md }, postIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' }, postCopy: { flex: 1 }, postTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.card }, postSubtitle: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.78)', marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg }, statCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm + 2 }, statValue: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.primary }, statLabel: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: SPACING.sm }, sectionTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text }, sectionSubtitle: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 2 }, link: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.primary },
  jobCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm + 2, marginBottom: SPACING.sm }, jobIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#DDF4EC', alignItems: 'center', justifyContent: 'center' }, jobCopy: { flex: 1 }, jobTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text }, jobMeta: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 3 }, jobBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 }, jobStatus: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.secondary }, jobPrice: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text },
  workerCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm + 2, marginBottom: SPACING.sm }, workerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#EAF7F2', alignItems: 'center', justifyContent: 'center' }, workerCopy: { flex: 1 }, workerName: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text }, workerMeta: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 3 }, ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }, rating: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted }, workerRate: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.primary },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, backgroundColor: '#EAF7F2', borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.md }, noticeText: { flex: 1, fontFamily: FONTS.regular, fontSize: 12, lineHeight: 17, color: COLORS.secondary },
});
