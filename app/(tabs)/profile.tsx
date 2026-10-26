import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  ViewStyle, Image, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  MapPin, Pencil, Check, X, LogOut, Camera, ShieldCheck, Menu,
} from 'lucide-react-native';
import { useApp } from '@/context/AppContext';
import { useDrawer } from '@/context/DrawerContext';
import { Worker, JobCategory, ExperienceLevel } from '@/types';
import {
  ALL_GENERAL_SERVICES, ALL_SKILLED_SERVICES, ALL_SERVICE_AREAS,
  EXPERIENCE_LEVELS, DAYS_OF_WEEK,
} from '@/data/mockData';
import { AvailabilityToggle } from '@/components/AvailabilityToggle';
import { ServiceChip } from '@/components/ServiceChip';
import { VerificationRow } from '@/components/VerificationRow';
import { ProfileCompletionCard } from '@/components/ProfileCompletionCard';
import { SectionHeader } from '@/components/SectionHeader';
import { Card } from '@/components/Card';
import { ServiceIcon } from '@/components/ServiceIcon';
import { SkillGapAnalysis } from '@/components/SkillGapAnalysis';
import { EmployerProfileView } from '@/components/EmployerProfileView';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';

export default function ProfileScreen() {
  const { role, worker, updateWorker, uploadProfilePhoto, toggleAvailability, logout, skillDemand, loadSkillDemand, skillGapAnalysis, skillGapLoading, skillGapLanguage, setSkillGapLanguage, generateSkillGapAnalysis, addSkillMilestone, updateMilestoneStatus } = useApp();
  const { openDrawer } = useDrawer();

  if (role === 'employer') return <EmployerProfileView />;

  useEffect(() => {
    if (role === 'worker') loadSkillDemand();
  }, [role, loadSkillDemand]);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Worker>(worker);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const handlePickPhoto = useCallback(async (fromCamera: boolean) => {
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [1, 1] })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8, allowsEditing: true, aspect: [1, 1] });
      if (result.canceled || !result.assets[0]) {
        setPhotoUploading(false);
        return;
      }
      const uploadResult = await uploadProfilePhoto(result.assets[0].uri);
      if (!uploadResult.success) {
        setPhotoError(uploadResult.error ?? 'Could not upload photo.');
      }
    } catch {
      setPhotoError('Could not upload photo.');
    }
    setPhotoUploading(false);
  }, [uploadProfilePhoto]);

  const startEdit = () => {
    setDraft(worker);
    setEditing(true);
  };

  const saveEdit = () => {
    updateWorker(draft);
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(worker);
    setEditing(false);
  };

  const updateDraft = (updates: Partial<Worker>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  };

  const toggleService = (service: JobCategory) => {
    const has = draft.services.includes(service);
    updateDraft({
      services: has
        ? draft.services.filter((s) => s !== service)
        : [...draft.services, service],
    });
  };

  const toggleArea = (area: string) => {
    const has = draft.serviceAreas.includes(area);
    updateDraft({
      serviceAreas: has
        ? draft.serviceAreas.filter((a) => a !== area)
        : [...draft.serviceAreas, area],
    });
  };

  const toggleDay = (day: string) => {
    const has = draft.availabilityDays.includes(day);
    updateDraft({
      availabilityDays: has
        ? draft.availabilityDays.filter((d) => d !== day)
        : [...draft.availabilityDays, day],
    });
  };

  const computeCompletion = (w: Worker) => {
    let total = 0;
    let done = 0;
    const checks: { label: string; done: boolean }[] = [
      { label: 'Add profile photo', done: w.profilePhotoSet },
      { label: 'Add bio', done: w.bio.trim().length > 10 },
      { label: 'Add services', done: w.services.length > 0 },
      { label: 'Add service area', done: w.serviceAreas.length > 0 },
      { label: 'Add experience detail', done: w.experienceDetail.trim().length > 5 },
      { label: 'Add email', done: w.email.trim().length > 0 },
    ];
    checks.forEach((c) => {
      total++;
      if (c.done) done++;
    });
    return {
      percentage: Math.round((done / total) * 100),
      missing: checks.filter((c) => !c.done).map((c) => c.label),
    };
  };

  const completion = computeCompletion(editing ? draft : worker);
  const displayWorker = editing ? draft : worker;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Yenza</Text>
        {editing ? (
          <View style={styles.editActions}>
            <Pressable style={styles.cancelBtn} onPress={cancelEdit}>
              <X size={18} color={COLORS.textMuted} strokeWidth={2.2} />
            </Pressable>
            <Pressable style={styles.saveBtn} onPress={saveEdit}>
              <Check size={18} color={COLORS.card} strokeWidth={2.2} />
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.topActions}>
            <Pressable style={styles.menuButton} onPress={openDrawer} hitSlop={8}>
              <Menu size={21} color={COLORS.text} strokeWidth={2.1} />
            </Pressable>
            <Pressable style={styles.editBtn} onPress={startEdit}>
              <Pencil size={16} color={COLORS.primary} strokeWidth={2.2} />
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </View>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            {displayWorker.photo ? (
              <Image source={{ uri: displayWorker.photo }} style={styles.avatarImage} resizeMode="cover" />
            ) : (
              <Text style={styles.avatarInitials}>
                {displayWorker.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </Text>
            )}
          </View>
          <Pressable style={styles.cameraWrapper} onPress={() => handlePickPhoto(false)} disabled={photoUploading} hitSlop={12}>
            <View style={styles.cameraBtn}>
              {photoUploading ? (
                <ActivityIndicator size={14} color={COLORS.card} />
              ) : (
                <Camera size={16} color={COLORS.card} strokeWidth={2.2} />
              )}
            </View>
          </Pressable>
          {photoError && <Text style={styles.photoError}>{photoError}</Text>}
          <Text style={styles.workerName}>{displayWorker.name}</Text>
          <Text style={styles.workerRole}>
            {displayWorker.services
              .slice(0, 3)
              .join(' & ')}
          </Text>
          <View style={styles.locationRow}>
            <MapPin size={14} color={COLORS.textMuted} strokeWidth={2} />
            <Text style={styles.locationText}>{displayWorker.location}</Text>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View>
            <Text style={styles.statusLabel}>Worker status</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: displayWorker.isAvailable ? COLORS.success : COLORS.textMuted }]} />
              <Text style={[styles.statusValue, { color: displayWorker.isAvailable ? COLORS.success : COLORS.textMuted }]}>
                {displayWorker.isAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>
          <AvailabilityToggle available={displayWorker.isAvailable} onToggle={toggleAvailability} />
        </View>

        <ProfileCompletionCard percentage={completion.percentage} missingItems={completion.missing} />

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <Text style={styles.fieldLabel}>Full name</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={draft.name}
              onChangeText={(v) => updateDraft({ name: v })}
            />
          ) : (
            <Text style={styles.fieldValue}>{displayWorker.name}</Text>
          )}

          <Text style={styles.fieldLabel}>Mobile number</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={draft.phone}
              keyboardType="phone-pad"
              onChangeText={(v) => updateDraft({ phone: v })}
            />
          ) : (
            <Text style={styles.fieldValue}>{displayWorker.phone}</Text>
          )}

          <Text style={styles.fieldLabel}>Email address</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={draft.email}
              keyboardType="email-address"
              autoCapitalize="none"
              onChangeText={(v) => updateDraft({ email: v })}
            />
          ) : (
            <Text style={styles.fieldValue}>{displayWorker.email}</Text>
          )}

          <Text style={styles.fieldLabel}>Preferred language</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={draft.preferredLanguage}
              onChangeText={(v) => updateDraft({ preferredLanguage: v })}
            />
          ) : (
            <Text style={styles.fieldValue}>{displayWorker.preferredLanguage}</Text>
          )}

          <Text style={styles.fieldLabel}>Location</Text>
          {editing ? (
            <TextInput
              style={styles.input}
              value={draft.location}
              onChangeText={(v) => updateDraft({ location: v })}
            />
          ) : (
            <Text style={styles.fieldValue}>{displayWorker.location}</Text>
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          {editing ? (
            <TextInput
              style={styles.textArea}
              value={draft.bio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Tell customers about your experience, the type of work you do and the areas you serve."
              placeholderTextColor={COLORS.textMuted}
              onChangeText={(v) => updateDraft({ bio: v })}
            />
          ) : (
            <Text style={styles.bioText}>{displayWorker.bio}</Text>
          )}
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>

          <Text style={styles.subGroupTitle}>General Work</Text>
          <View style={styles.chipsContainer}>
            {ALL_GENERAL_SERVICES.map((service) => {
              const selected = displayWorker.services.includes(service);
              return (
                <ServiceChip
                  key={service}
                  label={service}
                  selected={selected}
                  onPress={editing ? () => toggleService(service) : undefined}
                />
              );
            })}
          </View>

          <Text style={styles.subGroupTitle}>Skilled Services</Text>
          <Text style={styles.subGroupNote}>
            Only offer skilled services you are qualified to perform.
          </Text>
          <View style={styles.chipsContainer}>
            {ALL_SKILLED_SERVICES.map((service) => {
              const selected = displayWorker.services.includes(service);
              return (
                <ServiceChip
                  key={service}
                  label={service}
                  selected={selected}
                  onPress={editing ? () => toggleService(service) : undefined}
                />
              );
            })}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <Text style={styles.fieldLabel}>Years of experience</Text>
          <View style={styles.chipsContainer}>
            {EXPERIENCE_LEVELS.map((level) => {
              const selected = displayWorker.experience === level;
              return (
                <ServiceChip
                  key={level}
                  label={level}
                  selected={selected}
                  onPress={
                    editing
                      ? () => updateDraft({ experience: level as ExperienceLevel })
                      : undefined
                  }
                />
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Skills & Experience</Text>
          {editing ? (
            <TextInput
              style={styles.textArea}
              value={draft.experienceDetail}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Describe your skills and experience."
              placeholderTextColor={COLORS.textMuted}
              onChangeText={(v) => updateDraft({ experienceDetail: v })}
            />
          ) : (
            <Text style={styles.bioText}>{displayWorker.experienceDetail}</Text>
          )}
        </Card>

        <SkillGapAnalysis
          workerServices={displayWorker.services}
          skillDemand={skillDemand}
          experience={displayWorker.experience}
          skillGapAnalysis={skillGapAnalysis}
          skillGapLoading={skillGapLoading}
          language={skillGapLanguage}
          onLanguageChange={setSkillGapLanguage}
          onGenerate={generateSkillGapAnalysis}
          onAddMilestone={addSkillMilestone}
          onUpdateMilestoneStatus={updateMilestoneStatus}
        />

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Service Area</Text>
          <Text style={styles.fieldLabel}>Primary area</Text>
          <Text style={styles.fieldValue}>{displayWorker.location.split(',')[0]}</Text>

          <Text style={styles.fieldLabel}>Service areas</Text>
          <View style={styles.chipsContainer}>
            {ALL_SERVICE_AREAS.map((area) => {
              const selected = displayWorker.serviceAreas.includes(area);
              return (
                <ServiceChip
                  key={area}
                  label={area}
                  selected={selected}
                  onPress={editing ? () => toggleArea(area) : undefined}
                />
              );
            })}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Availability</Text>
          <View style={styles.availRow}>
            <Text style={styles.availLabel}>Available for work</Text>
            <AvailabilityToggle available={displayWorker.isAvailable} onToggle={toggleAvailability} />
          </View>
          <Text style={styles.fieldLabel}>Preferred working days</Text>
          <View style={styles.daysContainer}>
            {DAYS_OF_WEEK.map((day) => {
              const selected = displayWorker.availabilityDays.includes(day);
              return (
                <Pressable
                  key={day}
                  style={[styles.dayChip, selected && styles.dayChipSelected]}
                  onPress={editing ? () => toggleDay(day) : undefined}
                  disabled={!editing}
                >
                  <Text style={[styles.dayText, selected && styles.dayTextSelected]}>
                    {day.slice(0, 3)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <ShieldCheck size={18} color={COLORS.secondary} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Qualifications & Verification</Text>
          </View>
          <Text style={styles.verificationNote}>
            Identity verification, qualification verification and professional registration are separate checks.
            Verification badges only appear where the specific check has been completed.
          </Text>
          {displayWorker.qualifications.map((q, i) => (
            <VerificationRow key={i} item={q} />
          ))}
        </Card>

        <Pressable style={styles.logoutBtn} onPress={logout}>
          <LogOut size={18} color={COLORS.error} strokeWidth={2.2} />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={styles.footerText}>Yenza · Worker App · Prototype</Text>
        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  topBarTitle: {
    fontFamily: FONTS.bold,
    fontSize: 28,
    color: COLORS.primary,
    letterSpacing: -1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs + 2,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
  },
  editBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.primary,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  menuButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cancelBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.md,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.primary,
  },
  saveBtnText: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.card,
  },
  scroll: {
    padding: SPACING.md,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#DDF4EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarInitials: {
    fontFamily: FONTS.bold,
    fontSize: 32,
    color: COLORS.primary,
  },
  cameraWrapper: {
    position: 'absolute',
    top: SPACING.md + 4,
    alignSelf: 'center',
    marginLeft: 30,
  },
  cameraBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  photoError: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.error,
    marginBottom: SPACING.xs,
  },
  workerName: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.text,
  },
  workerRole: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 2,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  locationText: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  statusLabel: {
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 16,
  },
  section: {
    marginTop: SPACING.sm + 2,
  } as ViewStyle,
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 17,
    color: COLORS.text,
    marginBottom: SPACING.sm + 2,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm + 2,
  },
  fieldLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  fieldValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.text,
  },
  input: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
  },
  textArea: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    minHeight: 90,
    lineHeight: 21,
  },
  bioText: {
    fontFamily: FONTS.regular,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  subGroupTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 14,
    color: COLORS.text,
    marginTop: SPACING.sm - 2,
    marginBottom: SPACING.xs + 1,
  },
  subGroupNote: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs + 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm - 2,
  },
  dayChip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    minWidth: 48,
    alignItems: 'center',
  },
  dayChipSelected: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  dayText: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textMuted,
  },
  dayTextSelected: {
    fontFamily: FONTS.semiBold,
    color: COLORS.primary,
  },
  availRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  availLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.text,
  },
  verificationNote: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 19,
    marginBottom: SPACING.sm,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error + '40',
    marginTop: SPACING.lg,
  },
  logoutText: {
    fontFamily: FONTS.semiBold,
    fontSize: 15,
    color: COLORS.error,
  },
  footerText: {
    fontFamily: FONTS.regular,
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
});
