import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Briefcase, ChevronRight, ChevronDown, CircleHelp, Lightbulb, User, WalletCards, X, Plus, Users, ClipboardList, Check, LogOut } from 'lucide-react-native';
import { useDrawer } from '@/context/DrawerContext';
import { useApp } from '@/context/AppContext';
import { WorkerStatus } from '@/types';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

const workerMenuItems = [
  { label: 'Jobs', subtitle: 'Find nearby opportunities', icon: Briefcase, route: '/(tabs)/jobs' },
  { label: 'Yenza-AI', subtitle: 'Get practical work help', icon: Lightbulb, route: '/(tabs)/ai' },
  { label: 'Earnings', subtitle: 'Track your income', icon: WalletCards, route: '/(tabs)/wallet' },
  { label: 'Profile', subtitle: 'Manage your worker profile', icon: User, route: '/(tabs)/profile' },
] as const;

const employerMenuItems = [
  { label: 'Home', subtitle: 'Your hiring overview', icon: Briefcase, route: '/(tabs)/home' },
  { label: 'Post a Job', subtitle: 'Create a new listing', icon: Plus, route: '/(tabs)/post-job' },
  { label: 'Find Workers', subtitle: 'Browse trusted candidates', icon: Users, route: '/(tabs)/workers' },
  { label: 'My Jobs', subtitle: 'Manage jobs and bookings', icon: ClipboardList, route: '/(tabs)/my-jobs' },
  { label: 'Profile', subtitle: 'Manage your employer profile', icon: User, route: '/(tabs)/profile' },
] as const;

const STATUS_OPTIONS: { value: WorkerStatus; label: string; description: string; color: string; dotColor: string }[] = [
  { value: 'available', label: 'Available', description: 'Receiving new job opportunities', color: COLORS.success, dotColor: COLORS.success },
  { value: 'busy', label: 'Busy', description: 'On a job, no new requests', color: COLORS.warning, dotColor: COLORS.warning },
  { value: 'unavailable', label: 'Unavailable', description: 'Not accepting work right now', color: COLORS.textMuted, dotColor: COLORS.textMuted },
];

