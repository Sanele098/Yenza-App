import { useState, useCallback, useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Modal, ActivityIndicator, Image } from 'react-native';
import {
  BriefcaseBusiness, ChevronDown, ChevronUp, Menu, Trash2, Users,
  RotateCcw, CheckCircle2, XCircle, Banknote, CreditCard, Bell, AlertCircle, Camera,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { useDrawer } from '@/context/DrawerContext';
import { EmployerJob, JobApplication, JobStatus } from '@/types';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

type FilterTab = 'all' | 'open' | 'assigned' | 'in_progress' | 'awaiting_confirmation' | 'completed' | 'cancelled';

const FILTER_TABS: { value: FilterTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'awaiting_confirmation', label: 'Confirm' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'Active' },
  { value: 'completed', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Statuses where a worker has accepted and the job is in progress — deletion is blocked
const LOCKED_STATUSES: JobStatus[] = ['assigned', 'in_progress', 'awaiting_confirmation'];

function sortJobs(jobs: EmployerJob[]): EmployerJob[] {
  return [...jobs].sort((a, b) => {
    const aConfirm = a.rawStatus === 'awaiting_confirmation' ? 0 : 1;
    const bConfirm = b.rawStatus === 'awaiting_confirmation' ? 0 : 1;
    if (aConfirm !== bConfirm) return aConfirm - bConfirm;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default function MyJobsScreen() {
  const router = useRouter();
  const { openDrawer } = useDrawer();
  const {
    employerJobs, deleteEmployerJob, cancelEmployerJob, reopenJob,
    confirmCompletion, loadApplications, jobApplications, selectWorker, refreshJobs,
    listingPhotos, loadListingPhotos,
  } = useApp();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [showApplications, setShowApplications] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [confirmPopupJob, setConfirmPopupJob] = useState<EmployerJob | null>(null);
  const [popupDismissed, setPopupDismissed] = useState(false);

  useEffect(() => {
    refreshJobs();
  }, [refreshJobs]);

  // Show popup for jobs awaiting confirmation on load
  const confirmationJobs = useMemo(
    () => employerJobs.filter((j) => j.rawStatus === 'awaiting_confirmation'),
    [employerJobs],
  );

  useEffect(() => {
    if (confirmationJobs.length > 0 && !popupDismissed) {
      setConfirmPopupJob(confirmationJobs[0]);
    } else if (confirmationJobs.length === 0) {
      setConfirmPopupJob(null);
      setPopupDismissed(false);
    }
  }, [confirmationJobs, popupDismissed]);

  const runAction = async (fn: () => Promise<{ success: boolean; error?: string }>, successMsg: string) => {
    setActionLoading(true);
    const result = await fn();
    setActionLoading(false);
    setResultMsg({
      success: result.success,
      text: result.success ? successMsg : (result.error ?? 'Action failed'),
    });
  };

  const handleCancel = (jobId: string) => runAction(() => cancelEmployerJob(jobId, 'Cancelled by employer'), 'Job cancelled');
  const handleReopen = (jobId: string) => runAction(() => reopenJob(jobId), 'Job reopened — workers can see it again');
  const handleConfirm = (jobId: string) => {
    setConfirmPopupJob(null);
    runAction(() => confirmCompletion(jobId), 'Job confirmed complete. The worker earning has been updated.');
  };
  const handleSelect = async (appId: string) => {
    setActionLoading(true);
    const result = await selectWorker(appId);
    setActionLoading(false);
    setResultMsg({
      success: result.success,
      text: result.success ? 'Worker selected!' : (result.error ?? 'Could not select worker'),
    });
    if (result.success) setShowApplications(null);
  };

  const toggleExpand = (jobId: string) => {
    const newId = expandedId === jobId ? null : jobId;
    setExpandedId(newId);
    if (newId) {
      loadApplications(jobId);
      loadListingPhotos(jobId);
    }
  };

  const openApplications = (jobId: string) => {
    setShowApplications(jobId);
    loadApplications(jobId);
  };

  const apps = showApplications ? (jobApplications[showApplications] ?? []) : [];

  const sortedJobs = useMemo(() => sortJobs(employerJobs), [employerJobs]);
  const filteredJobs = useMemo(() => {
    if (activeFilter === 'all') return sortedJobs;
    return sortedJobs.filter((j) => j.rawStatus === activeFilter);
  }, [sortedJobs, activeFilter]);

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    employerJobs.forEach((j) => {
      counts[j.rawStatus] = (counts[j.rawStatus] ?? 0) + 1;
    });
    counts['all'] = employerJobs.length;
    return counts;
  }, [employerJobs]);

  const dismissPopup = () => {
    setConfirmPopupJob(null);
    setPopupDismissed(true);
  };

  const showNextConfirmation = () => {
    const remaining = confirmationJobs.filter((j) => j.id !== confirmPopupJob?.id);
    if (remaining.length > 0) {
      setConfirmPopupJob(remaining[0]);
    } else {
      dismissPopup();
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <View><Text style={styles.title}>My Jobs</Text><Text style={styles.subtitle}>Manage your listings and bookings</Text></View>
          <Pressable style={styles.menuButton} onPress={openDrawer}><Menu size={22} color={COLORS.text} strokeWidth={2.1} /></Pressable>
        </View>

        {/* Confirmation alert banner */}
        {confirmationJobs.length > 0 && (
          <Pressable style={styles.alertBanner} onPress={() => setConfirmPopupJob(confirmationJobs[0])}>
            <View style={styles.alertIcon}><Bell size={16} color={COLORS.card} strokeWidth={2.2} /></View>
            <Text style={styles.alertText}>
              {confirmationJobs.length} job{confirmationJobs.length === 1 ? '' : 's'} awaiting your confirmation
            </Text>
            <Text style={styles.alertAction}>Review</Text>
          </Pressable>
        )}

        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs} contentContainerStyle={styles.filterTabsContent}>
          {FILTER_TABS.map((tab) => {
            const count = filterCounts[tab.value] ?? 0;
            if (tab.value !== 'all' && count === 0) return null;
            const active = activeFilter === tab.value;
            return (
              <Pressable
                key={tab.value}
                style={[styles.filterTab, active && styles.filterTabActive]}
                onPress={() => setActiveFilter(tab.value)}
              >
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>{tab.label}</Text>
                {count > 0 && (
                  <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
                    <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>{count}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {resultMsg && (
          <View style={[styles.resultBanner, resultMsg.success ? styles.resultSuccess : styles.resultError]}>
            <Text style={styles.resultText}>{resultMsg.text}</Text>
            <Pressable onPress={() => setResultMsg(null)} hitSlop={8}><Text style={styles.resultClose}>×</Text></Pressable>
          </View>
        )}

        {actionLoading && <View style={styles.loadingRow}><ActivityIndicator size="small" color={COLORS.primary} /><Text style={styles.loadingText}>Processing…</Text></View>}

        {filteredJobs.map((job) => {
          const expanded = expandedId === job.id;
          const canCancel = !['completed', 'cancelled', 'expired'].includes(job.rawStatus);
          const canReopen = job.rawStatus === 'cancelled';
          const canConfirm = job.rawStatus === 'awaiting_confirmation';
          const canViewApps = job.rawStatus === 'open' && job.fulfillmentMode === 'application';
          const isLocked = LOCKED_STATUSES.includes(job.rawStatus);

          return (
            <View key={job.id} style={styles.jobCard}>
              <Pressable style={styles.jobHeader} onPress={() => toggleExpand(job.id)}>
                <View style={styles.jobIcon}><BriefcaseBusiness size={19} color={COLORS.primary} strokeWidth={2} /></View>
                <View style={styles.jobCopy}>
                  <Text style={styles.jobTitle}>{job.title}</Text>
                  <Text style={styles.jobMeta}>{job.location} · R{job.budget} · {job.scheduledDate}</Text>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusPill, getStatusStyle(job.rawStatus)]}>
                      <Text style={[styles.statusText, { color: getStatusTextColor(job.rawStatus) }]}>{job.status}</Text>
                    </View>
                    {job.fulfillmentMode === 'application' && (
                      <View style={styles.modeTag}><Text style={styles.modeTagText}>Apply</Text></View>
                    )}
                    {job.fulfillmentMode === 'instant_accept' && (
                      <View style={styles.modeTag}><Text style={styles.modeTagText}>Instant</Text></View>
                    )}
                    <View style={[styles.payTag, job.preferredPaymentMethod === 'cash' ? styles.payTagCash : styles.payTagCard]}>
                      {job.preferredPaymentMethod === 'cash' ? (
                        <Banknote size={11} color={COLORS.secondary} strokeWidth={2.2} />
                      ) : (
                        <CreditCard size={11} color={COLORS.primary} strokeWidth={2.2} />
                      )}
                      <Text style={[styles.payTagText, job.preferredPaymentMethod === 'cash' ? styles.payTagTextCash : styles.payTagTextCard]}>
                        {job.preferredPaymentMethod === 'cash' ? 'Cash' : 'Card'}
                      </Text>
                    </View>
                  </View>
                </View>
                {expanded ? <ChevronUp size={20} color={COLORS.textMuted} /> : <ChevronDown size={20} color={COLORS.textMuted} />}
              </Pressable>

              {expanded && (
                <View style={styles.details}>
                  <Text style={styles.description}>{job.description}</Text>

                  {(listingPhotos[job.id] ?? []).length > 0 && (
                    <View style={styles.jobPhotosSection}>
                      <View style={styles.jobPhotosHeader}>
                        <Camera size={15} color={COLORS.secondary} strokeWidth={2} />
                        <Text style={styles.jobPhotosTitle}>Job Photos</Text>
                      </View>
                      <View style={styles.jobPhotosGrid}>
                        {(listingPhotos[job.id] ?? []).map((photo) => (
                          <Image key={photo.id} source={{ uri: photo.publicUrl }} style={styles.jobPhotoThumb} resizeMode="cover" />
                        ))}
                      </View>
                    </View>
                  )}

                  {canViewApps && (
                    <Pressable style={styles.applicationsBtn} onPress={() => openApplications(job.id)}>
                      <Users size={17} color={COLORS.primary} />
                      <Text style={styles.applicationText}>{job.applications} application{job.applications === 1 ? '' : 's'}</Text>
                    </Pressable>
                  )}

                  {!canViewApps && job.applications > 0 && (
                    <View style={styles.applicationRow}>
                      <Users size={17} color={COLORS.textMuted} />
                      <Text style={styles.applicationTextMuted}>{job.applications} application{job.applications === 1 ? '' : 's'} received</Text>
                    </View>
                  )}

                  <View style={styles.actionRow}>
                    {canConfirm && (
                      <Pressable style={styles.confirmBtn} onPress={() => handleConfirm(job.id)}>
                        <CheckCircle2 size={16} color={COLORS.card} strokeWidth={2.2} />
                        <Text style={styles.confirmBtnText}>Confirm completion</Text>
                      </Pressable>
                    )}
                    {canCancel && (
                      <Pressable style={styles.cancelActionBtn} onPress={() => handleCancel(job.id)}>
                        <XCircle size={16} color={COLORS.error} strokeWidth={2} />
                        <Text style={styles.cancelActionText}>Cancel job</Text>
                      </Pressable>
                    )}
                    {canReopen && (
                      <Pressable style={styles.reopenBtn} onPress={() => handleReopen(job.id)}>
                        <RotateCcw size={16} color={COLORS.primary} strokeWidth={2} />
                        <Text style={styles.reopenBtnText}>Reopen</Text>
                      </Pressable>
                    )}
                  </View>

                  {isLocked ? (
                    <View style={styles.lockedNote}>
                      <AlertCircle size={14} color={COLORS.textMuted} strokeWidth={2} />
                      <Text style={styles.lockedText}>This job is in progress and cannot be deleted</Text>
                    </View>
                  ) : deleteId === job.id ? (
                    <View style={styles.deleteConfirm}>
                      <Text style={styles.confirmText}>Permanently remove this listing?</Text>
                      <View style={styles.confirmActions}>
                        <Pressable onPress={() => setDeleteId(null)}><Text style={styles.cancelText}>Keep it</Text></Pressable>
                        <Pressable style={styles.deleteConfirmButton} onPress={() => { setDeleteId(null); runAction(() => deleteEmployerJob(job.id).then(() => ({ success: true })).catch((e) => ({ success: false, error: e.message })), 'Listing deleted'); }}>
                          <Text style={styles.deleteText}>Delete</Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable style={styles.deleteButton} onPress={() => setDeleteId(job.id)}>
                      <Trash2 size={16} color={COLORS.error} />
                      <Text style={styles.deleteButtonText}>Delete listing</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>
          );
        })}

        {filteredJobs.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{activeFilter === 'all' ? 'No jobs posted yet' : 'No jobs in this filter'}</Text>
            <Text style={styles.subtitle}>{activeFilter === 'all' ? 'Create your first listing to start receiving applications.' : 'Try a different filter tab.'}</Text>
          </View>
        )}
      </ScrollView>

      {/* Applications modal */}
      <Modal visible={showApplications !== null} transparent animationType="slide" onRequestClose={() => setShowApplications(null)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowApplications(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Applications</Text>
            <Pressable onPress={() => setShowApplications(null)} hitSlop={8}><Text style={styles.sheetClose}>×</Text></Pressable>
          </View>
          {apps.length === 0 ? (
            <Text style={styles.emptyApps}>No applications yet. Workers who apply will appear here.</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {apps.map((app) => (
                <View key={app.id} style={styles.appCard}>
                  <View style={styles.appHeader}>
                    <View style={styles.appAvatar}><Users size={20} color={COLORS.primary} /></View>
                    <View style={styles.appInfo}>
                      <Text style={styles.appName}>{app.workerName}</Text>
                      <Text style={styles.appLocation}>{app.workerLocation}</Text>
                    </View>
                    {app.status === 'pending' ? (
                      <Pressable
                        style={styles.selectBtn}
                        onPress={() => handleSelect(app.id)}
                        disabled={actionLoading}
                      >
                        <Text style={styles.selectBtnText}>Select</Text>
                      </Pressable>
                    ) : (
                      <View style={[styles.appStatusPill, app.status === 'accepted' && styles.appStatusAccepted]}>
                        <Text style={styles.appStatusText}>{app.status}</Text>
                      </View>
                    )}
                  </View>
                  {app.message ? <Text style={styles.appMessage}>{app.message}</Text> : null}
                  {app.proposedPrice != null && (
                    <Text style={styles.appPrice}>Proposed: R{app.proposedPrice}</Text>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Confirmation popup modal */}
      <Modal visible={confirmPopupJob !== null} transparent animationType="fade" onRequestClose={dismissPopup}>
        <Pressable style={styles.popupBackdrop} onPress={dismissPopup} />
        <View style={styles.popupCard}>
          <View style={styles.popupHeader}>
            <View style={styles.popupIconBg}><Bell size={24} color={COLORS.warning} strokeWidth={2.2} /></View>
            <Text style={styles.popupTitle}>Completion awaiting confirmation</Text>
          </View>
          {confirmPopupJob && (
            <>
              <Text style={styles.popupJobTitle}>{confirmPopupJob.title}</Text>
              <Text style={styles.popupJobMeta}>{confirmPopupJob.location} · R{confirmPopupJob.budget} · {confirmPopupJob.scheduledDate}</Text>
              <Text style={styles.popupDesc}>
                The worker has marked this job as complete. Please confirm that the work was completed satisfactorily.
              </Text>
              {confirmPopupJob.preferredPaymentMethod === 'cash' && (
                <View style={styles.popupPayNote}>
                  <Banknote size={15} color={COLORS.secondary} strokeWidth={2.2} />
                  <Text style={styles.popupPayText}>Cash payment — earning will be recorded as cash received</Text>
                </View>
              )}
              {confirmPopupJob.preferredPaymentMethod === 'card' && (
                <View style={styles.popupPayNote}>
                  <CreditCard size={15} color={COLORS.primary} strokeWidth={2.2} />
                  <Text style={styles.popupPayText}>Card payment — earning will be available for worker withdrawal</Text>
                </View>
              )}
              <View style={styles.popupActions}>
                <Pressable style={styles.popupLaterBtn} onPress={dismissPopup}>
                  <Text style={styles.popupLaterText}>Later</Text>
                </Pressable>
                <Pressable
                  style={[styles.popupConfirmBtn, actionLoading && styles.popupConfirmBtnDisabled]}
                  onPress={() => confirmPopupJob && handleConfirm(confirmPopupJob.id)}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color={COLORS.card} />
                  ) : (
                    <Text style={styles.popupConfirmText}>Confirm completion</Text>
                  )}
                </Pressable>
              </View>
              {confirmationJobs.length > 1 && (
                <Pressable style={styles.popupNextLink} onPress={showNextConfirmation}>
                  <Text style={styles.popupNextText}>{confirmationJobs.length - 1} more awaiting confirmation →</Text>
                </Pressable>
              )}
            </>
          )}
        </View>
      </Modal>
    </View>
  );
}

function getStatusStyle(status: string): { backgroundColor: string } {
  const map: Record<string, string> = {
    draft: COLORS.textMuted + '1A',
    open: COLORS.secondary + '1A',
    assigned: COLORS.primary + '1A',
    in_progress: COLORS.warning + '1A',
    awaiting_confirmation: COLORS.accent + '1A',
    completed: COLORS.success + '1A',
    cancelled: COLORS.error + '1A',
    expired: COLORS.textMuted + '1A',
  };
  return { backgroundColor: map[status] ?? COLORS.secondary + '1A' };
}

function getStatusTextColor(status: string): string {
  const map: Record<string, string> = {
    draft: COLORS.textMuted,
    open: COLORS.secondary,
    assigned: COLORS.primary,
    in_progress: COLORS.warning,
    awaiting_confirmation: COLORS.accentDark,
    completed: COLORS.success,
    cancelled: COLORS.error,
    expired: COLORS.textMuted,
  };
  return map[status] ?? COLORS.secondary;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md },
  topBar: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SPACING.md },
  title: { fontFamily: FONTS.bold, fontSize: 25, color: COLORS.text },
  subtitle: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, marginTop: 3 },
  menuButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.warning + '1A', borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, marginBottom: SPACING.md },
  alertIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.warning, alignItems: 'center', justifyContent: 'center' },
  alertText: { flex: 1, fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
  alertAction: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.warning },
  filterTabs: { marginBottom: SPACING.md },
  filterTabsContent: { gap: SPACING.xs + 2 },
  filterTab: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingHorizontal: SPACING.sm + 2, paddingVertical: 7 },
  filterTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterTabText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted },
  filterTabTextActive: { color: COLORS.card },
  filterBadge: { backgroundColor: COLORS.background, borderRadius: 8, minWidth: 18, paddingHorizontal: 5, paddingVertical: 1, alignItems: 'center' },
  filterBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  filterBadgeText: { fontFamily: FONTS.semiBold, fontSize: 10, color: COLORS.textMuted },
  filterBadgeTextActive: { color: COLORS.card },
  resultBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: RADIUS.md, padding: SPACING.sm + 2, marginBottom: SPACING.md },
  resultSuccess: { backgroundColor: COLORS.success + '1A' },
  resultError: { backgroundColor: COLORS.error + '1A' },
  resultText: { flex: 1, fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
  resultClose: { fontSize: 18, color: COLORS.textMuted, paddingHorizontal: SPACING.xs },
  loadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  loadingText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted },
  jobCard: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm },
  jobHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm },
  jobIcon: { width: 39, height: 39, borderRadius: 20, backgroundColor: '#DDF4EC', alignItems: 'center', justifyContent: 'center' },
  jobCopy: { flex: 1 },
  jobTitle: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text },
  jobMeta: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 },
  statusPill: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontFamily: FONTS.medium, fontSize: 11 },
  modeTag: { backgroundColor: COLORS.background, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: COLORS.border },
  modeTagText: { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.textMuted },
  payTag: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1 },
  payTagCash: { backgroundColor: '#EAF7F2', borderColor: COLORS.secondary },
  payTagCard: { backgroundColor: '#EAF2F7', borderColor: COLORS.primary },
  payTagText: { fontFamily: FONTS.medium, fontSize: 10 },
  payTagTextCash: { color: COLORS.secondary },
  payTagTextCard: { color: COLORS.primary },
  details: { borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: SPACING.md, paddingTop: SPACING.md },
  description: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20, color: COLORS.text },
  jobPhotosSection: { marginTop: SPACING.md },
  jobPhotosHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  jobPhotosTitle: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text },
  jobPhotosGrid: { flexDirection: 'row', gap: SPACING.sm },
  jobPhotoThumb: { width: 72, height: 72, borderRadius: RADIUS.md },
  applicationRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md },
  applicationTextMuted: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted },
  applicationsBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md, backgroundColor: '#EAF7F2', borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 8 },
  applicationText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.primary },
  actionRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.md, flexWrap: 'wrap' },
  confirmBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.success, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm + 2, paddingVertical: 8 },
  confirmBtnText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.card },
  cancelActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.error, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm + 2, paddingVertical: 8 },
  cancelActionText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.error },
  reopenBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm + 2, paddingVertical: 8 },
  reopenBtnText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.primary },
  lockedNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.lg },
  lockedText: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.lg },
  deleteButtonText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.error },
  deleteConfirm: { backgroundColor: '#FFF5F5', borderRadius: RADIUS.md, padding: SPACING.sm, marginTop: SPACING.md },
  confirmText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
  confirmActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: SPACING.md, marginTop: SPACING.sm },
  cancelText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.textMuted },
  deleteConfirmButton: { backgroundColor: COLORS.error, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm + 2, paddingVertical: 6 },
  deleteText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.card },
  empty: { alignItems: 'center', padding: SPACING.xl },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text, marginBottom: 4 },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 35, 27, 0.5)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING.xl, maxHeight: '70%' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  sheetTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  sheetClose: { fontSize: 24, color: COLORS.textMuted, paddingHorizontal: SPACING.sm },
  emptyApps: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingVertical: SPACING.xl },
  appCard: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border },
  appHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  appAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DDF4EC', alignItems: 'center', justifyContent: 'center' },
  appInfo: { flex: 1 },
  appName: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  appLocation: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  selectBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm + 2, paddingVertical: 7 },
  selectBtnText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.card },
  appStatusPill: { backgroundColor: COLORS.textMuted + '1A', borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 5 },
  appStatusAccepted: { backgroundColor: COLORS.success + '1A' },
  appStatusText: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted, textTransform: 'capitalize' },
  appMessage: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.text, lineHeight: 18, marginTop: SPACING.sm },
  appPrice: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.primary, marginTop: 4 },
  // Confirmation popup
  popupBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 35, 27, 0.55)' },
  popupCard: { position: 'absolute', top: '18%', left: SPACING.lg, right: SPACING.lg, backgroundColor: COLORS.card, borderRadius: RADIUS.xl, padding: SPACING.lg },
  popupHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  popupIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.warning + '1A', alignItems: 'center', justifyContent: 'center' },
  popupTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 17, color: COLORS.text, lineHeight: 22 },
  popupJobTitle: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text, marginBottom: 4 },
  popupJobMeta: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, marginBottom: SPACING.sm },
  popupDesc: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text, lineHeight: 20, marginBottom: SPACING.sm },
  popupPayNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.sm, marginBottom: SPACING.md },
  popupPayText: { flex: 1, fontFamily: FONTS.medium, fontSize: 12, color: COLORS.text, lineHeight: 17 },
  popupActions: { flexDirection: 'row', gap: SPACING.sm },
  popupLaterBtn: { flex: 1, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, alignItems: 'center', paddingVertical: SPACING.md },
  popupLaterText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.textMuted },
  popupConfirmBtn: { flex: 2, backgroundColor: COLORS.success, borderRadius: RADIUS.md, alignItems: 'center', paddingVertical: SPACING.md },
  popupConfirmBtnDisabled: { opacity: 0.5 },
  popupConfirmText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.card },
  popupNextLink: { alignItems: 'center', marginTop: SPACING.md },
  popupNextText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.primary },
});
