import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator, Linking, Platform } from 'react-native';
import { MapPin, Navigation, X, Locate, Check } from 'lucide-react-native';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

interface LocationPickerModalProps {
  visible: boolean;
  currentLocation: string;
  onSelect: (location: string) => void;
  onDismiss: () => void;
}

export function LocationPickerModal({ visible, currentLocation, onSelect, onDismiss }: LocationPickerModalProps) {
  const [loading, setLoading] = useState(false);
  const [pickedLocation, setPickedLocation] = useState('');
  const [error, setError] = useState<string | null>(null);

  const openGoogleMaps = () => {
    const url = 'https://www.google.com/maps';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const useCurrentLocation = async () => {
    setError(null);
    setLoading(true);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        const { latitude, longitude } = position.coords;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=14&addressdetails=1`
        );
        const data = await response.json();
        const addr = data.address;
        const parts = [
          addr?.suburb || addr?.neighbourhood,
          addr?.town || addr?.city || addr?.village,
          addr?.state,
        ].filter(Boolean);
        const label = parts.length > 0 ? parts.join(', ') : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setPickedLocation(label);
      } else {
        setPickedLocation('Current location');
      }
    } catch {
      setError('Could not get your location. Check that location access is enabled.');
    }
    setLoading(false);
  };

  const confirm = () => {
    if (pickedLocation.trim()) {
      onSelect(pickedLocation.trim());
      onDismiss();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Set job location</Text>
            <Pressable onPress={onDismiss} hitSlop={12}>
              <X size={22} color={COLORS.textMuted} strokeWidth={2} />
            </Pressable>
          </View>

          <Pressable style={styles.mapPreview} onPress={openGoogleMaps}>
            <MapPin size={36} color={COLORS.primary} strokeWidth={1.8} />
            <Text style={styles.mapPreviewText}>Tap to open the map</Text>
            <Text style={styles.mapPreviewSub}>Find your location on the map, then use the button below to capture it.</Text>
            <Navigation size={18} color={COLORS.textMuted} strokeWidth={2} style={{ marginTop: SPACING.xs }} />
          </Pressable>

          <Pressable style={styles.currentBtn} onPress={useCurrentLocation} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Locate size={20} color={COLORS.primary} strokeWidth={2.2} />
            )}
            <Text style={styles.currentBtnText}>{loading ? 'Detecting…' : 'Use my current location'}</Text>
          </Pressable>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {pickedLocation ? (
            <View style={styles.pickedRow}>
              <MapPin size={16} color={COLORS.success} strokeWidth={2.5} />
              <Text style={styles.pickedText} numberOfLines={2}>{pickedLocation}</Text>
            </View>
          ) : currentLocation ? (
            <View style={styles.pickedRow}>
              <Text style={styles.pickedHint}>Currently set: {currentLocation}</Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            <Pressable style={styles.cancelBtn} onPress={onDismiss}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.confirmBtn, !pickedLocation && styles.confirmBtnDisabled]} onPress={confirm} disabled={!pickedLocation}>
              <Check size={18} color={COLORS.card} strokeWidth={2.5} />
              <Text style={styles.confirmText}>Confirm</Text>
            </Pressable>
          </View>
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
  mapPreview: { height: 180, backgroundColor: COLORS.background, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: SPACING.md },
  mapPreviewText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text },
  mapPreviewSub: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, textAlign: 'center', paddingHorizontal: SPACING.lg, lineHeight: 17 },
  currentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: '#EAF7F2', marginBottom: SPACING.sm },
  currentBtnText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.primary },
  errorText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.error, textAlign: 'center', marginBottom: SPACING.sm },
  pickedRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs + 2, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: RADIUS.md, backgroundColor: COLORS.background, marginBottom: SPACING.md },
  pickedText: { flex: 1, fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  pickedHint: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted },
  actionRow: { flexDirection: 'row', gap: SPACING.sm },
  cancelBtn: { flex: 1, alignItems: 'center', paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.textMuted },
  confirmBtn: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.xs + 2, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, backgroundColor: COLORS.primary },
  confirmBtnDisabled: { opacity: 0.4 },
  confirmText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.card },
});