export function AppDrawer() {
  const { isOpen, closeDrawer } = useDrawer();
  const { role, worker, employer, workerStatus, setWorkerStatus, logout } = useApp();
  const menuItems = role === 'employer' ? employerMenuItems : workerMenuItems;
  const router = useRouter();
  const pathname = usePathname();
  const [statusExpanded, setStatusExpanded] = useState(false);

  if (!isOpen) return null;

  const navigate = (route: string) => {
    closeDrawer();
    router.push(route as never);
  };

  const currentStatus = STATUS_OPTIONS.find((s) => s.value === workerStatus) ?? STATUS_OPTIONS[0];
  const isWorker = role === 'worker';

  const handleLogout = () => {
    closeDrawer();
    logout();
  };

  return (
    <View style={styles.layer}>
      <Pressable style={styles.backdrop} onPress={closeDrawer} />
      <View style={styles.drawer}>
        <View style={styles.drawerHeader}>
          <View>
            <Text style={styles.brand}>Yenza</Text>
            <Text style={styles.workerLabel}>{isWorker ? 'Worker App' : 'Employer App'}</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={closeDrawer} hitSlop={8}>
            <X size={21} color={COLORS.text} strokeWidth={2.2} />
          </Pressable>
        </View>

        <View style={styles.profileStrip}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{(isWorker ? worker.name : employer.name).split(' ').map((part) => part[0]).join('').slice(0, 2)}</Text></View>
          <View style={styles.profileContent}>
            <Text style={styles.name}>{isWorker ? worker.name : employer.name}</Text>
            <Text style={styles.location}>{isWorker ? worker.location : employer.location}</Text>
          </View>
          <ChevronRight size={18} color={COLORS.textMuted} strokeWidth={2} />
        </View>

        {isWorker && (
          <View style={styles.statusSection}>
            <Pressable style={styles.statusHeader} onPress={() => setStatusExpanded((prev) => !prev)}>
              <View style={styles.statusHeaderLeft}>
                <View style={[styles.statusDot, { backgroundColor: currentStatus.dotColor }]} />
                <Text style={styles.statusHeaderText}>{currentStatus.label}</Text>
              </View>
              <ChevronDown size={18} color={COLORS.textMuted} strokeWidth={2.2} style={statusExpanded && { transform: [{ rotate: '180deg' }] } as never} />
            </Pressable>

            {statusExpanded && (
              <View style={styles.statusOptions}>
                {STATUS_OPTIONS.map((option) => {
                  const selected = option.value === workerStatus;
                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.statusOption, selected && styles.statusOptionSelected]}
                      onPress={() => { setWorkerStatus(option.value); setStatusExpanded(false); }}
                    >
                      <View style={[styles.statusDot, { backgroundColor: option.dotColor }]} />
                      <View style={styles.statusOptionCopy}>
                        <Text style={styles.statusOptionLabel}>{option.label}</Text>
                        <Text style={styles.statusOptionDescription}>{option.description}</Text>
                      </View>
                      {selected && <Check size={17} color={COLORS.primary} strokeWidth={2.4} />}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}

        <Text style={styles.sectionLabel}>MAIN MENU</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.menuList}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.includes(item.route.split('/').pop() ?? '');
            return (
              <Pressable key={item.label} style={[styles.menuItem, active && styles.menuItemActive]} onPress={() => navigate(item.route)}>
                <View style={[styles.iconBubble, active && styles.iconBubbleActive]}>
                  <Icon size={20} color={active ? COLORS.card : COLORS.primary} strokeWidth={2.1} />
                </View>
                <View style={styles.menuText}>
                  <Text style={[styles.menuTitle, active && styles.menuTitleActive]}>{item.label}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <ChevronRight size={17} color={active ? COLORS.primary : COLORS.textMuted} strokeWidth={2} />
              </Pressable>
            );
          })}

          <View style={styles.divider} />
          <View style={styles.helpRow}>
            <CircleHelp size={19} color={COLORS.secondary} strokeWidth={2} />
            <View style={styles.menuText}>
              <Text style={styles.menuTitle}>Need help?</Text>
              <Text style={styles.menuSubtitle}>Yenza support is coming soon</Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.drawerFooter}>
          <Pressable style={styles.logoutRow} onPress={handleLogout}>
            <View style={styles.logoutIcon}>
              <LogOut size={18} color={COLORS.error} strokeWidth={2.2} />
            </View>
            <View style={styles.menuText}>
              <Text style={styles.logoutText}>Log out</Text>
              <Text style={styles.menuSubtitle}>Sign out of your account</Text>
            </View>
            <ChevronRight size={17} color={COLORS.textMuted} strokeWidth={2} />
          </Pressable>
          <Text style={styles.footer}>Yenza · Prototype</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject, zIndex: 20, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 35, 27, 0.42)' },
  drawer: { width: '84%', maxWidth: 360, height: '100%', backgroundColor: COLORS.card, padding: SPACING.md, paddingTop: SPACING.xl, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 10 },
  drawerHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: SPACING.lg },
  brand: { fontFamily: FONTS.bold, fontSize: 29, color: COLORS.primary, letterSpacing: -1 },
  workerLabel: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  closeButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  profileStrip: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: '#EAF7F2', borderRadius: RADIUS.lg, padding: SPACING.sm + 2, marginBottom: SPACING.sm },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.card },
  profileContent: { flex: 1 },
  name: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  location: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusSection: { marginBottom: SPACING.md },
  statusHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm + 2 },
  statusHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusHeaderText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  statusOptions: { marginTop: SPACING.xs, backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm + 1, paddingHorizontal: SPACING.md },
  statusOptionSelected: { backgroundColor: '#EAF7F2' },
  statusOptionCopy: { flex: 1 },
  statusOptionLabel: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text },
  statusOptionDescription: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  sectionLabel: { fontFamily: FONTS.bold, fontSize: 11, letterSpacing: 1, color: COLORS.textMuted, marginBottom: SPACING.sm },
  menuList: { paddingBottom: SPACING.lg },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.md, marginBottom: SPACING.xs },
  menuItemActive: { backgroundColor: '#EAF7F2' },
  iconBubble: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DDF4EC', alignItems: 'center', justifyContent: 'center' },
  iconBubbleActive: { backgroundColor: COLORS.primary },
  menuText: { flex: 1 },
  menuTitle: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text },
  menuTitleActive: { color: COLORS.primary },
  menuSubtitle: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  helpRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm },
  drawerFooter: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  logoutRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.sm, borderRadius: RADIUS.md, marginBottom: SPACING.sm },
  logoutIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FBEAEA', alignItems: 'center', justifyContent: 'center' },
  logoutText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.error },
  footer: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, textAlign: 'center' },
});
