import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Keyboard,
} from 'react-native';
import {
  Eye, EyeOff, Mail, Lock, Phone, UserRound, MapPin, ChevronRight,
  ChevronLeft, Check, Wrench, Target, Sparkles, Clock, Navigation2,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { JobCategory, ExperienceLevel } from '@/types';
import { ServiceIcon } from '@/components/ServiceIcon';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';
import {
  ALL_GENERAL_SERVICES, ALL_SKILLED_SERVICES, ALL_SERVICE_AREAS,
  EXPERIENCE_LEVELS, DAYS_OF_WEEK,
} from '@/data/mockData';

const TOTAL_STEPS = 4;
const ALL_SERVICES = [...ALL_GENERAL_SERVICES, ...ALL_SKILLED_SERVICES];

interface RegForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  location: string;
  serviceAreas: string[];
  availabilityDays: string[];
  services: JobCategory[];
  skillsToLearn: JobCategory[];
  experience: ExperienceLevel;
  goals: string;
  bio: string;
}

const initialForm: RegForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  location: '',
  serviceAreas: [],
  availabilityDays: [],
  services: [],
  skillsToLearn: [],
  experience: EXPERIENCE_LEVELS[0],
  goals: '',
  bio: '',
};

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<RegForm>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const update = (field: keyof RegForm, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const toggleInArray = <T,>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!form.fullName.trim()) { setError('Please enter your full name.'); return false; }
      if (!form.email.trim() || !form.email.includes('@')) { setError('Please enter a valid email address.'); return false; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return false; }
      if (!form.phone.trim()) { setError('Please enter your phone number.'); return false; }
    }
    if (step === 1) {
      if (!form.location.trim()) { setError('Please enter your area or suburb.'); return false; }
      if (form.serviceAreas.length === 0) { setError('Select at least one area where you can work.'); return false; }
      if (form.availabilityDays.length === 0) { setError('Select at least one day you are available.'); return false; }
    }
    if (step === 2) {
      if (form.services.length === 0) { setError('Select at least one service you can already do.'); return false; }
    }
    return true;
  };

  const next = () => {
    Keyboard.dismiss();
    if (!validateStep()) return;
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const back = () => {
    setError('');
    if (step > 0) {
      setStep(step - 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    if (!form.bio.trim()) { setError('Tell us a bit about yourself so employers can get to know you.'); return; }
    setLoading(true);
    setError('');
    const result = await register(form);
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)/jobs');
    } else {
      setError(result.error ?? 'Could not create your account. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo + header */}
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Wrench size={30} color={COLORS.card} strokeWidth={2.2} />
          </View>
          <Text style={styles.logoText}>Yenza</Text>
          <Text style={styles.tagline}>Create your worker profile</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressContainer}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i <= step && styles.progressDotActive,
                i === step && styles.progressDotCurrent,
              ]}
            >
              {i < step && <Check size={12} color={COLORS.card} strokeWidth={3} />}
              {i === step && <Text style={styles.progressDotText}>{i + 1}</Text>}
            </View>
          ))}
        </View>
        <Text style={styles.stepLabel}>Step {step + 1} of {TOTAL_STEPS}</Text>

        {/* Step content */}
        <View style={styles.formSection}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* STEP 0: Account */}
          {step === 0 && (
            <View>
              <Text style={styles.stepHeading}>Create your account</Text>
              <Text style={styles.stepSubtext}>Start by setting up your login details.</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Full name</Text>
                <View style={styles.inputWrapper}>
                  <UserRound size={20} color={COLORS.textMuted} strokeWidth={2} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Sanele Buthelezi"
                    placeholderTextColor={COLORS.textMuted}
                    value={form.fullName}
                    onChangeText={(v) => update('fullName', v)}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Email address</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color={COLORS.textMuted} strokeWidth={2} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.co.za"
                    placeholderTextColor={COLORS.textMuted}
                    value={form.email}
                    onChangeText={(v) => update('email', v)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Phone number</Text>
                <View style={styles.inputWrapper}>
                  <Phone size={20} color={COLORS.textMuted} strokeWidth={2} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 082 555 0147"
                    placeholderTextColor={COLORS.textMuted}
                    value={form.phone}
                    onChangeText={(v) => update('phone', v)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color={COLORS.textMuted} strokeWidth={2} />
                  <TextInput
                    style={styles.input}
                    placeholder="At least 6 characters"
                    placeholderTextColor={COLORS.textMuted}
                    value={form.password}
                    onChangeText={(v) => update('password', v)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                    {showPassword ? <EyeOff size={20} color={COLORS.textMuted} /> : <Eye size={20} color={COLORS.textMuted} />}
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {/* STEP 1: Location & Availability */}
          {step === 1 && (
            <View>
              <Text style={styles.stepHeading}>Where and when you can work</Text>
              <Text style={styles.stepSubtext}>Employers need to know where to find you.</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Your area or suburb</Text>
                <View style={styles.inputWrapper}>
                  <MapPin size={20} color={COLORS.textMuted} strokeWidth={2} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Newcastle, KwaZulu-Natal"
                    placeholderTextColor={COLORS.textMuted}
                    value={form.location}
                    onChangeText={(v) => update('location', v)}
                  />
                </View>
              </View>

              <Text style={styles.label}>Areas where you can accept work</Text>
              <Text style={styles.hint}>Tap all that apply</Text>
              <View style={styles.chipWrap}>
                {ALL_SERVICE_AREAS.map((area) => {
                  const selected = form.serviceAreas.includes(area);
                  return (
                    <Pressable
                      key={area}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => update('serviceAreas', toggleInArray(form.serviceAreas, area))}
                    >
                      <Navigation2 size={14} color={selected ? COLORS.primary : COLORS.textMuted} strokeWidth={2.2} />
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{area}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.label, { marginTop: SPACING.md }]}>Days you are available</Text>
              <Text style={styles.hint}>Tap all that apply</Text>
              <View style={styles.dayGrid}>
                {DAYS_OF_WEEK.map((day) => {
                  const selected = form.availabilityDays.includes(day);
                  return (
                    <Pressable
                      key={day}
                      style={[styles.dayChip, selected && styles.dayChipSelected]}
                      onPress={() => update('availabilityDays', toggleInArray(form.availabilityDays, day))}
                    >
                      <Clock size={13} color={selected ? COLORS.card : COLORS.textMuted} strokeWidth={2.2} />
                      <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>{day.slice(0, 3)}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 2: Skills & Interests */}
          {step === 2 && (
            <View>
              <Text style={styles.stepHeading}>What can you do?</Text>
              <Text style={styles.stepSubtext}>Select the services you can already provide. You can add more later.</Text>

              <Text style={styles.groupLabel}>General work</Text>
              <View style={styles.serviceGrid}>
                {ALL_GENERAL_SERVICES.map((svc) => {
                  const selected = form.services.includes(svc);
                  return (
                    <Pressable
                      key={svc}
                      style={[styles.serviceCard, selected && styles.serviceCardSelected]}
                      onPress={() => update('services', toggleInArray(form.services, svc))}
                    >
                      <View style={[styles.serviceIconBg, selected && styles.serviceIconBgSelected]}>
                        <ServiceIcon category={svc} size={22} color={selected ? COLORS.card : COLORS.secondary} />
                      </View>
                      <Text style={[styles.serviceName, selected && styles.serviceNameSelected]}>{svc}</Text>
                      {selected && (
                        <View style={styles.checkBadge}>
                          <Check size={11} color={COLORS.card} strokeWidth={3} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.groupLabel, { marginTop: SPACING.lg }]}>Skilled services</Text>
              <View style={styles.serviceGrid}>
                {ALL_SKILLED_SERVICES.map((svc) => {
                  const selected = form.services.includes(svc);
                  return (
                    <Pressable
                      key={svc}
                      style={[styles.serviceCard, selected && styles.serviceCardSelected]}
                      onPress={() => update('services', toggleInArray(form.services, svc))}
                    >
                      <View style={[styles.serviceIconBg, selected && styles.serviceIconBgSelected]}>
                        <ServiceIcon category={svc} size={22} color={selected ? COLORS.card : COLORS.secondary} />
                      </View>
                      <Text style={[styles.serviceName, selected && styles.serviceNameSelected]}>{svc}</Text>
                      {selected && (
                        <View style={styles.checkBadge}>
                          <Check size={11} color={COLORS.card} strokeWidth={3} />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.label, { marginTop: SPACING.lg }]}>Skills you want to learn</Text>
              <Text style={styles.hint}>Optional — helps Yenza recommend training and opportunities</Text>
              <View style={styles.chipWrap}>
                {ALL_SERVICES.map((svc) => {
                  const selected = form.skillsToLearn.includes(svc);
                  const alreadyHas = form.services.includes(svc);
                  return (
                    <Pressable
                      key={svc}
                      style={[styles.chip, selected && styles.chipSelected, alreadyHas && styles.chipDimmed]}
                      onPress={() => !alreadyHas && update('skillsToLearn', toggleInArray(form.skillsToLearn, svc))}
                      disabled={alreadyHas}
                    >
                      <Sparkles size={13} color={selected ? COLORS.primary : COLORS.textMuted} strokeWidth={2.2} />
                      <Text style={[styles.chipText, selected && styles.chipTextSelected, alreadyHas && styles.chipTextDimmed]}>{svc}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 3: Experience & Goals */}
          {step === 3 && (
            <View>
              <Text style={styles.stepHeading}>Your experience and goals</Text>
              <Text style={styles.stepSubtext}>Tell employers what you bring and what you're aiming for.</Text>

              <Text style={styles.label}>Experience level</Text>
              <View style={styles.experienceList}>
                {EXPERIENCE_LEVELS.map((level) => {
                  const selected = form.experience === level;
                  return (
                    <Pressable
                      key={level}
                      style={[styles.expOption, selected && styles.expOptionSelected]}
                      onPress={() => update('experience', level)}
                    >
                      <View style={[styles.expRadio, selected && styles.expRadioSelected]}>
                        {selected && <Check size={14} color={COLORS.card} strokeWidth={3} />}
                      </View>
                      <Text style={[styles.expText, selected && styles.expTextSelected]}>{level}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>What are you working towards?</Text>
                <Text style={styles.hint}>e.g. "I want to build a career in plumbing" or "I need income while studying"</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <Target size={20} color={COLORS.textMuted} strokeWidth={2} style={styles.textAreaIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe your goals…"
                    placeholderTextColor={COLORS.textMuted}
                    value={form.goals}
                    onChangeText={(v) => update('goals', v)}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>About you</Text>
                <Text style={styles.hint}>A short introduction so employers can get to know you</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <UserRound size={20} color={COLORS.textMuted} strokeWidth={2} style={styles.textAreaIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="e.g. I am a hardworking person from Newcastle. I have been doing plumbing repairs for 3 years…"
                    placeholderTextColor={COLORS.textMuted}
                    value={form.bio}
                    onChangeText={(v) => update('bio', v)}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>
              </View>
            </View>
          )}

          {/* Navigation buttons */}
          <View style={styles.navRow}>
            {step > 0 ? (
              <Pressable style={styles.backBtn} onPress={back}>
                <ChevronLeft size={18} color={COLORS.text} strokeWidth={2.2} />
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.backBtn} onPress={() => router.replace('/login')}>
                <ChevronLeft size={18} color={COLORS.text} strokeWidth={2.2} />
                <Text style={styles.backBtnText}>Login</Text>
              </Pressable>
            )}

            {step < TOTAL_STEPS - 1 ? (
              <Pressable style={styles.nextBtn} onPress={next}>
                <Text style={styles.nextBtnText}>Continue</Text>
                <ChevronRight size={18} color={COLORS.card} strokeWidth={2.2} />
              </Pressable>
            ) : (
              <Pressable style={[styles.nextBtn, loading && styles.nextBtnDisabled]} onPress={handleSubmit} disabled={loading}>
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.card} />
                ) : (
                  <>
                    <Text style={styles.nextBtnText}>Create profile</Text>
                    <Check size={18} color={COLORS.card} strokeWidth={2.2} />
                  </>
                )}
              </Pressable>
            )}
          </View>

          {step === TOTAL_STEPS - 1 && (
            <Pressable style={styles.termsNote} onPress={() => {}}>
              <Text style={styles.termsText}>
                By creating an account, you agree to Yenza's terms. Your profile will be visible to employers looking for workers.
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: SPACING.xl },
  logoSection: { alignItems: 'center', marginBottom: SPACING.lg },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 3 },
  logoText: { fontFamily: FONTS.bold, fontSize: 26, color: COLORS.primary },
  tagline: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  // Progress
  progressContainer: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm + 2, marginBottom: SPACING.xs + 2 },
  progressDot: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card, borderWidth: 1.5, borderColor: COLORS.border },
  progressDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  progressDotCurrent: { borderColor: COLORS.primaryLight, borderWidth: 2.5 },
  progressDotText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.card },
  stepLabel: { textAlign: 'center', fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, marginBottom: SPACING.lg },
  // Form
  formSection: { width: '100%', maxWidth: 440, alignSelf: 'center' },
  stepHeading: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.text, marginBottom: 4 },
  stepSubtext: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted, marginBottom: SPACING.lg, lineHeight: 19 },
  errorText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.error, marginBottom: SPACING.md, lineHeight: 19, backgroundColor: COLORS.error + '12', borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.sm },
  field: { marginBottom: SPACING.md },
  label: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text, marginBottom: SPACING.xs + 1 },
  hint: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.sm, marginTop: -2 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2 },
  input: { flex: 1, fontFamily: FONTS.regular, fontSize: 16, color: COLORS.text, padding: 0 },
  // Chips
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs + 2 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.sm, borderRadius: RADIUS.xl, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  chipSelected: { backgroundColor: COLORS.primary + '12', borderColor: COLORS.primary },
  chipText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.text },
  chipTextSelected: { color: COLORS.primary, fontFamily: FONTS.semiBold },
  chipDimmed: { opacity: 0.4 },
  chipTextDimmed: { color: COLORS.textMuted },
  // Day grid
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs + 2 },
  dayChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.sm - 1, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, minWidth: 70, justifyContent: 'center' },
  dayChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dayChipText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.text },
  dayChipTextSelected: { color: COLORS.card },
  // Services
  groupLabel: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text, marginBottom: SPACING.sm },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  serviceCard: { width: '31%', minWidth: 100, maxWidth: 120, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.sm + 2, alignItems: 'center', gap: 6, position: 'relative' },
  serviceCardSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  serviceIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EAF7F2', alignItems: 'center', justifyContent: 'center' },
  serviceIconBgSelected: { backgroundColor: COLORS.primary },
  serviceName: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.text, textAlign: 'center', lineHeight: 14 },
  serviceNameSelected: { color: COLORS.primary, fontFamily: FONTS.semiBold },
  checkBadge: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  // Experience
  experienceList: { gap: SPACING.xs + 2, marginBottom: SPACING.md },
  expOption: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2 },
  expOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  expRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  expRadioSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  expText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
  expTextSelected: { color: COLORS.primary, fontFamily: FONTS.semiBold },
  // Text area
  textAreaWrapper: { alignItems: 'flex-start', paddingTop: SPACING.sm + 2 },
  textAreaIcon: { marginTop: 4 },
  textArea: { minHeight: 70, textAlignVertical: 'top' },
  // Nav
  navRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.lg, marginBottom: SPACING.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: SPACING.md, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  backBtnText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text },
  nextBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.md, minHeight: 52 },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.card },
  termsNote: { marginTop: SPACING.sm, paddingHorizontal: SPACING.xs },
  termsText: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, textAlign: 'center', lineHeight: 17 },
});
