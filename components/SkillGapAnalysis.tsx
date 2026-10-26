import { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import * as Speech from 'expo-speech';
import {
  TrendingUp, Lightbulb, CheckCircle2, ArrowRight,
  Users, Briefcase, Sparkles, ChevronDown, ChevronUp, AlertCircle,
  Plus, Clock, Target, RefreshCw, X, GraduationCap, BookOpen,
  Volume2, Square,
} from 'lucide-react-native';
import { JobCategory, SkillMilestone } from '@/types';
import { ServiceIcon } from '@/components/ServiceIcon';
import { Card } from '@/components/Card';
import { SkillDemand } from '@/types';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';
import { ALL_GENERAL_SERVICES, ALL_SKILLED_SERVICES } from '@/data/mockData';

interface SkillGapAnalysisProps {
  workerServices: JobCategory[];
  skillDemand: SkillDemand[];
  experience: string;
  skillGapAnalysis: { summary: string; milestones: SkillMilestone[]; updatedAt: string } | null;
  skillGapLoading: boolean;
  language: 'en' | 'zu';
  onLanguageChange: (lang: 'en' | 'zu') => void;
  onGenerate: () => Promise<{ success: boolean; error?: string }>;
  onAddMilestone: (skill: string) => Promise<{ success: boolean; error?: string }>;
  onUpdateMilestoneStatus: (milestoneId: string, status: SkillMilestone['status']) => Promise<void>;
}

interface GapItem {
  service: JobCategory;
  category: 'General Work' | 'Skilled Services';
  totalJobs: number;
  openJobs: number;
  workerCount: number;
  demandScore: number;
  competitionScore: number;
  opportunityScore: number;
  reason: string;
}

const LANG_LABEL: Record<'en' | 'zu', string> = { en: 'English', zu: 'isiZulu' };

export function SkillGapAnalysis({
  workerServices, skillDemand, experience,
  skillGapAnalysis, skillGapLoading, language, onLanguageChange,
  onGenerate, onAddMilestone, onUpdateMilestoneStatus,
}: SkillGapAnalysisProps) {
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState('');
  const [addError, setAddError] = useState('');
  const [genError, setGenError] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<Speech.Voice[]>([]);
  const spokenRef = useRef<string | null>(null);

  useEffect(() => {
    Speech.getAvailableVoicesAsync().then((voices) => setAvailableVoices(voices)).catch(() => {});
    return () => { Speech.stop(); };
  }, []);

  const pickVoice = (): string | undefined => {
    if (!availableVoices.length) return undefined;
    const langPrefix = language === 'zu' ? 'zu' : 'en';
    const candidates = availableVoices.filter((v) =>
      v.language?.toLowerCase().startsWith(langPrefix)
    );
    const preferred = candidates.find((v) => /female|woman|zira|samantha|google/i.test(v.name));
    return (preferred ?? candidates[0] ?? availableVoices[0]).identifier;
  };

  const buildMilestoneSpeech = (m: SkillMilestone): string => {
    const parts = [`${m.skill}. ${m.title}.`, m.description];
    if (m.steps.length > 0) {
      parts.push(m.steps.map((s, i) => `Step ${i + 1}: ${s}`).join('. '));
    }
    if (m.estimatedTime) parts.push(`Estimated time: ${m.estimatedTime}.`);
    if (m.resources && m.resources.length > 0) parts.push(`Resources: ${m.resources.join(', ')}.`);
    return parts.filter(Boolean).join('. ');
  };

  const toggleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
      Speech.stop();
      setSpeakingId(null);
      return;
    }
    Speech.stop();
    setSpeakingId(id);
    spokenRef.current = id;
    Speech.speak(text, {
      language: language === 'zu' ? 'zu-ZA' : 'en-ZA',
      voice: pickVoice(),
      rate: 0.92,
      pitch: 1.0,
      onDone: () => setSpeakingId((cur) => (cur === id ? null : cur)),
      onStopped: () => setSpeakingId((cur) => (cur === id ? null : cur)),
      onError: () => setSpeakingId((cur) => (cur === id ? null : cur)),
    });
  };

  const stopAllSpeech = () => {
    Speech.stop();
    setSpeakingId(null);
  };

  const analysis = useMemo(() => {
    const demandMap: Record<string, SkillDemand> = {};
    skillDemand.forEach((d) => { demandMap[d.service] = d; });

    const allServices: JobCategory[] = [...ALL_GENERAL_SERVICES, ...ALL_SKILLED_SERVICES];
    const missing = allServices.filter((s) => !workerServices.includes(s));

    const gaps: GapItem[] = missing.map((service) => {
      const demand = demandMap[service];
      const totalJobs = demand?.totalJobs ?? 0;
      const openJobs = demand?.openJobs ?? 0;
      const workerCount = demand?.workerCount ?? 0;

      const demandScore = totalJobs * 2 + openJobs * 3;
      const competitionScore = workerCount;
      const opportunityScore = demandScore - competitionScore * 1.5;

      let reason: string;
      if (totalJobs > 0 && workerCount === 0) {
        reason = 'Employers are requesting this skill but no workers offer it yet — high opportunity.';
      } else if (openJobs > 0 && workerCount <= 2) {
        reason = `${openJobs} open job${openJobs === 1 ? '' : 's'} now and low competition from other workers.`;
      } else if (totalJobs > 0 && workerCount > 0) {
        reason = `${totalJobs} job${totalJobs === 1 ? '' : 's'} posted historically with ${workerCount} worker${workerCount === 1 ? '' : 's'} offering this.`;
      } else if (workerCount === 0) {
        reason = 'No workers currently offer this — be the first in your area.';
      } else {
        reason = 'A commonly requested trade skill that could expand your earning potential.';
      }

      const category = ALL_SKILLED_SERVICES.includes(service) ? 'Skilled Services' : 'General Work';
      return { service, category, totalJobs, openJobs, workerCount, demandScore, competitionScore, opportunityScore, reason };
    });

    gaps.sort((a, b) => {
      if (b.opportunityScore !== a.opportunityScore) return b.opportunityScore - a.opportunityScore;
      return b.demandScore - a.demandScore;
    });

    return gaps;
  }, [workerServices, skillDemand]);

  const topGaps = analysis.slice(0, 3);
  const visibleGaps = showAll ? analysis : topGaps;

  const workerServiceDemand = useMemo(() => {
    return skillDemand.filter((d) => workerServices.includes(d.service));
  }, [skillDemand, workerServices]);

  const totalOpenJobs = skillDemand.reduce((s, d) => s + d.openJobs, 0);
  const totalJobs = skillDemand.reduce((s, d) => s + d.totalJobs, 0);
  const coveredJobs = workerServiceDemand.reduce((s, d) => s + d.totalJobs, 0);
  const coveragePercent = totalJobs > 0 ? Math.round((coveredJobs / totalJobs) * 100) : 0;

  const isBeginner = experience === 'New to the trade';
  const milestones = skillGapAnalysis?.milestones ?? [];
  const hasAnalysis = skillGapAnalysis !== null && milestones.length > 0;
  const summarySpeechId = 'summary';

  const handleGenerate = async () => {
    stopAllSpeech();
    setGenError('');
    const result = await onGenerate();
    if (!result.success) {
      setGenError(result.error ?? 'Could not generate analysis. Please try again.');
    }
  };

  const handleAddMilestone = async () => {
    if (!selectedSkill.trim()) { setAddError('Please enter a skill name.'); return; }
    setAddError('');
    const result = await onAddMilestone(selectedSkill.trim());
    if (result.success) {
      setAddModalVisible(false);
      setSelectedSkill('');
    } else {
      setAddError(result.error ?? 'Could not add milestone. Please try again.');
    }
  };

  const cycleMilestoneStatus = (m: SkillMilestone) => {
    const next: SkillMilestone['status'] = m.status === 'pending' ? 'in_progress' : m.status === 'in_progress' ? 'completed' : 'pending';
    onUpdateMilestoneStatus(m.id, next);
  };

  const handleLanguageToggle = (lang: 'en' | 'zu') => {
    if (lang === language) return;
    stopAllSpeech();
    onLanguageChange(lang);
  };

  const skillsForAdd = [...ALL_GENERAL_SERVICES, ...ALL_SKILLED_SERVICES] as string[];

  return (
    <Card style={styles.container}>
      <Pressable style={styles.headerPress} onPress={() => { setExpanded(!expanded); if (expanded) stopAllSpeech(); }}>
        <View style={styles.headerRow}>
          <View style={styles.headerIconBg}>
            <Lightbulb size={20} color={COLORS.secondary} strokeWidth={2.2} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>Skill Gap Analysis</Text>
            <Text style={styles.subtitle}>
              {hasAnalysis
                ? `${milestones.length} AI milestone${milestones.length === 1 ? '' : 's'} · ${coveragePercent}% demand covered`
                : `${coveragePercent}% of job demand covered · ${analysis.length} skill${analysis.length === 1 ? '' : 's'} you could add`}
            </Text>
          </View>
        </View>
        {expanded ? <ChevronUp size={20} color={COLORS.textMuted} /> : <ChevronDown size={20} color={COLORS.textMuted} />}
      </Pressable>

      {expanded && (
        <View style={styles.detailSection}>
          {/* AI Analysis Section */}
          <View style={styles.aiSection}>
            <View style={styles.aiHeaderRow}>
              <View style={styles.aiHeaderLeft}>
                <View style={styles.aiBadge}>
                  <Sparkles size={16} color={COLORS.card} strokeWidth={2.2} />
                </View>
                <Text style={styles.aiTitle}>AI Career Path</Text>
              </View>
              {/* Language toggle */}
              <View style={styles.langToggle}>
                {(['en', 'zu'] as const).map((lng) => (
                  <Pressable
                    key={lng}
                    style={[styles.langBtn, language === lng && styles.langBtnActive]}
                    onPress={() => handleLanguageToggle(lng)}
                  >
                    <Text style={[styles.langBtnText, language === lng && styles.langBtnTextActive]}>{LANG_LABEL[lng]}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {genError ? <Text style={styles.errorText}>{genError}</Text> : null}

            {!hasAnalysis && !skillGapLoading && (
              <View style={styles.aiEmpty}>
                <GraduationCap size={32} color={COLORS.textMuted} strokeWidth={1.5} />
                <Text style={styles.aiEmptyTitle}>Get your AI-powered skill path</Text>
                <Text style={styles.aiEmptyText}>
                  Yenza-AI will analyse your current skills and create a personalised learning path with clear milestones to grow your earning potential.
                </Text>
                <Pressable style={styles.generateBtn} onPress={handleGenerate}>
                  <Sparkles size={17} color={COLORS.card} strokeWidth={2.2} />
                  <Text style={styles.generateBtnText}>Generate my skill path</Text>
                </Pressable>
              </View>
            )}

            {skillGapLoading && (
              <View style={styles.aiLoading}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.aiLoadingText}>Yenza-AI is analysing your skills...</Text>
              </View>
            )}

            {hasAnalysis && !skillGapLoading && (
              <View>
                {/* AI Summary with voice */}
                <View style={styles.aiSummaryCard}>
                  <View style={styles.aiSummaryHeader}>
                    <Text style={styles.aiSummaryLabel}>AI Assessment</Text>
                    <Pressable
                      style={[styles.voiceBtn, speakingId === summarySpeechId && styles.voiceBtnActive]}
                      onPress={() => toggleSpeak(summarySpeechId, skillGapAnalysis!.summary)}
                      hitSlop={10}
                    >
                      {speakingId === summarySpeechId ? (
                        <Square size={15} color={COLORS.card} strokeWidth={2.4} fill={COLORS.card} />
                      ) : (
                        <Volume2 size={16} color={COLORS.accentDark} strokeWidth={2.2} />
                      )}
                    </Pressable>
                  </View>
                  <Text style={styles.aiSummaryText}>{skillGapAnalysis!.summary}</Text>
                </View>

                {/* Milestones */}
                <Text style={styles.milestoneGroupLabel}>Your learning milestones</Text>
                {milestones.map((m, idx) => {
                  const isExpandedM = expandedMilestone === m.id;
                  const statusColor = m.status === 'completed' ? COLORS.success : m.status === 'in_progress' ? COLORS.warning : COLORS.textMuted;
                  const statusLabel = m.status === 'completed' ? 'Completed' : m.status === 'in_progress' ? 'In progress' : 'Not started';
                  const milestoneSpeechId = `m-${m.id}`;
                  return (
                    <View key={m.id} style={[styles.milestoneCard, idx === 0 && styles.milestoneCardTop]}>
                      <Pressable style={styles.milestoneHeader} onPress={() => { setExpandedMilestone(isExpandedM ? null : m.id); if (isExpandedM) stopAllSpeech(); }}>
                        <View style={[styles.milestoneNumber, { backgroundColor: statusColor }]}>
                          {m.status === 'completed' ? <CheckCircle2 size={16} color={COLORS.card} strokeWidth={2.5} /> : <Text style={styles.milestoneNumberText}>{idx + 1}</Text>}
                        </View>
                        <View style={styles.milestoneCopy}>
                          <Text style={styles.milestoneSkill}>{m.skill}</Text>
                          <Text style={styles.milestoneTitle}>{m.title}</Text>
                          <View style={styles.milestoneMetaRow}>
                            <View style={[styles.milestoneStatusBadge, { backgroundColor: statusColor + '1A' }]}>
                              <Text style={[styles.milestoneStatusText, { color: statusColor }]}>{statusLabel}</Text>
                            </View>
                            <View style={styles.milestoneTimeBadge}>
                              <Clock size={11} color={COLORS.textMuted} strokeWidth={2} />
                              <Text style={styles.milestoneTimeText}>{m.estimatedTime}</Text>
                            </View>
                          </View>
                        </View>
                        {isExpandedM ? <ChevronUp size={18} color={COLORS.textMuted} /> : <ChevronDown size={18} color={COLORS.textMuted} />}
                      </Pressable>

                      {isExpandedM && (
                        <View style={styles.milestoneDetail}>
                          <View style={styles.milestoneDescRow}>
                            <Text style={styles.milestoneDesc}>{m.description}</Text>
                            <Pressable
                              style={[styles.voiceBtn, styles.voiceBtnSmall, speakingId === milestoneSpeechId && styles.voiceBtnActive]}
                              onPress={() => toggleSpeak(milestoneSpeechId, buildMilestoneSpeech(m))}
                              hitSlop={10}
                            >
                              {speakingId === milestoneSpeechId ? (
                                <Square size={13} color={COLORS.card} strokeWidth={2.4} fill={COLORS.card} />
                              ) : (
                                <Volume2 size={14} color={COLORS.accentDark} strokeWidth={2.2} />
                              )}
                            </Pressable>
                          </View>

                          {m.prerequisites && m.prerequisites !== 'None — suitable for beginners' && (
                            <View style={styles.prereqBox}>
                              <AlertCircle size={13} color={COLORS.warning} strokeWidth={2} />
                              <Text style={styles.prereqText}>Prerequisites: {m.prerequisites}</Text>
                            </View>
                          )}

                          <Text style={styles.stepsLabel}>Learning steps</Text>
                          {m.steps.map((step, si) => (
                            <View key={si} style={styles.stepRow}>
                              <View style={styles.stepDot}><Text style={styles.stepDotText}>{si + 1}</Text></View>
                              <Text style={styles.stepText}>{step}</Text>
                            </View>
                          ))}

                          {m.resources && m.resources.length > 0 && (
                            <View style={styles.resourcesBox}>
                              <BookOpen size={13} color={COLORS.secondary} strokeWidth={2} />
                              <Text style={styles.resourcesLabel}>Resources: </Text>
                              <Text style={styles.resourcesText}>{m.resources.join(', ')}</Text>
                            </View>
                          )}

                          <Pressable style={[styles.milestoneActionBtn, { borderColor: statusColor }]} onPress={() => cycleMilestoneStatus(m)}>
                            <Text style={[styles.milestoneActionText, { color: statusColor }]}>
                              {m.status === 'pending' ? 'Start this milestone' : m.status === 'in_progress' ? 'Mark as completed' : 'Reset to not started'}
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  );
                })}

                {/* Add milestone button */}
                <Pressable style={styles.addMilestoneBtn} onPress={() => { stopAllSpeech(); setAddModalVisible(true); }}>
                  <Plus size={17} color={COLORS.primary} strokeWidth={2.2} />
                  <Text style={styles.addMilestoneText}>Add another milestone</Text>
                </Pressable>

                {/* Regenerate */}
                <Pressable style={styles.regenerateBtn} onPress={handleGenerate}>
                  <RefreshCw size={14} color={COLORS.textMuted} strokeWidth={2} />
                  <Text style={styles.regenerateText}>Regenerate analysis</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Coverage bar */}
          <View style={styles.coverageCard}>
            <View style={styles.coverageHeader}>
              <Text style={styles.coverageLabel}>Your job demand coverage</Text>
              <Text style={styles.coveragePercent}>{coveragePercent}%</Text>
            </View>
            <View style={styles.coverageBar}>
              <View style={[styles.coverageFill, { width: `${coveragePercent}%` }]} />
            </View>
            <Text style={styles.coverageNote}>
              You currently cover {coveredJobs} of {totalJobs} historical job postings.
            </Text>
          </View>

          {/* Current skills demand */}
          {workerServiceDemand.length > 0 && (
            <View style={styles.currentSkillsSection}>
              <Text style={styles.groupLabel}>Your current skills — market demand</Text>
              {workerServiceDemand.map((d) => (
                <View key={d.service} style={styles.demandRow}>
                  <View style={styles.demandIconBg}>
                    <ServiceIcon category={d.service} size={16} color={COLORS.secondary} />
                  </View>
                  <Text style={styles.demandServiceName}>{d.service}</Text>
                  <View style={styles.demandStats}>
                    {d.openJobs > 0 && (
                      <View style={styles.openJobBadge}>
                        <Text style={styles.openJobText}>{d.openJobs} open</Text>
                      </View>
                    )}
                    <View style={styles.workerBadge}>
                      <Users size={11} color={COLORS.textMuted} strokeWidth={2} />
                      <Text style={styles.workerBadgeText}>{d.workerCount}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Market-based suggestions */}
          <View style={styles.suggestedSection}>
            <Text style={styles.groupLabel}>Market demand — skills to learn next</Text>
            <Text style={styles.groupHint}>Ranked by job demand and low competition</Text>

            {visibleGaps.map((gap, index) => (
              <View key={gap.service} style={[styles.gapCard, index === 0 && styles.topGapCard]}>
                {index === 0 && (
                  <View style={styles.topBadge}>
                    <Sparkles size={10} color={COLORS.card} strokeWidth={2.5} />
                    <Text style={styles.topBadgeText}>Top opportunity</Text>
                  </View>
                )}
                <View style={styles.gapHeader}>
                  <View style={[styles.gapIconBg, index === 0 && styles.gapIconBgTop]}>
                    <ServiceIcon category={gap.service} size={22} color={index === 0 ? COLORS.card : COLORS.secondary} />
                  </View>
                  <View style={styles.gapCopy}>
                    <Text style={styles.gapServiceName}>{gap.service}</Text>
                    <Text style={styles.gapCategory}>{gap.category}</Text>
                  </View>
                  <View style={styles.gapScoreWrap}>
                    {gap.openJobs > 0 ? (
                      <View style={styles.openIndicator}>
                        <Briefcase size={11} color={COLORS.success} strokeWidth={2.2} />
                        <Text style={styles.openIndicatorText}>{gap.openJobs} open now</Text>
                      </View>
                    ) : gap.totalJobs > 0 ? (
                      <View style={styles.historyIndicator}>
                        <Text style={styles.historyText}>{gap.totalJobs} past job{gap.totalJobs === 1 ? '' : 's'}</Text>
                      </View>
                    ) : (
                      <View style={styles.newIndicator}>
                        <Text style={styles.newText}>Emerging</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.gapReason}>{gap.reason}</Text>

                <View style={styles.gapMetrics}>
                  <View style={styles.metric}>
                    <TrendingUp size={13} color={COLORS.success} strokeWidth={2.2} />
                    <Text style={styles.metricLabel}>Demand</Text>
                    <Text style={styles.metricValue}>{gap.demandScore > 0 ? gap.demandScore : 'Low'}</Text>
                  </View>
                  <View style={styles.metric}>
                    <Users size={13} color={COLORS.warning} strokeWidth={2.2} />
                    <Text style={styles.metricLabel}>Competition</Text>
                    <Text style={styles.metricValue}>
                      {gap.workerCount === 0 ? 'None' : `${gap.workerCount} worker${gap.workerCount === 1 ? '' : 's'}`}
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {analysis.length > 3 && (
              <Pressable style={styles.showAllBtn} onPress={() => setShowAll(!showAll)}>
                <Text style={styles.showAllText}>
                  {showAll ? 'Show top 3' : `Show all ${analysis.length} skills`}
                </Text>
                {showAll ? <ChevronUp size={15} color={COLORS.primary} /> : <ChevronDown size={15} color={COLORS.primary} />}
              </Pressable>
            )}
          </View>

          {/* Beginner note */}
          {isBeginner && (
            <View style={styles.beginnerNote}>
              <AlertCircle size={15} color={COLORS.warning} strokeWidth={2.2} />
              <Text style={styles.beginnerText}>
                As someone new to the trade, consider starting with General Work roles to build experience before pursuing skilled services that may require qualifications.
              </Text>
            </View>
          )}

          {/* Skills you already have */}
          <View style={styles.haveSection}>
            <Text style={styles.groupLabel}>Skills you already offer ({workerServices.length})</Text>
            {workerServices.length === 0 ? (
              <Text style={styles.noSkillsText}>No services added yet. Edit your profile to add skills.</Text>
            ) : (
              <View style={styles.haveChips}>
                {workerServices.map((svc) => (
                  <View key={svc} style={styles.haveChip}>
                    <CheckCircle2 size={13} color={COLORS.success} strokeWidth={2.2} />
                    <Text style={styles.haveChipText}>{svc}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Add Milestone Modal */}
      <Modal visible={addModalVisible} transparent animationType="fade" onRequestClose={() => setAddModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Target size={20} color={COLORS.primary} strokeWidth={2.2} />
                <Text style={styles.modalTitle}>Add a skill milestone</Text>
              </View>
              <Pressable onPress={() => setAddModalVisible(false)} hitSlop={12}>
                <X size={20} color={COLORS.textMuted} strokeWidth={2.2} />
              </Pressable>
            </View>

            <Text style={styles.modalDesc}>
              Pick a skill you want to learn. Yenza-AI will create a step-by-step milestone with guidance on how to get there.
            </Text>

            <Text style={styles.modalLabel}>Choose a skill</Text>
            <ScrollView style={styles.skillPickerScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.skillPickerGrid}>
                {skillsForAdd.map((skill) => (
                  <Pressable
                    key={skill}
                    style={[styles.skillPickerChip, selectedSkill === skill && styles.skillPickerChipSelected]}
                    onPress={() => { setSelectedSkill(skill); setAddError(''); }}
                  >
                    <Text style={[styles.skillPickerChipText, selectedSkill === skill && styles.skillPickerChipTextSelected]}>{skill}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Text style={styles.modalLabel}>Or type a custom skill</Text>
            <TextInput
              style={styles.modalInput}
              value={selectedSkill}
              onChangeText={(v) => { setSelectedSkill(v); setAddError(''); }}
              placeholder="e.g. Appliance Repair"
              placeholderTextColor={COLORS.textMuted}
            />

            {addError ? <Text style={styles.modalError}>{addError}</Text> : null}

            <Pressable style={[styles.modalSubmitBtn, skillGapLoading && styles.modalSubmitBtnDisabled]} onPress={handleAddMilestone} disabled={skillGapLoading}>
              {skillGapLoading ? (
                <ActivityIndicator size="small" color={COLORS.card} />
              ) : (
                <>
                  <Sparkles size={17} color={COLORS.card} strokeWidth={2.2} />
                  <Text style={styles.modalSubmitText}>Generate milestone with AI</Text>
                </>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: SPACING.sm + 2 },
  headerPress: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerIconBg: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EAF7F2', alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1 },
  title: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.text },
  subtitle: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, marginTop: 2 },
  detailSection: { marginTop: SPACING.md },
  // AI section
  aiSection: { backgroundColor: '#F5F0FF' + '40', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.accent + '30', padding: SPACING.md, marginBottom: SPACING.md },
  aiHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  aiHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  aiBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: COLORS.accentDark, alignItems: 'center', justifyContent: 'center' },
  aiTitle: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.accentDark },
  langToggle: { flexDirection: 'row', backgroundColor: COLORS.card, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, padding: 2 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  langBtnActive: { backgroundColor: COLORS.accentDark },
  langBtnText: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted },
  langBtnTextActive: { color: COLORS.card, fontFamily: FONTS.semiBold },
  aiEmpty: { alignItems: 'center', paddingVertical: SPACING.md },
  aiEmptyTitle: { fontFamily: FONTS.semiBold, fontSize: 15, color: COLORS.text, marginTop: SPACING.sm },
  aiEmptyText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, textAlign: 'center', lineHeight: 19, marginTop: SPACING.xs + 1, marginBottom: SPACING.md },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: COLORS.accentDark, borderRadius: RADIUS.md, paddingVertical: SPACING.sm + 3, paddingHorizontal: SPACING.lg },
  generateBtnText: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.card },
  aiLoading: { alignItems: 'center', paddingVertical: SPACING.lg },
  aiLoadingText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, marginTop: SPACING.sm },
  aiSummaryCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md },
  aiSummaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  aiSummaryLabel: { fontFamily: FONTS.semiBold, fontSize: 11, color: COLORS.accentDark, textTransform: 'uppercase', letterSpacing: 0.5 },
  aiSummaryText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text, lineHeight: 20 },
  voiceBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.accent + '25', alignItems: 'center', justifyContent: 'center' },
  voiceBtnSmall: { width: 26, height: 26, borderRadius: 13 },
  voiceBtnActive: { backgroundColor: COLORS.accentDark },
  milestoneGroupLabel: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text, marginBottom: SPACING.sm },
  milestoneCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  milestoneCardTop: { borderColor: COLORS.accentDark, borderWidth: 1.5 },
  milestoneHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, padding: SPACING.md },
  milestoneNumber: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  milestoneNumberText: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.card },
  milestoneCopy: { flex: 1 },
  milestoneSkill: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  milestoneTitle: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 1 },
  milestoneMetaRow: { flexDirection: 'row', gap: 6, marginTop: 5 },
  milestoneStatusBadge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  milestoneStatusText: { fontFamily: FONTS.semiBold, fontSize: 10 },
  milestoneTimeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.background, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  milestoneTimeText: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.textMuted },
  milestoneDetail: { padding: SPACING.md, paddingTop: 0 },
  milestoneDescRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.xs + 1, marginBottom: SPACING.sm },
  milestoneDesc: { flex: 1, fontFamily: FONTS.regular, fontSize: 13, color: COLORS.text, lineHeight: 19 },
  prereqBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.warning + '12', borderRadius: 8, padding: 8, marginBottom: SPACING.sm },
  prereqText: { flex: 1, fontFamily: FONTS.medium, fontSize: 12, color: COLORS.warning, lineHeight: 17 },
  stepsLabel: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.text, marginBottom: SPACING.xs + 1 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 7 },
  stepDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.accent + '20', alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepDotText: { fontFamily: FONTS.bold, fontSize: 10, color: COLORS.accentDark },
  stepText: { flex: 1, fontFamily: FONTS.regular, fontSize: 12, color: COLORS.text, lineHeight: 17 },
  resourcesBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#EAF7F2', borderRadius: 8, padding: 8, marginTop: SPACING.sm, marginBottom: SPACING.sm },
  resourcesLabel: { fontFamily: FONTS.semiBold, fontSize: 11, color: COLORS.secondary },
  resourcesText: { flex: 1, fontFamily: FONTS.regular, fontSize: 11, color: COLORS.text, lineHeight: 16 },
  milestoneActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderRadius: RADIUS.md, paddingVertical: SPACING.sm, marginTop: SPACING.xs },
  milestoneActionText: { fontFamily: FONTS.semiBold, fontSize: 13 },
  addMilestoneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.primary + '40', borderRadius: RADIUS.md, paddingVertical: SPACING.sm + 2, borderStyle: 'dashed', marginBottom: SPACING.sm },
  addMilestoneText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.primary },
  regenerateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: SPACING.xs + 1 },
  regenerateText: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted },
  errorText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.error, marginBottom: SPACING.sm, lineHeight: 18 },
  // Coverage
  coverageCard: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  coverageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  coverageLabel: { fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
  coveragePercent: { fontFamily: FONTS.bold, fontSize: 22, color: COLORS.primary },
  coverageBar: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginBottom: SPACING.sm },
  coverageFill: { height: 8, backgroundColor: COLORS.primary, borderRadius: 4 },
  coverageNote: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, lineHeight: 17 },
  // Current skills
  currentSkillsSection: { marginBottom: SPACING.md },
  groupLabel: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text, marginBottom: SPACING.xs + 1 },
  groupHint: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.sm, marginTop: -2 },
  demandRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  demandIconBg: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#EAF7F2', alignItems: 'center', justifyContent: 'center' },
  demandServiceName: { flex: 1, fontFamily: FONTS.medium, fontSize: 13, color: COLORS.text },
  demandStats: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  openJobBadge: { backgroundColor: COLORS.success + '1A', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  openJobText: { fontFamily: FONTS.semiBold, fontSize: 10, color: COLORS.success },
  workerBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.card, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: COLORS.border },
  workerBadgeText: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.textMuted },
  // Suggested
  suggestedSection: { marginBottom: SPACING.md },
  gapCard: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, position: 'relative' },
  topGapCard: { borderColor: COLORS.secondary, borderWidth: 1.5, backgroundColor: '#EAF7F2' },
  topBadge: { position: 'absolute', top: -8, right: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.secondary, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  topBadgeText: { fontFamily: FONTS.semiBold, fontSize: 9, color: COLORS.card },
  gapHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  gapIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EAF7F2', alignItems: 'center', justifyContent: 'center' },
  gapIconBgTop: { backgroundColor: COLORS.secondary },
  gapCopy: { flex: 1 },
  gapServiceName: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  gapCategory: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  gapScoreWrap: { alignItems: 'flex-end' },
  openIndicator: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.success + '1A', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  openIndicatorText: { fontFamily: FONTS.semiBold, fontSize: 10, color: COLORS.success },
  historyIndicator: { backgroundColor: COLORS.textMuted + '1A', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  historyText: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.textMuted },
  newIndicator: { backgroundColor: COLORS.accent + '30', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  newText: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.accentDark },
  gapReason: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.text, lineHeight: 17, marginTop: SPACING.sm },
  gapMetrics: { flexDirection: 'row', gap: SPACING.lg, marginTop: SPACING.sm },
  metric: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metricLabel: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted },
  metricValue: { fontFamily: FONTS.semiBold, fontSize: 11, color: COLORS.text },
  showAllBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: SPACING.sm, marginTop: SPACING.xs },
  showAllText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.primary },
  // Beginner
  beginnerNote: { flexDirection: 'row', gap: SPACING.sm, backgroundColor: COLORS.warning + '12', borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  beginnerText: { flex: 1, fontFamily: FONTS.regular, fontSize: 12, color: COLORS.text, lineHeight: 17 },
  // Have
  haveSection: { marginTop: SPACING.xs },
  noSkillsText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, lineHeight: 18 },
  haveChips: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs + 2 },
  haveChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.success + '12', borderRadius: RADIUS.xl, paddingHorizontal: SPACING.sm + 2, paddingVertical: 5, borderWidth: 1, borderColor: COLORS.success + '30' },
  haveChipText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.text },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.lg },
  modalCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: SPACING.lg, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  modalHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  modalTitle: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.text },
  modalDesc: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, lineHeight: 19, marginBottom: SPACING.md },
  modalLabel: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text, marginBottom: SPACING.xs + 1 },
  skillPickerScroll: { maxHeight: 140, marginBottom: SPACING.md },
  skillPickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs + 2 },
  skillPickerChip: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  skillPickerChipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  skillPickerChipText: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textMuted },
  skillPickerChipTextSelected: { color: COLORS.card },
  modalInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.sm, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text, backgroundColor: COLORS.background, marginBottom: SPACING.sm },
  modalError: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.error, marginBottom: SPACING.sm, lineHeight: 18 },
  modalSubmitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: COLORS.accentDark, borderRadius: RADIUS.md, paddingVertical: SPACING.sm + 3 },
  modalSubmitBtnDisabled: { opacity: 0.5 },
  modalSubmitText: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.card },
});
