import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, Wrench, UserRound, Building2 } from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { AppRole } from '@/types';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useApp();
  const [role, setRole] = useState<AppRole>('worker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.success) {
      router.replace(role === 'worker' ? '/(tabs)/jobs' : '/(tabs)/home');
    } else {
      setError(result.error ?? 'Incorrect email or password. Try the demo account below.');
    }
  };

  const fillDemo = () => {
    setEmail(role === 'worker' ? 'thabomthembu412@gmail.com' : 'solutions@codegenai.tech');
    setPassword('yenza123');
    setError('');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoSection}>
          <View style={styles.logoCircle}>
            <Wrench size={32} color={COLORS.card} strokeWidth={2.2} />
          </View>
          <Text style={styles.logoText}>Yenza</Text>
          <Text style={styles.tagline}>Get work. Get it done.</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.heading}>Welcome back</Text>
          <Text style={styles.subText}>{role === 'worker' ? 'Find your next job opportunity.' : 'Find reliable workers and manage your work.'}</Text>

          <View style={styles.roleSwitcher}>
            <Pressable style={[styles.roleOption, role === 'worker' && styles.roleOptionActive]} onPress={() => { setRole('worker'); setError(''); }}>
              <UserRound size={18} color={role === 'worker' ? COLORS.card : COLORS.primary} strokeWidth={2} />
              <View><Text style={[styles.roleTitle, role === 'worker' && styles.roleTitleActive]}>Worker</Text><Text style={[styles.roleCaption, role === 'worker' && styles.roleCaptionActive]}>Find jobs</Text></View>
            </Pressable>
            <Pressable style={[styles.roleOption, role === 'employer' && styles.roleOptionActive]} onPress={() => { setRole('employer'); setError(''); }}>
              <Building2 size={18} color={role === 'employer' ? COLORS.card : COLORS.primary} strokeWidth={2} />
              <View><Text style={[styles.roleTitle, role === 'employer' && styles.roleTitleActive]}>Employer</Text><Text style={[styles.roleCaption, role === 'employer' && styles.roleCaptionActive]}>Hire workers</Text></View>
            </Pressable>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email address</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color={COLORS.textMuted} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="e.g. thabomthembu412@gmail.com"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color={COLORS.textMuted} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={12}>
                {showPassword ? (
                  <EyeOff size={20} color={COLORS.textMuted} strokeWidth={2} />
                ) : (
                  <Eye size={20} color={COLORS.textMuted} strokeWidth={2} />
                )}
              </Pressable>
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.card} />
            ) : (
              <Text style={styles.loginBtnText}>Log In</Text>
            )}
          </Pressable>

          <Pressable style={styles.forgotBtn} onPress={() => setError('Password reset is not available in this prototype.')}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>

          <View style={styles.divider} />

          <Pressable style={styles.createBtn} onPress={() => router.push(role === 'worker' ? '/register' : '/register-employer')}>
            <Text style={styles.createText}>
              Don't have an account?{' '}
              <Text style={styles.createLink}>Create one</Text>
            </Text>
          </Pressable>

          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Demo accounts</Text>
            <Text style={styles.demoText}>Worker: thabomthembu412@gmail.com</Text>
            <Text style={styles.demoText}>Employer: solutions@codegenai.tech</Text>
            <Text style={styles.demoText}>Password: yenza123</Text>
            <Pressable style={styles.demoFillBtn} onPress={fillDemo}>
              <Text style={styles.demoFillText}>Fill demo credentials</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
  logoSection: { alignItems: 'center', marginBottom: SPACING.xl },
  logoCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm + 2, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 4 },
  logoText: { fontFamily: FONTS.bold, fontSize: 30, color: COLORS.primary },
  tagline: { fontFamily: FONTS.medium, fontSize: 15, color: COLORS.textMuted, marginTop: 2 },
  formSection: { width: '100%', maxWidth: 400, alignSelf: 'center' },
  heading: { fontFamily: FONTS.bold, fontSize: 26, color: COLORS.text, marginBottom: 4 },
  subText: { fontFamily: FONTS.regular, fontSize: 15, color: COLORS.textMuted, marginBottom: SPACING.lg },
  roleSwitcher: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  roleOption: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm + 2, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  roleOptionActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleTitle: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text },
  roleTitleActive: { color: COLORS.card },
  roleCaption: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  roleCaptionActive: { color: 'rgba(255,255,255,0.78)' },
  field: { marginBottom: SPACING.md },
  label: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text, marginBottom: SPACING.xs + 1 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2 },
  input: { flex: 1, fontFamily: FONTS.regular, fontSize: 16, color: COLORS.text, padding: 0 },
  errorText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.error, marginBottom: SPACING.sm, lineHeight: 19 },
  loginBtn: { backgroundColor: COLORS.primary, paddingVertical: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', marginTop: SPACING.xs, minHeight: 52, justifyContent: 'center' },
  loginBtnText: { fontFamily: FONTS.semiBold, fontSize: 17, color: COLORS.card },
  forgotBtn: { alignItems: 'center', marginTop: SPACING.md },
  forgotText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.secondary },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.lg },
  createBtn: { alignItems: 'center' },
  createText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  createLink: { fontFamily: FONTS.semiBold, color: COLORS.primary },
  demoBox: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, padding: SPACING.md, marginTop: SPACING.lg },
  demoTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text, marginBottom: SPACING.xs + 1 },
  demoText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, lineHeight: 19 },
  demoFillBtn: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.primary, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, alignItems: 'center', marginTop: SPACING.sm + 2 },
  demoFillText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.primary },
});
