import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

interface CalendarPickerModalProps {
  visible: boolean;
  selectedDate: string | null;
  onSelect: (dateISO: string, dateLabel: string) => void;
  onDismiss: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toLabel(date: Date): string {
  return date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isBefore(a: Date, b: Date): boolean {
  const aNorm = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const bNorm = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return aNorm < bNorm;
}

export function CalendarPickerModal({ visible, selectedDate, onSelect, onDismiss }: CalendarPickerModalProps) {
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const offset = firstWeekday === 0 ? 6 : firstWeekday - 1;

  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const parsedSelected = selectedDate ? new Date(selectedDate + 'T00:00:00') : null;

  const isPast = (date: Date) => isBefore(date, today);
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
  const canGoPrev = !isCurrentMonth;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Select a date</Text>
            <Pressable onPress={onDismiss} hitSlop={12}>
              <X size={22} color={COLORS.textMuted} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.navRow}>
            <Pressable onPress={goPrev} disabled={!canGoPrev} hitSlop={12} style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}>
              <ChevronLeft size={22} color={canGoPrev ? COLORS.primary : COLORS.border} strokeWidth={2.2} />
            </Pressable>
            <Text style={styles.monthLabel}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
            <Pressable onPress={goNext} hitSlop={12} style={styles.navBtn}>
              <ChevronRight size={22} color={COLORS.primary} strokeWidth={2.2} />
            </Pressable>
          </View>

          <View style={styles.weekdayRow}>
            {WEEKDAY_LABELS.map((label) => (
              <View key={label} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.dayGrid}>
            {cells.map((date, index) => {
              if (!date) return <View key={index} style={styles.dayCell} />;
              const past = isPast(date);
              const selected = parsedSelected && sameDay(date, parsedSelected);
              const isToday = sameDay(date, today);
              return (
                <View key={index} style={styles.dayCell}>
                  <Pressable
                    style={[styles.dayBtn, selected && styles.dayBtnSelected, past && styles.dayBtnDisabled]}
                    disabled={past}
                    onPress={() => {
                      onSelect(toISODate(date), toLabel(date));
                      onDismiss();
                    }}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        past && styles.dayTextDisabled,
                        selected && styles.dayTextSelected,
                        isToday && !selected && styles.dayTextToday,
                      ]}
                    >
                      {date.getDate()}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {selectedDate && (
            <View style={styles.selectedRow}>
              <Check size={16} color={COLORS.success} strokeWidth={2.5} />
              <Text style={styles.selectedText}>
                {parsedSelected ? toLabel(parsedSelected) : selectedDate}
              </Text>
            </View>
          )}

          <Text style={styles.hint}>You can only select today or a future date.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING.xl },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  title: { fontFamily: FONTS.bold, fontSize: 19, color: COLORS.text },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm + 2 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  navBtnDisabled: { opacity: 0.35 },
  monthLabel: { fontFamily: FONTS.semiBold, fontSize: 16, color: COLORS.text },
  weekdayRow: { flexDirection: 'row', marginBottom: SPACING.xs },
  weekdayCell: { flex: 1, alignItems: 'center' },
  weekdayText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  dayBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background },
  dayBtnSelected: { backgroundColor: COLORS.primary },
  dayBtnDisabled: { backgroundColor: 'transparent' },
  dayText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.text },
  dayTextDisabled: { color: COLORS.border },
  dayTextSelected: { color: COLORS.card, fontFamily: FONTS.semiBold },
  dayTextToday: { color: COLORS.primary, fontFamily: FONTS.semiBold },
  selectedRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs + 2, marginTop: SPACING.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, backgroundColor: '#EAF7F2' },
  selectedText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  hint: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm },
});
