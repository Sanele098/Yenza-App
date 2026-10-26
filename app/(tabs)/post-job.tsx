import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Image, ActivityIndicator, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Check, MapPin, Plus, Zap, FileText, Banknote, CreditCard, Wifi, Image as ImageIcon, X, Calendar, Locate, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { FulfillmentMode, JobCategory, PricingType, PreferredPaymentMethod } from '@/types';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';
import { CalendarPickerModal } from '@/components/CalendarPickerModal';
import { LocationPickerModal } from '@/components/LocationPickerModal';

const categories: JobCategory[] = ['Cleaning', 'Gardening', 'Plumbing', 'Painting', 'Moving Assistance', 'Electrical', 'Carpentry', 'General Labour', 'Car Washing', 'Event Assistance', 'Welding', 'Tiling', 'Mechanics', 'Solar Installation', 'Digital', 'Remote', 'Other'];
const pricingTypes: { value: PricingType; label: string }[] = [
  { value: 'fixed', label: 'Fixed price' },
  { value: 'hourly', label: 'Hourly rate' },
  { value: 'quote', label: 'Quote required' },
];

export default function PostJobScreen() {
  const router = useRouter();
  const { createEmployerJob } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<JobCategory>('Cleaning');
  const [location, setLocation] = useState('');
  const [budget, setBudget] = useState('');
  const [dateISO, setDateISO] = useState<string | null>(null);
  const [dateLabel, setDateLabel] = useState('');
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>('instant_accept');
  const [pricingType, setPricingType] = useState<PricingType>('fixed');
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState<PreferredPaymentMethod>('cash');
  const [isRemote, setIsRemote] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const canSubmit = !!title.trim() && !!description.trim() && !!budget.trim() && !submitting;

  const pickPhoto = async (fromCamera: boolean) => {
    if (photos.length >= 3) return;
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
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    } catch {
      setPhotoError('Could not pick photo.');
    }
    setPhotoUploading(false);
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const publish = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    const result = await createEmployerJob({
      title: title.trim(),
      description: description.trim(),
      category,
      location: isRemote ? 'Remote' : location.trim(),
      budget: Number(budget),
      scheduledDate: dateLabel || dateISO || 'This week',
      scheduledTime: '09:00',
      fulfillmentMode,
      pricingType,
      preferredPaymentMethod,
      isRemote,
      photoUris: photos.length > 0 ? photos : undefined,
    });
    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
    } else {
      setError(result.error ?? 'Could not post job');
    }
  };

  return <View style={styles.container}><ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
    <View style={styles.topBar}><Pressable onPress={() => router.back()}><ArrowLeft size={23} color={COLORS.text} strokeWidth={2} /></Pressable><Text style={styles.title}>Post a job</Text><View style={{ width: 23 }} /></View>
    {submitted ? <View style={styles.successCard}><View style={styles.successIcon}><Check size={28} color={COLORS.card} strokeWidth={2.5} /></View><Text style={styles.successTitle}>Your job is live</Text><Text style={styles.successText}>{fulfillmentMode === 'instant_accept' ? 'Workers can now accept this job immediately.' : 'Workers can now submit applications for your review.'}</Text><Pressable style={styles.primaryButton} onPress={() => router.replace('/(tabs)/my-jobs' as never)}><Text style={styles.primaryText}>View my jobs</Text></Pressable><Pressable onPress={() => router.replace('/(tabs)/home' as never)}><Text style={styles.secondaryAction}>Back to home</Text></Pressable></View> : <>
      <Text style={styles.intro}>Tell workers what needs to be done. Clear details help you receive better applications.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Job title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Fix leaking kitchen tap" placeholderTextColor={COLORS.textMuted} />
        <Text style={styles.label}>Describe the work</Text>
        <TextInput style={styles.textArea} value={description} onChangeText={setDescription} multiline textAlignVertical="top" placeholder="What is happening? What should the worker do?" placeholderTextColor={COLORS.textMuted} />
        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>{categories.map((item) => <Pressable key={item} style={[styles.chip, category === item && styles.chipActive]} onPress={() => setCategory(item)}><Text style={[styles.chipText, category === item && styles.chipTextActive]}>{item}</Text></Pressable>)}</View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>How should workers respond?</Text>
        <Pressable style={[styles.modeOption, fulfillmentMode === 'instant_accept' && styles.modeOptionActive]} onPress={() => setFulfillmentMode('instant_accept')}>
          <View style={styles.modeIcon}><Zap size={18} color={fulfillmentMode === 'instant_accept' ? COLORS.card : COLORS.primary} strokeWidth={2.2} /></View>
          <View style={styles.modeCopy}>
            <Text style={[styles.modeTitle, fulfillmentMode === 'instant_accept' && styles.modeTitleActive]}>Instant accept</Text>
            <Text style={styles.modeDesc}>First eligible worker gets the job. Best for simple tasks.</Text>
          </View>
        </Pressable>
        <Pressable style={[styles.modeOption, fulfillmentMode === 'application' && styles.modeOptionActive]} onPress={() => setFulfillmentMode('application')}>
          <View style={styles.modeIcon}><FileText size={18} color={fulfillmentMode === 'application' ? COLORS.card : COLORS.primary} strokeWidth={2.2} /></View>
          <View style={styles.modeCopy}>
            <Text style={[styles.modeTitle, fulfillmentMode === 'application' && styles.modeTitleActive]}>Workers apply</Text>
            <Text style={styles.modeDesc}>You review applications and choose. Best for skilled work.</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Pricing type</Text>
        <View style={styles.chips}>{pricingTypes.map((pt) => <Pressable key={pt.value} style={[styles.chip, pricingType === pt.value && styles.chipActive]} onPress={() => setPricingType(pt.value)}><Text style={[styles.chipText, pricingType === pt.value && styles.chipTextActive]}>{pt.label}</Text></Pressable>)}</View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>How will you pay the worker?</Text>
        <Pressable style={[styles.modeOption, preferredPaymentMethod === 'cash' && styles.modeOptionActive]} onPress={() => setPreferredPaymentMethod('cash')}>
          <View style={styles.modeIcon}><Banknote size={18} color={preferredPaymentMethod === 'cash' ? COLORS.card : COLORS.primary} strokeWidth={2.2} /></View>
          <View style={styles.modeCopy}>
            <Text style={[styles.modeTitle, preferredPaymentMethod === 'cash' && styles.modeTitleActive]}>Cash</Text>
            <Text style={styles.modeDesc}>Pay the worker in cash after the job is done. The worker will confirm receipt in the app.</Text>
          </View>
        </Pressable>
        <Pressable style={[styles.modeOption, preferredPaymentMethod === 'card' && styles.modeOptionActive]} onPress={() => setPreferredPaymentMethod('card')}>
          <View style={styles.modeIcon}><CreditCard size={18} color={preferredPaymentMethod === 'card' ? COLORS.card : COLORS.primary} strokeWidth={2.2} /></View>
          <View style={styles.modeCopy}>
            <Text style={[styles.modeTitle, preferredPaymentMethod === 'card' && styles.modeTitleActive]}>Card / EFT</Text>
            <Text style={styles.modeDesc}>Pay electronically via card or bank transfer. Funds are available to the worker immediately.</Text>
          </View>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Photos of the work area {photos.length > 0 && <Text style={styles.photoCountLabel}>{photos.length}/3</Text>}</Text>
        <Text style={styles.helper}>Photos are optional, but they help workers understand the task before they accept.</Text>

        {photos.length > 0 && (
          <View style={styles.photoGrid}>
            {photos.map((uri, index) => (
              <View key={index} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoImage} resizeMode="cover" />
                <Pressable style={styles.photoRemove} onPress={() => removePhoto(index)} hitSlop={6}>
                  <X size={14} color={COLORS.card} strokeWidth={2.4} />
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {photoError && <Text style={styles.photoError}>{photoError}</Text>}

        {photos.length < 3 && (
          <View style={styles.photoActions}>
            <Pressable style={styles.photoAddBtn} onPress={() => pickPhoto(false)} disabled={photoUploading}>
              <ImageIcon size={18} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.photoAddText}>Gallery</Text>
            </Pressable>
            <Pressable style={styles.photoAddBtn} onPress={() => pickPhoto(true)} disabled={photoUploading}>
              <Camera size={18} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.photoAddText}>Camera</Text>
            </Pressable>
          </View>
        )}

        {photoUploading && (
          <View style={styles.photoLoadingRow}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.photoLoadingText}>Loading…</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Pressable
          style={[styles.modeOption, isRemote && styles.modeOptionActive, { marginBottom: SPACING.sm }]}
          onPress={() => setIsRemote(!isRemote)}
        >
          <View style={styles.modeIcon}>
            <Wifi size={18} color={isRemote ? COLORS.card : COLORS.primary} strokeWidth={2.2} />
          </View>
          <View style={styles.modeCopy}>
            <Text style={[styles.modeTitle, isRemote && styles.modeTitleActive]}>This job is remote</Text>
            <Text style={styles.modeDesc}>The worker can complete this job from anywhere — no physical location needed.</Text>
          </View>
          <View style={[styles.checkbox, isRemote && styles.checkboxActive]}>
            {isRemote && <Check size={14} color={COLORS.card} strokeWidth={3} />}
          </View>
        </Pressable>
        {!isRemote && (
          <>
            <Text style={styles.label}>Location</Text>
            <Pressable style={styles.locationBtn} onPress={() => setShowLocationPicker(true)}>
              <MapPin size={19} color={COLORS.primary} strokeWidth={2} />
              <Text style={[styles.locationBtnText, !location && styles.locationBtnPlaceholder]} numberOfLines={1}>
                {location || 'Pick location from map'}
              </Text>
              <ChevronRight size={18} color={COLORS.textMuted} strokeWidth={2} />
            </Pressable>
          </>
        )}
        <Text style={styles.label}>Budget (R)</Text>
        <TextInput style={styles.input} value={budget} onChangeText={setBudget} keyboardType="numeric" placeholder="e.g. 450" placeholderTextColor={COLORS.textMuted} />
        <Text style={styles.label}>Preferred timing</Text>
        <Pressable style={styles.locationBtn} onPress={() => setShowCalendar(true)}>
          <Calendar size={19} color={COLORS.primary} strokeWidth={2} />
          <Text style={[styles.locationBtnText, !dateLabel && styles.locationBtnPlaceholder]} numberOfLines={1}>
            {dateLabel || 'Select a date'}
          </Text>
          <ChevronRight size={18} color={COLORS.textMuted} strokeWidth={2} />
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Pressable style={[styles.primaryButton, !canSubmit && styles.disabled]} onPress={publish}>
        <Text style={styles.primaryText}>{submitting ? 'Posting…' : 'Publish job'}</Text>
      </Pressable>
      <Text style={styles.disclaimer}>You can edit or cancel this listing from My Jobs.</Text>
    </>}

    <CalendarPickerModal
      visible={showCalendar}
      selectedDate={dateISO}
      onSelect={(iso, label) => { setDateISO(iso); setDateLabel(label); }}
      onDismiss={() => setShowCalendar(false)}
    />
    <LocationPickerModal
      visible={showLocationPicker}
      currentLocation={location}
      onSelect={(loc) => setLocation(loc)}
      onDismiss={() => setShowLocationPicker(false)}
    />
  </ScrollView></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  title: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.text },
  intro: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20, color: COLORS.textMuted, marginBottom: SPACING.md },
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md },
  label: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text, marginBottom: SPACING.xs + 2, marginTop: SPACING.sm },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.sm + 2, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text, backgroundColor: COLORS.background },
  textArea: { minHeight: 94, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.sm + 2, fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20, color: COLORS.text, backgroundColor: COLORS.background },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  chip: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.sm, backgroundColor: COLORS.background },
  chipActive: { backgroundColor: '#DDF4EC', borderColor: COLORS.secondary },
  chipText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted },
  chipTextActive: { color: COLORS.primary },
  modeOption: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, padding: SPACING.sm + 2, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  modeOptionActive: { borderColor: COLORS.primary, backgroundColor: '#EAF7F2' },
  modeIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DDF4EC', alignItems: 'center', justifyContent: 'center' },
  modeCopy: { flex: 1 },
  modeTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  modeTitleActive: { color: COLORS.primary },
  modeDesc: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 17, color: COLORS.textMuted, marginTop: 2 },
  photoCountLabel: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted },
  photoGrid: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  photoThumb: { width: 80, height: 80, borderRadius: RADIUS.md, overflow: 'hidden', position: 'relative' },
  photoImage: { width: 80, height: 80 },
  photoRemove: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
  photoActions: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  photoAddBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  photoAddText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.primary },
  photoLoadingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.sm },
  photoLoadingText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted },
  photoError: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.error, marginTop: SPACING.xs },
  helper: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 17, color: COLORS.textMuted, marginTop: SPACING.xs },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.sm + 2, backgroundColor: COLORS.background },
  locationBtnText: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text },
  locationBtnPlaceholder: { color: COLORS.textMuted },
  errorText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.error, textAlign: 'center', marginBottom: SPACING.sm },
  primaryButton: { alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: SPACING.md, marginTop: SPACING.xs },
  primaryText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.card },
  disabled: { opacity: 0.45 },
  disclaimer: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  successCard: { alignItems: 'center', backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.xl, marginTop: SPACING.xl },
  successIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.success, alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text, marginTop: SPACING.md },
  successText: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 20, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm },
  secondaryAction: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.primary, marginTop: SPACING.md },
});
