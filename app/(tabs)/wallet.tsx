import { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput, ActivityIndicator } from 'react-native';
import {
  CheckCircle2, Clock3, WalletCards, ArrowUpRight, Menu, X,
  Banknote, Building2, Smartphone, TrendingUp, CreditCard, HandCoins,
} from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { useDrawer } from '@/context/DrawerContext';
import { EarningsActivity, WithdrawalMethod } from '@/types';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

const formatRand = (amount: number) => `R${amount.toLocaleString('en-ZA', { minimumFractionDigits: 0 })}`;

const WITHDRAWAL_METHODS: { value: WithdrawalMethod; label: string; icon: typeof Banknote; desc: string }[] = [
  { value: 'bank_transfer', label: 'Bank transfer', icon: Building2, desc: 'Transfer to your bank account (1–2 business days)' },
  { value: 'e_wallet', label: 'E-wallet', icon: Smartphone, desc: 'Send to your e-wallet (instant)' },
  { value: 'cash', label: 'Cash pickup', icon: Banknote, desc: 'Collect cash from a Yenza partner location' },
];

export default function WalletScreen() {
  const { openDrawer } = useDrawer();
  const { earnings, earningsSummary, requestWithdrawal, withdrawals, loadEarnings } = useApp();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<WithdrawalMethod>('bank_transfer');
  const [loading, setLoading] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  const handleWithdraw = useCallback(async () => {
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      setResultMsg({ success: false, text: 'Enter a valid amount' });
      return;
    }
    setLoading(true);
    const result = await requestWithdrawal(amount, withdrawMethod);
    setLoading(false);
    setResultMsg({
      success: result.success,
      text: result.success
        ? `Withdrawal of ${formatRand(amount)} requested. We'll process it shortly.`
        : (result.error ?? 'Could not request withdrawal'),
    });
    if (result.success) {
      setWithdrawAmount('');
      setShowWithdraw(false);
    }
  }, [withdrawAmount, withdrawMethod, requestWithdrawal]);

  const recentEarnings = earnings.slice(0, 15);
  const canWithdraw = earningsSummary.available > 0;
  const hasCashCompleted = earningsSummary.cashCompleted > 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Yenza</Text>
            <Text style={styles.heading}>Your Earnings</Text>
            <Text style={styles.subtitle}>Track your income and withdraw your balance.</Text>
          </View>
          <Pressable style={styles.headerIcon} onPress={openDrawer} hitSlop={8}>
            <Menu size={24} color={COLORS.primary} strokeWidth={2.1} />
          </Pressable>
        </View>

        {resultMsg && (
          <View style={[styles.resultBanner, resultMsg.success ? styles.resultSuccess : styles.resultError]}>
            <Text style={styles.resultText}>{resultMsg.text}</Text>
            <Pressable onPress={() => setResultMsg(null)} hitSlop={8}>
              <X size={16} color={resultMsg.success ? COLORS.success : COLORS.error} strokeWidth={2.2} />
            </Pressable>
          </View>
        )}

        {/* Total Earnings */}
        <View style={styles.totalCard}>
          <View style={styles.totalLabelRow}>
            <View style={styles.totalIconBg}><TrendingUp size={18} color={COLORS.card} strokeWidth={2.2} /></View>
            <Text style={styles.totalLabel}>Total earnings</Text>
          </View>
          <Text style={styles.totalAmount}>{formatRand(earningsSummary.total)}</Text>
          <Text style={styles.totalNote}>Your net income after Yenza's 10% commission fee</Text>
        </View>

        {/* Commission breakdown */}
        <View style={styles.commissionCard}>
          <View style={styles.commissionRow}>
            <View style={styles.commissionLeft}>
              <View style={styles.commissionIcon}><HandCoins size={17} color={COLORS.secondary} strokeWidth={2.2} /></View>
              <Text style={styles.commissionLabel}>Gross earnings</Text>
            </View>
            <Text style={styles.commissionValue}>{formatRand(earningsSummary.grossEarnings)}</Text>
          </View>
          <View style={styles.commissionDivider} />
          <View style={styles.commissionRow}>
            <View style={styles.commissionLeft}>
              <View style={[styles.commissionIcon, styles.commissionIconRed]}><TrendingUp size={17} color={COLORS.error} strokeWidth={2.2} /></View>
              <View>
                <Text style={styles.commissionLabel}>Yenza commission</Text>
                <Text style={styles.commissionSubLabel}>10% platform fee</Text>
              </View>
            </View>
            <Text style={styles.commissionValueRed}>- {formatRand(earningsSummary.totalCommission)}</Text>
          </View>
        </View>

        {/* Available + Pending balance row */}
        <View style={styles.balanceRow}>
          <View style={[styles.balanceCard, styles.availableCard]}>
            <View style={styles.cardIcon}><ArrowUpRight size={19} color={COLORS.primary} strokeWidth={2.2} /></View>
            <Text style={styles.balanceLabel}>Available balance</Text>
            <Text style={styles.balanceAmount}>{formatRand(earningsSummary.available)}</Text>
            <Text style={styles.balanceNote}>Withdrawable to your account</Text>
            <Pressable
              style={[styles.withdrawButton, !canWithdraw && styles.withdrawButtonDisabled]}
              onPress={() => canWithdraw && setShowWithdraw(true)}
              disabled={!canWithdraw}
            >
              <Text style={styles.withdrawText}>Withdraw</Text>
            </Pressable>
          </View>
          <View style={[styles.balanceCard, styles.pendingCard]}>
            <View style={[styles.cardIcon, styles.pendingIcon]}><Clock3 size={19} color={COLORS.warning} strokeWidth={2.2} /></View>
            <Text style={styles.balanceLabel}>Pending</Text>
            <Text style={styles.balanceAmount}>{formatRand(earningsSummary.pending)}</Text>
            <Text style={styles.balanceNote}>Awaiting employer confirmation</Text>
          </View>
        </View>

        {/* Cash Received card — shows total paid in cash (not withdrawable) */}
        {hasCashCompleted && (
          <View style={styles.cashReceivedCard}>
            <View style={styles.cashReceivedLeft}>
              <View style={styles.cashReceivedIcon}><HandCoins size={20} color={COLORS.secondary} strokeWidth={2.2} /></View>
              <View style={styles.cashReceivedText}>
                <Text style={styles.cashReceivedTitle}>Cash received</Text>
                <Text style={styles.cashReceivedDesc}>Paid to you in cash by the employer. Not available for withdrawal.</Text>
              </View>
            </View>
            <Text style={styles.cashReceivedAmount}>{formatRand(earningsSummary.cashCompleted)}</Text>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.activityHeader}>
          <View>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.sectionSubtitle}>All your job earnings and transactions</Text>
          </View>
        </View>

        {recentEarnings.length === 0 ? (
          <View style={styles.emptyActivity}>
            <WalletCards size={40} color={COLORS.textMuted} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>No earnings yet</Text>
            <Text style={styles.emptyText}>Complete jobs to start earning. Your earnings will appear here.</Text>
          </View>
        ) : (
          <View style={styles.activityCard}>
            {recentEarnings.map((earning, index) => (
              <EarningRow key={earning.id} earning={earning} isLast={index === recentEarnings.length - 1} />
            ))}
          </View>
        )}

        {/* Recent Withdrawals */}
        {withdrawals.length > 0 && (
          <View style={styles.withdrawalsSection}>
            <Text style={styles.sectionTitle}>Withdrawal History</Text>
            <View style={styles.activityCard}>
              {withdrawals.slice(0, 5).map((wd, index) => (
                <View key={wd.id} style={[styles.activityRowV, index > 0 && styles.activityBorder]}>
                  <View style={[styles.activityIcon, getWithdrawalIconBg(wd.status)]}>
                    {wd.status === 'completed' ? (
                      <CheckCircle2 size={19} color={COLORS.success} strokeWidth={2.2} />
                    ) : wd.status === 'rejected' ? (
                      <X size={19} color={COLORS.error} strokeWidth={2.2} />
                    ) : (
                      <Clock3 size={19} color={COLORS.warning} strokeWidth={2.2} />
                    )}
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{formatRand(Number(wd.amount))} withdrawal</Text>
                    <Text style={styles.activityMeta}>
                      {wd.method.replace('_', ' ')} · {new Date(wd.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })} · {wd.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {/* Withdraw Modal */}
      <Modal visible={showWithdraw} transparent animationType="slide" onRequestClose={() => setShowWithdraw(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowWithdraw(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Withdraw earnings</Text>
            <Pressable style={styles.sheetCloseBtn} onPress={() => setShowWithdraw(false)} hitSlop={8}>
              <X size={20} color={COLORS.text} strokeWidth={2.2} />
            </Pressable>
          </View>

          <Text style={styles.sheetAvailableLabel}>Available balance</Text>
          <Text style={styles.sheetAvailableAmount}>{formatRand(earningsSummary.available)}</Text>

          <Text style={styles.sheetLabel}>Amount to withdraw (R)</Text>
          <TextInput
            style={styles.sheetInput}
            value={withdrawAmount}
            onChangeText={setWithdrawAmount}
            keyboardType="numeric"
            placeholder={`Up to ${formatRand(earningsSummary.available)}`}
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.sheetLabel}>Withdrawal method</Text>
          <View style={styles.methodList}>
            {WITHDRAWAL_METHODS.map((m) => {
              const Icon = m.icon;
              const selected = withdrawMethod === m.value;
              return (
                <Pressable
                  key={m.value}
                  style={[styles.methodOption, selected && styles.methodOptionActive]}
                  onPress={() => setWithdrawMethod(m.value)}
                >
                  <View style={[styles.methodIcon, selected && styles.methodIconActive]}>
                    <Icon size={18} color={selected ? COLORS.card : COLORS.primary} strokeWidth={2.2} />
                  </View>
                  <View style={styles.methodCopy}>
                    <Text style={[styles.methodTitle, selected && styles.methodTitleActive]}>{m.label}</Text>
                    <Text style={styles.methodDesc}>{m.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[styles.sheetWithdrawBtn, (!withdrawAmount || loading) && styles.withdrawButtonDisabled]}
            onPress={handleWithdraw}
            disabled={!withdrawAmount || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.card} />
            ) : (
              <Text style={styles.sheetWithdrawText}>Request withdrawal</Text>
            )}
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

function EarningRow({ earning, isLast }: { earning: EarningsActivity; isLast: boolean }) {
  const isPending = earning.status === 'pending';
  const isCashCompleted = earning.status === 'cash_completed';
  const isWithdrawn = earning.status === 'withdrawn';

  const statusLabel = isPending
    ? 'Pending — awaiting confirmation'
    : isCashCompleted
      ? 'Cash received'
      : isWithdrawn
        ? 'Withdrawn'
        : 'Available for withdrawal';
  const methodLabel = earning.paymentMethod ? ` · ${earning.paymentMethod.toUpperCase()}` : '';

  return (
    <View style={[styles.activityRowV, !isLast && styles.activityBorder]}>
      <View style={[
        styles.activityIcon,
        isPending && styles.pendingActivityIcon,
        isCashCompleted && styles.cashCompletedActivityIcon,
        isWithdrawn && styles.withdrawnActivityIcon,
      ]}>
        {isPending ? (
          <Clock3 size={19} color={COLORS.warning} strokeWidth={2.2} />
        ) : isCashCompleted ? (
          <Banknote size={19} color={COLORS.secondary} strokeWidth={2.2} />
        ) : isWithdrawn ? (
          <CheckCircle2 size={19} color={COLORS.textMuted} strokeWidth={2.2} />
        ) : earning.paymentMethod === 'card' || earning.paymentMethod === 'eft' ? (
          <CreditCard size={19} color={COLORS.success} strokeWidth={2.2} />
        ) : (
          <CheckCircle2 size={19} color={COLORS.success} strokeWidth={2.2} />
        )}
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{earning.jobTitle}</Text>
        <Text style={styles.activityMeta}>
          {earning.dateLabel} · {statusLabel}{methodLabel}
        </Text>
        {earning.commissionAmount > 0 && (
          <Text style={styles.commissionMeta}>
            Gross {formatRand(earning.grossAmount)} · 10% fee {formatRand(earning.commissionAmount)}
          </Text>
        )}
      </View>
      <Text style={[
        styles.activityAmount,
        isPending && styles.pendingAmount,
        isCashCompleted && styles.cashCompletedAmount,
        isWithdrawn && styles.withdrawnAmount,
      ]}>
        + {formatRand(earning.amount)}
      </Text>
    </View>
  );
}

function getWithdrawalIconBg(status: string): { backgroundColor: string } {
  if (status === 'completed') return { backgroundColor: '#DDF4EC' };
  if (status === 'rejected') return { backgroundColor: '#FFF5F5' };
  return { backgroundColor: '#FFF3D7' };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.lg },
  brand: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.primary, letterSpacing: -1, marginBottom: SPACING.md },
  heading: { fontFamily: FONTS.bold, fontSize: 25, color: COLORS.text },
  subtitle: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted, marginTop: 3 },
  headerIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DDF4EC', alignItems: 'center', justifyContent: 'center' },
  resultBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: RADIUS.md, padding: SPACING.sm + 2, marginBottom: SPACING.md },
  resultSuccess: { backgroundColor: COLORS.success + '1A' },
  resultError: { backgroundColor: COLORS.error + '1A' },
  resultText: { flex: 1, fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text, marginRight: SPACING.sm },
  totalCard: { backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm + 2 },
  totalLabelRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  totalIconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  totalLabel: { fontFamily: FONTS.medium, fontSize: 14, color: 'rgba(255,255,255,0.82)' },
  totalAmount: { fontFamily: FONTS.bold, fontSize: 38, color: COLORS.card, marginTop: SPACING.xs },
  totalNote: { fontFamily: FONTS.regular, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  // Commission breakdown card
  commissionCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm + 2 },
  commissionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commissionLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  commissionIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EAF7F2', alignItems: 'center', justifyContent: 'center' },
  commissionIconRed: { backgroundColor: '#FBEAEA' },
  commissionLabel: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text },
  commissionSubLabel: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  commissionValue: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text },
  commissionValueRed: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.error },
  commissionDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  balanceRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm + 2 },
  balanceCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md },
  availableCard: { borderColor: '#BFE5D5' },
  pendingCard: { borderColor: '#F1D9A6' },
  cardIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#DDF4EC', alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm },
  pendingIcon: { backgroundColor: '#FFF3D7' },
  balanceLabel: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted },
  balanceAmount: { fontFamily: FONTS.bold, fontSize: 23, color: COLORS.text, marginTop: 3 },
  balanceNote: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted, lineHeight: 16, marginTop: 3, minHeight: 32 },
  withdrawButton: { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, alignItems: 'center', paddingVertical: SPACING.sm, marginTop: SPACING.sm },
  withdrawButtonDisabled: { backgroundColor: COLORS.textMuted, opacity: 0.5 },
  withdrawText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.card },
  // Cash received card
  cashReceivedCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.secondary, padding: SPACING.md, marginBottom: SPACING.sm + 2 },
  cashReceivedLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  cashReceivedIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EAF7F2', alignItems: 'center', justifyContent: 'center' },
  cashReceivedText: { flex: 1 },
  cashReceivedTitle: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text },
  cashReceivedDesc: { fontFamily: FONTS.regular, fontSize: 11, lineHeight: 16, color: COLORS.textMuted, marginTop: 2 },
  cashReceivedAmount: { fontFamily: FONTS.bold, fontSize: 20, color: COLORS.secondary },
  // Activity
  activityHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: SPACING.sm + 2, marginTop: SPACING.md },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 19, color: COLORS.text },
  sectionSubtitle: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  emptyActivity: { alignItems: 'center', paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.lg },
  emptyTitle: { fontFamily: FONTS.semiBold, fontSize: 17, color: COLORS.text, marginTop: SPACING.md, marginBottom: SPACING.xs + 1 },
  emptyText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20 },
  activityCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md },
  activityRowV: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.md },
  activityBorder: { borderTopWidth: 1, borderTopColor: COLORS.border },
  activityIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#DDF4EC', alignItems: 'center', justifyContent: 'center' },
  pendingActivityIcon: { backgroundColor: '#FFF3D7' },
  cashCompletedActivityIcon: { backgroundColor: '#EAF7F2' },
  withdrawnActivityIcon: { backgroundColor: '#F0F2F1' },
  activityContent: { flex: 1, minWidth: 0 },
  activityTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  activityMeta: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 3 },
  activityAmount: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.success },
  pendingAmount: { color: COLORS.warning },
  cashCompletedAmount: { color: COLORS.secondary },
  withdrawnAmount: { color: COLORS.textMuted },
  commissionMeta: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  withdrawalsSection: { marginTop: SPACING.lg },
  // Withdraw modal
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15, 35, 27, 0.5)' },
  sheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING.xl },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.md },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  sheetTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text },
  sheetCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  sheetAvailableLabel: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted },
  sheetAvailableAmount: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.primary, marginBottom: SPACING.md },
  sheetLabel: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text, marginBottom: SPACING.xs + 2, marginTop: SPACING.sm },
  sheetInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.sm + 2, fontFamily: FONTS.regular, fontSize: 16, color: COLORS.text, backgroundColor: COLORS.background },
  methodList: { gap: SPACING.sm, marginBottom: SPACING.md },
  methodOption: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, padding: SPACING.sm + 2, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  methodOptionActive: { borderColor: COLORS.primary, backgroundColor: '#EAF7F2' },
  methodIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DDF4EC', alignItems: 'center', justifyContent: 'center' },
  methodIconActive: { backgroundColor: COLORS.primary },
  methodCopy: { flex: 1 },
  methodTitle: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  methodTitleActive: { color: COLORS.primary },
  methodDesc: { fontFamily: FONTS.regular, fontSize: 12, lineHeight: 17, color: COLORS.textMuted, marginTop: 2 },
  sheetWithdrawBtn: { backgroundColor: COLORS.primary, borderRadius: RADIUS.md, alignItems: 'center', paddingVertical: SPACING.md, marginTop: SPACING.sm },
  sheetWithdrawText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.card },
});
