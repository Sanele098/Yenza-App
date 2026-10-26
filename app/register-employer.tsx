import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Keyboard,
} from 'react-native';
import {
  Eye, EyeOff, Mail, Lock, Phone, UserRound, MapPin, ChevronRight,
  ChevronLeft, Check, Building2, Home, Store, Landmark, Briefcase,
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/context/AppContext';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

const TOTAL_STEPS = 3;

type AccountType = 'Household' | 'Landlord' | 'Small business' | 'Organisation';

const ACCOUNT_TYPES: { label: AccountType; icon: typeof Home; desc: string }[] = [
  { label: 'Household', icon: Home, desc: 'Hiring for your home' },
  { label: 'Landlord', icon: Building2, desc: 'Managing rental properties' },
  { label: 'Small business', icon: Store, desc: 'A local business or shop' },
  { label: 'Organisation', icon: Landmark, desc: 'NGO, church, or institution' },
];

interface EmployerRegForm {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  accountType: AccountType;
  location: string;
  bio: string;
}

const initialForm: EmployerRegForm = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  accountType: 'Household',
  location: '',
  bio: '',
};

export default function RegisterEmployerScreen() {
  const router = useRouter();
  const { registerEmployer } = useApp();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<EmployerRegForm>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const update = (field: keyof EmployerRegForm, value: string | AccountType) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!form.fullName.trim()) { setError('Please enter your name or business name.'); return false; }
      if (!form.email.trim() || !form.email.includes('@')) { setError('Please enter a valid email address.'); return false; }
      if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return false; }
      if (!form.phone.trim()) { setError('Please enter your phone number.'); return false; }
    }
    if (step === 1) {
      if (!form.location.trim()) { setError('Please enter your area or suburb.'); return false; }
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
    if (!form.bio.trim()) { setError('Tell us a bit about yourself so workers know who they are working for.'); return; }
    setLoading(true);
    setError('');
    const result = await registerEmployer(form);
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)/home');
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
            <Building2 size={30} color={COLORS.card} strokeWidth={2.2} />
          </View>
          <Text style={styles.logoText}>Yenza</Text>
          <Text style={styles.tagline}>Create your employer account</Text>
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
              <Text style={styles.stepSubtext}>Set up your login details to start posting jobs.</Text>

              <View style={styles.field}>
                <Text style={styles.label}>Name or business name</Text>
                <View style={styles.inputWrapper}>
                  <UserRound size={20} color={COLORS.textMuted} strokeWidth={2} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Thandi Mthembu or Mthembu Properties"
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

          {/* STEP 1: Account type & Location */}
          {step === 1 && (
            <View>
              <Text style={styles.stepHeading}>Tell us about yourself</Text>
              <Text style={styles.stepSubtext}>What best describes you and where are you based?</Text>

              <Text style={styles.label}>What type of account is this?</Text>
              <View style={styles.typeList}>
                {ACCOUNT_TYPES.map(({ label, icon: Icon, desc }) => {
                  const selected = form.accountType === label;
                  return (
                    <Pressable
                      key={label}
                      style={[styles.typeOption, selected && styles.typeOptionSelected]}
                      onPress={() => update('accountType', label)}
                    >
                      <View style={[styles.typeIconBg, selected && styles.typeIconBgSelected]}>
                        <Icon size={20} color={selected ? COLORS.card : COLORS.secondary} strokeWidth={2.2} />
                      </View>
                      <View style={styles.typeContent}>
                        <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>{label}</Text>
                        <Text style={styles.typeDesc}>{desc}</Text>
                      </View>
                      <View style={[styles.typeRadio, selected && styles.typeRadioSelected]}>
                        {selected && <Check size={14} color={COLORS.card} strokeWidth={3} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <View style={[styles.field, { marginTop: SPACING.lg }]}>
                <Text style={styles.label}>Your area or suburb</Text>
                <View style={styles.inputWrapper}>
                  <MapPin size={20} color={COLORS.textMuted} strokeWidth={2} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Sandton, Gauteng"
                    placeholderTextColor={COLORS.textMuted}
                    value={form.location}
                    onChangeText={(v) => update('location', v)}
                  />
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: About */}
          {step === 2 && (
            <View>
              <Text style={styles.stepHeading}>About you</Text>
              <Text style={styles.stepSubtext}>A short introduction so workers know who they are working for.</Text>

              <View style={styles.field}>
                <Text style={styles.label}>About you or your business</Text>
                <Text style={styles.hint}>e.g. "I am a homeowner in Sandton looking for reliable help with cleaning and garden maintenance" or "We are a small guesthouse needing regular cleaning staff"</Text>
                <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
                  <Briefcase size={20} color={COLORS.textMuted} strokeWidth={2} style={styles.textAreaIcon} />
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Describe yourself or your business…"
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
                    <Text style={styles.nextBtnText}>Create account</Text>
                    <Check size={18} color={COLORS.card} strokeWidth={2.2} />
                  </>
                )}
              </Pressable>
            )}
          </View>

          {step === TOTAL_STEPS - 1 && (
            <Pressable style={styles.termsNote} onPress={() => {}}>
              <Text style={styles.termsText}>
                By creating an account, you agree to Yenza's terms. You will be able to post jobs and hire workers.
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
  hint: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.sm, marginTop: -2, lineHeight: 17 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2 },
  input: { flex: 1, fontFamily: FONTS.regular, fontSize: 16, color: COLORS.text, padding: 0 },
  // Account type
  typeList: { gap: SPACING.sm },
  typeOption: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2 },
  typeOptionSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + '08' },
  typeIconBg: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EAF7F2', alignItems: 'center', justifyContent: 'center' },
  typeIconBgSelected: { backgroundColor: COLORS.primary },
  typeContent: { flex: 1 },
  typeLabel: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.text },
  typeLabelSelected: { color: COLORS.primary, fontFamily: FONTS.semiBold },
  typeDesc: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  typeRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  typeRadioSelected: { borderColor: COLORS.primary, backgroundColor: COLORS.primary },
  // Text area
  textAreaWrapper: { alignItems: 'flex-start', paddingTop: SPACING.sm + 2 },
  textAreaIcon: { marginTop: 4 },
  textArea: { minHeight: 90, textAlignVertical: 'top' },
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
