import { ReactNode } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableWithoutFeedback } from 'react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  onDismiss: () => void;
  children: ReactNode;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
  primaryVariant?: 'primary' | 'danger';
}

export function ConfirmationModal({
  visible,
  title,
  onDismiss,
  children,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  primaryVariant = 'primary',
}: ConfirmationModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.sheet}>
              <Text style={styles.title}>{title}</Text>
              {children}
              <View style={styles.actions}>
                <Pressable style={styles.secondaryBtn} onPress={onSecondary}>
                  <Text style={styles.secondaryText}>{secondaryLabel}</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.primaryBtn,
                    primaryVariant === 'danger' && styles.dangerBtn,
                  ]}
                  onPress={onPrimary}
                >
                  <Text
                    style={[
                      styles.primaryText,
                      primaryVariant === 'danger' && styles.dangerText,
                    ]}
                  >
                    {primaryLabel}
                  </Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    padding: SPACING.lg,
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    width: '100%',
    maxWidth: 380,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 19,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  secondaryBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  secondaryText: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.text,
  },
  primaryBtn: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  dangerBtn: {
    backgroundColor: COLORS.error + '15',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  primaryText: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.card,
  },
  dangerText: {
    color: COLORS.error,
  },
});
