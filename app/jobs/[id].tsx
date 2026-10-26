import { useState, useLayoutEffect, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Image, Modal, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft, MapPin, Calendar, Clock, Timer, FileText, Info,
  Navigation, X, CheckCircle2, Play, Flag, RotateCcw,
  Camera, Image as ImageIcon, Trash2, Maximize2,
} from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { JobStatusBadge } from '@/components/JobStatusBadge';
import { DirectionsModal } from '@/components/DirectionsModal';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { ServiceIcon } from '@/components/ServiceIcon';
import { Job } from '@/types';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

export default function JobDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    jobs, claimJob, declineJob, startJob, submitCompletion,
    cancelJob, refreshJobs, workPhotos, listingPhotos, uploadWorkPhoto, deleteWorkPhoto, loadWorkPhotos, loadListingPhotos,
  } = useApp();

  const job = jobs.find((j) => j.id === id);
  const photos = id ? (workPhotos[id] ?? []) : [];
  const listingPhotosList = id ? (listingPhotos[id] ?? []) : [];

  const [showClaim, setShowClaim] = useState(false);
  const [showDecline, setShowDecline] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [viewerPhoto, setViewerPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (job) {
      loadListingPhotos(job.id);
      if (job.status === 'in_progress' || job.status === 'awaiting_confirmation' || job.status === 'completed') {
        loadWorkPhotos(job.id);
      }
    }
  }, [job?.id, job?.status, loadWorkPhotos, loadListingPhotos]);

  const handleClaim = useCallback(async () => {
    if (!job) return;
    setShowClaim(false);
    setActionLoading(true);
    const result = await claimJob(job.id);
    setActionLoading(false);
    if (result.success) {
      setActionResult({ success: true, message: 'Job accepted successfully!' });
    } else {
      setActionResult({ success: false, message: result.error ?? 'Could not accept this job.' });
      await refreshJobs();
    }
  }, [job, claimJob, refreshJobs]);

  const handleStart = useCallback(async () => {
    if (!job) return;
    setShowStart(false);
    setActionLoading(true);
    const result = await startJob(job.id);
    setActionLoading(false);
    setActionResult({
      success: result.success,
      message: result.success ? 'Job started. Good luck!' : (result.error ?? 'Could not start this job.'),
    });
  }, [job, startJob]);

  const handleSubmitCompletion = useCallback(async () => {
    if (!job) return;
    setShowComplete(false);
    setActionLoading(true);
    const result = await submitCompletion(job.id);
    setActionLoading(false);
    setActionResult({
      success: result.success,
      message: result.success ? 'Completion submitted. The employer will confirm.' : (result.error ?? 'Could not submit completion.'),
    });
  }, [job, submitCompletion]);

  const handleCancel = useCallback(async () => {
    if (!job) return;
    setShowCancel(false);
    setActionLoading(true);
    const result = await cancelJob(job.id);
    setActionLoading(false);
    setActionResult({
      success: result.success,
      message: result.success ? 'Job cancelled.' : (result.error ?? 'Could not cancel this job.'),
    });
  }, [job, cancelJob]);

  const handleDecline = useCallback(() => {
    if (!job) return;
    declineJob(job.id);
    setShowDecline(false);
    router.replace('/(tabs)/jobs');
  }, [job, declineJob, router]);

  const handleAddPhoto = useCallback(async (fromCamera: boolean) => {
    if (!job) return;
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true });
      if (result.canceled || !result.assets[0]) {
        setPhotoUploading(false);
        return;
      }
      const asset = result.assets[0];
      const uploadResult = await uploadWorkPhoto(job.id, asset.uri);
      if (!uploadResult.success) {
        setPhotoError(uploadResult.error ?? 'Could not upload photo.');
      }
    } catch {
      setPhotoError('Could not upload photo.');
    }
    setPhotoUploading(false);
  }, [job, uploadWorkPhoto]);

  const handleDeletePhoto = useCallback(async (photoId: string, storagePath: string) => {
    if (!job) return;
    const result = await deleteWorkPhoto(photoId, job.id, storagePath);
    if (!result.success) {
      setPhotoError(result.error ?? 'Could not delete photo.');
    }
  }, [job, deleteWorkPhoto]);

  if (!job) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Job not found.</Text>
        <Pressable onPress={() => router.replace('/(tabs)/jobs')}>
          <Text style={styles.notFoundLink}>Back to Jobs</Text>
        </Pressable>
      </View>
    );
  }

  const approxDriveMin = Math.max(3, Math.round(job.distanceKm * 2.2));
  const isInstantAccept = job.fulfillmentMode === 'instant_accept';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <ArrowLeft size={24} color={COLORS.text} strokeWidth={2.2} />
        </Pressable>
        <Text style={styles.headerTitle}>Job Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.statusPill}>
              <JobStatusBadge status={job.status} />
            </View>
            <ServiceIcon category={job.category} size={58} color="rgba(255,255,255,0.75)" />
          </View>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.category}>{job.category} · {job.location}</Text>
          <Text style={styles.price}>R{job.price}</Text>
          <View style={styles.commissionNoteRow}>
            <Text style={styles.commissionNoteText}>
              You keep R{Math.round(job.price * 0.9)} (10% Yenza fee: R{Math.round(job.price * 0.1)})
            </Text>
          </View>
          {isInstantAccept && (
            <View style={styles.modePill}>
              <CheckCircle2 size={13} color={COLORS.primaryDark} strokeWidth={2.2} />
              <Text style={styles.modePillText}>Instant accept</Text>
            </View>
          )}
          {!isInstantAccept && (
            <View style={styles.modePill}>
              <FileText size={13} color={COLORS.primaryDark} strokeWidth={2.2} />
              <Text style={styles.modePillText}>Apply for this job</Text>
            </View>
          )}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>Job Location</Text>
          <View style={styles.infoRow}>
            <MapPin size={18} color={COLORS.secondary} strokeWidth={2} />
            <View>
              <Text style={styles.infoPrimary}>{job.location}</Text>
              <Text style={styles.infoSecondary}>{job.distanceKm} km away · approx. {approxDriveMin} min drive</Text>
            </View>
          </View>
          <Pressable style={styles.directionsBtn} onPress={() => setShowDirections(true)}>
            <Navigation size={18} color={COLORS.card} strokeWidth={2.2} />
            <Text style={styles.directionsBtnText}>Get Directions</Text>
          </Pressable>
        </View>

        <View style={styles.splitRow}>
          <View style={styles.splitCard}>
            <Calendar size={21} color={COLORS.secondary} strokeWidth={2} />
            <Text style={styles.cardTitle}>Requested Time</Text>
            <Text style={styles.infoPrimary}>{job.scheduledDate} · {job.scheduledTime}</Text>
          </View>
          <View style={styles.splitCard}>
            <Timer size={21} color={COLORS.secondary} strokeWidth={2} />
            <Text style={styles.cardTitle}>Duration</Text>
            <Text style={styles.infoPrimary}>{job.estimatedDuration}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardTitleRow}>
            <FileText size={18} color={COLORS.secondary} strokeWidth={2} />
            <Text style={styles.cardTitle}>Customer Request</Text>
          </View>
          <Text style={styles.description}>{job.description}</Text>
        </View>

        {listingPhotosList.length > 0 && (
          <View style={styles.infoCard}>
            <View style={styles.cardTitleRow}>
              <Camera size={18} color={COLORS.secondary} strokeWidth={2} />
              <Text style={styles.cardTitle}>Job Photos</Text>
              <Text style={styles.photoCount}>{listingPhotosList.length}/3</Text>
            </View>
            <Text style={styles.photoHint}>Photos shared by the employer. Review these before starting the job.</Text>
            <View style={styles.photoGrid}>
              {listingPhotosList.map((photo) => (
                <Pressable key={photo.id} style={styles.photoThumb} onPress={() => setViewerPhoto(photo.publicUrl)}>
                  <Image source={{ uri: photo.publicUrl }} style={styles.photoImage} resizeMode="cover" />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {(job.status === 'in_progress' || job.status === 'awaiting_confirmation' || job.status === 'completed') && (
          <View style={styles.infoCard}>
            <View style={styles.cardTitleRow}>
              <Camera size={18} color={COLORS.secondary} strokeWidth={2} />
              <Text style={styles.cardTitle}>Work Photos</Text>
              <Text style={styles.photoCount}>{photos.length}/3</Text>
            </View>

            {photoError && (
              <Text style={styles.photoError}>{photoError}</Text>
            )}

            {photos.length > 0 && (
              <View style={styles.photoGrid}>
                {photos.map((photo) => (
                  <View key={photo.id} style={styles.photoThumb}>
                    <Pressable onPress={() => setViewerPhoto(photo.publicUrl)}>
                      <Image source={{ uri: photo.publicUrl }} style={styles.photoImage} resizeMode="cover" />
                    </Pressable>
                    <Pressable
                      style={styles.photoDelete}
                      onPress={() => handleDeletePhoto(photo.id, `job-photos/${job.id}/${photo.publicUrl.split('/').pop()}`)}
                      hitSlop={6}
                    >
                      <Trash2 size={14} color={COLORS.error} strokeWidth={2.2} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {job.status === 'in_progress' && photos.length < 3 && (
              <View style={styles.photoActions}>
                <Pressable style={styles.photoAddBtn} onPress={() => handleAddPhoto(false)} disabled={photoUploading}>
                  <ImageIcon size={18} color={COLORS.primary} strokeWidth={2} />
                  <Text style={styles.photoAddText}>Gallery</Text>
                </Pressable>
                <Pressable style={styles.photoAddBtn} onPress={() => handleAddPhoto(true)} disabled={photoUploading}>
                  <Camera size={18} color={COLORS.primary} strokeWidth={2} />
                  <Text style={styles.photoAddText}>Camera</Text>
                </Pressable>
              </View>
            )}

            {photoUploading && (
              <View style={styles.photoLoadingRow}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={styles.photoLoadingText}>Uploading…</Text>
              </View>
            )}

            <Text style={styles.photoHint}>Upload up to 3 photos of the work. These will be visible to the employer and can be analysed by Yenza-AI.</Text>
          </View>
        )}

        {actionResult && (
          <View style={[styles.resultBanner, actionResult.success ? styles.resultSuccess : styles.resultError]}>
            <Text style={styles.resultText}>{actionResult.message}</Text>
            <Pressable onPress={() => setActionResult(null)} hitSlop={8}>
              <X size={16} color={actionResult.success ? COLORS.success : COLORS.error} strokeWidth={2.2} />
            </Pressable>
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {actionLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}

      {/* Bottom actions based on job status */}
      {job.status === 'open' && (
        <View style={styles.bottomActions}>
          <Pressable style={styles.declineBtn} onPress={() => setShowDecline(true)}>
            <Text style={styles.declineText}>Decline</Text>
          </Pressable>
          {isInstantAccept ? (
            <Pressable
              style={styles.acceptBtn}
              onPress={() => setShowClaim(true)}
              disabled={actionLoading}
            >
              <Text style={styles.acceptText}>Accept Job</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.acceptBtn}
              onPress={() => router.push(`/jobs/${job.id}?apply=1`)}
              disabled={actionLoading}
            >
              <Text style={styles.acceptText}>Apply Now</Text>
            </Pressable>
          )}
        </View>
      )}

      {job.status === 'assigned' && (
        <View style={styles.bottomActions}>
          <Pressable style={styles.cancelActionBtn} onPress={() => setShowCancel(true)}>
            <Flag size={16} color={COLORS.error} strokeWidth={2} />
            <Text style={styles.cancelActionText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.startBtn} onPress={() => setShowStart(true)} disabled={actionLoading}>
            <Play size={18} color={COLORS.card} strokeWidth={2.2} />
            <Text style={styles.acceptText}>Start Job</Text>
          </Pressable>
        </View>
      )}

      {job.status === 'in_progress' && (
        <View style={styles.bottomActions}>
          <Pressable style={styles.cancelActionBtn} onPress={() => setShowCancel(true)}>
            <Flag size={16} color={COLORS.error} strokeWidth={2} />
            <Text style={styles.cancelActionText}>Cancel</Text>
          </Pressable>
          <Pressable style={styles.completeBtn} onPress={() => setShowComplete(true)} disabled={actionLoading}>
            <CheckCircle2 size={18} color={COLORS.card} strokeWidth={2.2} />
            <Text style={styles.acceptText}>Mark Complete</Text>
          </Pressable>
        </View>
      )}

      {(job.status === 'awaiting_confirmation' || job.status === 'completed' || job.status === 'cancelled') && (
        <View style={styles.bottomActions}>
          <Pressable style={styles.directionsBottomBtn} onPress={() => setShowDirections(true)}>
            <Navigation size={18} color={COLORS.card} strokeWidth={2.2} />
            <Text style={styles.acceptText}>Get Directions</Text>
          </Pressable>
          <Pressable style={styles.viewBottomBtn} onPress={() => router.push('/(tabs)/jobs')}>
            <Text style={styles.viewBottomText}>Jobs</Text>
          </Pressable>
        </View>
      )}

      <ConfirmationModal
        visible={showClaim}
        title="Accept this job?"
        onDismiss={() => setShowClaim(false)}
        primaryLabel="Confirm & Accept"
        onPrimary={handleClaim}
        secondaryLabel="Cancel"
        onSecondary={() => setShowClaim(false)}
      >
        <Text style={styles.modalJobTitle}>{job.title}</Text>
        <Text style={styles.modalPrice}>R{job.price}</Text>
        <Text style={styles.modalTime}>{job.scheduledDate} · {job.scheduledTime}</Text>
      </ConfirmationModal>

      <ConfirmationModal
        visible={showDecline}
        title="Decline this job?"
        onDismiss={() => setShowDecline(false)}
        primaryLabel="Decline Job"
        onPrimary={handleDecline}
        secondaryLabel="Keep Job"
        onSecondary={() => setShowDecline(false)}
        primaryVariant="danger"
      >
        <Text style={styles.modalJobTitle}>{job.title}</Text>
        <Text style={styles.modalPrice}>R{job.price}</Text>
        <Text style={styles.modalSubtext}>
          This job will be removed from your available jobs.
        </Text>
      </ConfirmationModal>

      <ConfirmationModal
        visible={showStart}
        title="Start this job?"
        onDismiss={() => setShowStart(false)}
        primaryLabel="Start Work"
        onPrimary={handleStart}
        secondaryLabel="Not yet"
        onSecondary={() => setShowStart(false)}
      >
        <Text style={styles.modalJobTitle}>{job.title}</Text>
        <Text style={styles.modalSubtext}>The employer will be notified that work has begun.</Text>
      </ConfirmationModal>

      <ConfirmationModal
        visible={showComplete}
        title="Mark job as complete?"
        onDismiss={() => setShowComplete(false)}
        primaryLabel="Submit Completion"
        onPrimary={handleSubmitCompletion}
        secondaryLabel="Not yet"
        onSecondary={() => setShowComplete(false)}
      >
        <Text style={styles.modalJobTitle}>{job.title}</Text>
        <Text style={styles.modalSubtext}>The employer will review and confirm the completion.</Text>
      </ConfirmationModal>

      <ConfirmationModal
        visible={showCancel}
        title="Cancel this job?"
        onDismiss={() => setShowCancel(false)}
        primaryLabel="Yes, Cancel"
        onPrimary={handleCancel}
        secondaryLabel="Keep Job"
        onSecondary={() => setShowCancel(false)}
        primaryVariant="danger"
      >
        <Text style={styles.modalJobTitle}>{job.title}</Text>
        <Text style={styles.modalSubtext}>The employer will be notified that you have cancelled.</Text>
      </ConfirmationModal>

      <DirectionsModal visible={showDirections} job={job} onDismiss={() => setShowDirections(false)} />

      {/* Full-screen photo viewer */}
      <Modal visible={viewerPhoto !== null} transparent animationType="fade" onRequestClose={() => setViewerPhoto(null)}>
        <Pressable style={styles.viewerBackdrop} onPress={() => setViewerPhoto(null)}>
          {viewerPhoto && <Image source={{ uri: viewerPhoto }} style={styles.viewerImage} resizeMode="contain" />}
          <Pressable style={styles.viewerClose} onPress={() => setViewerPhoto(null)} hitSlop={12}>
            <X size={26} color={COLORS.card} strokeWidth={2.4} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2, backgroundColor: COLORS.card, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontFamily: FONTS.semiBold, fontSize: 17, color: COLORS.text },
  scroll: { padding: SPACING.md },
  heroCard: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.md + 2, marginBottom: SPACING.md },
  heroTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SPACING.sm },
  statusPill: { backgroundColor: COLORS.accent, borderRadius: RADIUS.xl, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  title: { fontFamily: FONTS.bold, fontSize: 25, color: COLORS.card, marginBottom: 2 },
  category: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.card, opacity: 0.9 },
  price: { fontFamily: FONTS.bold, fontSize: 38, color: COLORS.card, marginTop: SPACING.sm },
  commissionNoteRow: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm + 2, paddingVertical: 5, alignSelf: 'flex-start', marginTop: SPACING.xs + 1 },
  commissionNoteText: { fontFamily: FONTS.medium, fontSize: 12, color: 'rgba(255,255,255,0.88)' },
  modePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: COLORS.accent, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm + 2, paddingVertical: 4, alignSelf: 'flex-start', marginTop: SPACING.sm },
  modePillText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.primaryDark },
  splitRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm + 2 },
  splitCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  infoCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.md + 2, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm + 2 },
  cardTitle: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text, marginBottom: SPACING.sm + 2 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm + 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + 2, marginBottom: SPACING.sm },
  infoPrimary: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text },
  infoSecondary: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.secondary, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, marginTop: SPACING.xs },
  directionsBtnText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.card },
  description: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.text, lineHeight: 22, fontStyle: 'italic' },
  resultBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: RADIUS.md, padding: SPACING.sm + 2, marginBottom: SPACING.sm + 2 },
  resultSuccess: { backgroundColor: COLORS.success + '1A' },
  resultError: { backgroundColor: COLORS.error + '1A' },
  resultText: { flex: 1, fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text, marginRight: SPACING.sm },
  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  bottomActions: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.md, backgroundColor: COLORS.card, borderTopWidth: 1, borderTopColor: COLORS.border },
  declineBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.error, alignItems: 'center' },
  declineText: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.error },
  acceptBtn: { flex: 1.5, paddingVertical: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: SPACING.xs },
  acceptText: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.card },
  startBtn: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.primary },
  completeBtn: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.success },
  cancelActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.error },
  cancelActionText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.error },
  directionsBottomBtn: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.secondary },
  viewBottomBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary, alignItems: 'center' },
  viewBottomText: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.primary },
  modalJobTitle: { fontFamily: FONTS.semiBold, fontSize: 17, color: COLORS.text, marginBottom: 4 },
  modalPrice: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.primary, marginBottom: 4 },
  modalTime: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted },
  modalSubtext: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted, marginTop: SPACING.xs + 1, lineHeight: 19 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  notFoundText: { fontFamily: FONTS.semiBold, fontSize: 17, color: COLORS.text, marginBottom: SPACING.sm },
  notFoundLink: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.primary },
  photoCount: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted, marginLeft: 'auto' },
  photoError: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.error, marginBottom: SPACING.sm },
  photoGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  photoThumb: { width: 90, height: 90, borderRadius: RADIUS.md, overflow: 'hidden', position: 'relative' },
  photoImage: { width: 90, height: 90 },
  photoDelete: { position: 'absolute', top: 4, right: 4, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.85)', alignItems: 'center', justifyContent: 'center' },
  photoActions: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  photoAddBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  photoAddText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.primary },
  photoLoadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  photoLoadingText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted },
  photoHint: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  viewerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  viewerImage: { width: '92%', height: '72%' },
  viewerClose: { position: 'absolute', top: 50, right: 20, width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});
