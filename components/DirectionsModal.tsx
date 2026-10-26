import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator, Platform, Linking } from 'react-native';
import { MapPin, Navigation, X, Car, Footprints, Bike, Locate } from 'lucide-react-native';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { Job } from '@/types';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

type TravelMode = 'driving' | 'walking' | 'bicycling';

interface DirectionsModalProps {
  visible: boolean;
  job: Job | null;
  onDismiss: () => void;
}

const MODE_META: { mode: TravelMode; label: string; icon: typeof Car }[] = [
  { mode: 'driving', label: 'Drive', icon: Car },
  { mode: 'walking', label: 'Walk', icon: Footprints },
  { mode: 'bicycling', label: 'Bike', icon: Bike },
];

const DEFAULT_ORIGIN = { lat: -27.7696, lng: 29.9327 };

export function DirectionsModal({ visible, job, onDismiss }: DirectionsModalProps) {
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>('driving');
  const [mapLoading, setMapLoading] = useState(true);
  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const detectLocation = useCallback(async () => {
    setLocating(true);
    setLocationError(null);
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && 'geolocation' in navigator) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
        });
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      } else {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== 'granted') {
          setLocationError('Location permission denied. Using a default starting point.');
          setOrigin(DEFAULT_ORIGIN);
        } else {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        }
      }
    } catch {
      setLocationError('Could not detect your location. Using a default starting point.');
      setOrigin(DEFAULT_ORIGIN);
    }
    setLocating(false);
  }, []);

  useEffect(() => {
    if (visible && job && !job.isRemote) {
      setMapLoading(true);
      setOrigin(null);
      detectLocation();
    }
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [visible, job, detectLocation]);

  // Safety net: always clear the loading spinner after 8s even if onLoadEnd never fires
  useEffect(() => {
    if (mapLoading) {
      loadingTimerRef.current = setTimeout(() => setMapLoading(false), 8000);
    } else if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [mapLoading]);

  if (!job) return null;

  if (job.isRemote) {
    return (
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <View style={styles.header}>
              <Text style={styles.title}>Remote Job</Text>
              <Pressable onPress={onDismiss} hitSlop={12}>
                <X size={22} color={COLORS.textMuted} strokeWidth={2} />
              </Pressable>
            </View>
            <View style={styles.remotePlaceholder}>
              <Navigation size={40} color={COLORS.textMuted} strokeWidth={1.8} />
              <Text style={styles.remoteText}>This is a remote job — no physical location to navigate to.</Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const destLat = job.latitude;
  const destLng = job.longitude;
  const hasValidCoords = destLat !== 0 && destLng !== 0;
  const useDefaultOrigin = !origin;
  const oLat = origin?.lat ?? DEFAULT_ORIGIN.lat;
  const oLng = origin?.lng ?? DEFAULT_ORIGIN.lng;

  const embedUrl = useDefaultOrigin
    ? `https://maps.google.com/maps?q=${destLat},${destLng}&z=14&output=embed`
    : `https://maps.google.com/maps?saddr=${oLat},${oLng}&daddr=${destLat},${destLng}&t=m&z=12&output=embed`;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${oLat},${oLng}&destination=${destLat},${destLng}&travelmode=${travelMode}`;

  const openTurnByTurn = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(directionsUrl, '_blank');
    } else {
      Linking.openURL(directionsUrl);
    }
  };

  const mapIframe = Platform.OS === 'web' ? (
    // On web, a native iframe is far more reliable than the WebView shim for cross-origin embeds
    <iframe
      src={embedUrl}
      title="Job location map"
      style={{ width: '100%', height: '100%', border: 'none' }}
      onLoad={() => setMapLoading(false)}
      allowFullScreen
    />
  ) : (
    <WebView
      source={{ uri: embedUrl }}
      style={styles.webview}
      onLoadEnd={() => setMapLoading(false)}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
    />
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Navigate to job</Text>
            <Pressable onPress={onDismiss} hitSlop={12}>
              <X size={22} color={COLORS.textMuted} strokeWidth={2} />
            </Pressable>
          </View>

          <View style={styles.destRow}>
            <View style={styles.destIcon}>
              <MapPin size={18} color={COLORS.card} strokeWidth={2.2} />
            </View>
            <View style={styles.destCopy}>
              <Text style={styles.destLabel}>Destination</Text>
              <Text style={styles.destText} numberOfLines={2}>{job.location}</Text>
            </View>
          </View>

          <View style={styles.modeRow}>
            {MODE_META.map(({ mode, label, icon: Icon }) => (
              <Pressable
                key={mode}
                style={[styles.modeBtn, travelMode === mode && styles.modeBtnActive]}
                onPress={() => setTravelMode(mode)}
              >
                <Icon size={17} color={travelMode === mode ? COLORS.card : COLORS.textMuted} strokeWidth={2.2} />
                <Text style={[styles.modeBtnText, travelMode === mode && styles.modeBtnTextActive]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.mapContainer}>
            {mapLoading && (
              <View style={styles.mapLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.mapLoadingText}>Loading map…</Text>
              </View>
            )}
            {hasValidCoords ? (
              mapIframe
            ) : (
              <View style={styles.noCoords}>
                <MapPin size={36} color={COLORS.textMuted} strokeWidth={1.5} />
                <Text style={styles.noCoordsText}>No coordinates available for this location.</Text>
              </View>
            )}
          </View>

          {locating && (
            <View style={styles.etaRow}>
              <ActivityIndicator size="small" color={COLORS.secondary} />
              <Text style={styles.etaText}>Detecting your location…</Text>
            </View>
          )}

          {locationError && <Text style={styles.locError}>{locationError}</Text>}

          <Pressable style={styles.relocateBtn} onPress={detectLocation} disabled={locating}>
            <Locate size={17} color={COLORS.primary} strokeWidth={2.2} />
            <Text style={styles.relocateText}>{locating ? 'Locating…' : 'Use my current location'}</Text>
          </Pressable>

          <Pressable style={styles.navBtn} onPress={openTurnByTurn}>
            <Navigation size={22} color={COLORS.card} strokeWidth={2.2} />
            <Text style={styles.navBtnText}>Start Turn-by-Turn Navigation</Text>
          </Pressable>

          <Text style={styles.note}>
            Tap start to open turn-by-turn directions in your maps app.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: COLORS.card, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: SPACING.xl, maxHeight: '92%' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: SPACING.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  title: { fontFamily: FONTS.bold, fontSize: 19, color: COLORS.text },
  destRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm + 2, marginBottom: SPACING.md },
  destIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  destCopy: { flex: 1 },
  destLabel: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
  destText: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text },
  modeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm + 2 },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  modeBtnActive: { borderColor: COLORS.primary, backgroundColor: '#EAF7F2' },
  modeBtnText: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.textMuted },
  modeBtnTextActive: { color: COLORS.primary, fontFamily: FONTS.semiBold },
  mapContainer: { height: 240, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm + 2, backgroundColor: COLORS.background },
  webview: { flex: 1 },
  mapLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  mapLoadingText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, marginTop: SPACING.xs + 2 },
  noCoords: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  noCoordsText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted, textAlign: 'center' },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs + 2, paddingVertical: SPACING.xs + 1, paddingHorizontal: SPACING.md, borderRadius: RADIUS.sm, backgroundColor: COLORS.background, marginBottom: SPACING.sm },
  etaText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  locError: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.warning, marginBottom: SPACING.sm, lineHeight: 17 },
  relocateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm + 2, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.primary, backgroundColor: '#EAF7F2', marginBottom: SPACING.sm },
  relocateText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.primary },
  navBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.secondary, paddingVertical: SPACING.md + 2, borderRadius: RADIUS.md },
  navBtnText: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.card },
  note: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 17 },
  remotePlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xl, gap: SPACING.sm },
  remoteText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: SPACING.md },
});
