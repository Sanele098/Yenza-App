import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  Image as ImageIcon,
  Lightbulb,
  MessageCircle,
  Mic,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UserRound,
  Volume2,
  Wrench,
  X,
} from 'lucide-react-native';
import { useDrawer } from '@/context/DrawerContext';
import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';
import { COLORS, FONTS, RADIUS, SPACING } from '@/constants/theme';
import type { AiConfidence, AiConversationRow, AiDiagnosis, AiDiagnosisRow, AiLanguage, AiMode, AiTool } from '@/types/ai';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

function confidenceColor(c: AiConfidence): string {
  if (c === 'high') return COLORS.success;
  if (c === 'medium') return COLORS.warning;
  return COLORS.error;
}

function confidenceLabel(c: AiConfidence): string {
  if (c === 'high') return 'High confidence';
  if (c === 'medium') return 'Medium confidence';
  return 'Low confidence — verify before proceeding';
}

function imageToBase64(uri: string): Promise<string> {
  return fetch(uri)
    .then((res) => res.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );
}

function rowToDiagnosis(row: AiDiagnosisRow): AiDiagnosis {
  return {
    problemTitle: row.problem_title,
    explanation: row.explanation,
    safetyWarning: row.safety_warning,
    needsProfessional: row.needs_professional,
    tools: (row.tools ?? []).map((t) => ({ ...t, hasIt: false })),
    steps: (row.steps ?? []).map((s) => ({ ...s, completed: false })),
    estimatedTime: row.estimated_time,
    estimatedCost: row.estimated_cost,
    confidence: row.confidence,
  };
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function YenzaAiScreen() {
  const { openDrawer } = useDrawer();
  const { availableJobs } = useApp();

  const [view, setView] = useState<'new' | 'history'>('new');
  const [mode, setMode] = useState<AiMode>('do');
  const [language, setLanguage] = useState<AiLanguage>('en');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<AiDiagnosis | null>(null);
  const [diagnosisId, setDiagnosisId] = useState<string | null>(null);
  const [diagnosisMode, setDiagnosisMode] = useState<AiMode>('do');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [tools, setTools] = useState<AiTool[]>([]);
  const [speakingStep, setSpeakingStep] = useState<number | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [askDraft, setAskDraft] = useState('');
  const [askLoading, setAskLoading] = useState(false);
  const [conversation, setConversation] = useState<AiConversationRow[]>([]);
  const [history, setHistory] = useState<AiDiagnosisRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const selectedJob = availableJobs.find((j) => j.id === selectedJobId) ?? null;
  const activeLanguage = diagnosis ? language : language;
  const activeMode = diagnosis ? diagnosisMode : mode;

  useEffect(() => {
    return () => { Speech.stop(); };
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('ai_diagnoses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!err && data) setHistory(data as AiDiagnosisRow[]);
    } catch { /* ignore */ }
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (view === 'history' && history.length === 0) loadHistory();
  }, [view]);

  const loadConversation = async (diagId: string) => {
    try {
      const { data } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('diagnosis_id', diagId)
        .order('created_at', { ascending: true });
      if (data) setConversation(data as AiConversationRow[]);
    } catch { /* ignore */ }
  };

  const choosePhoto = async (fromCamera: boolean) => {
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    setPhotoUri(result.assets[0].uri);
  };

  const runDiagnosis = async () => {
    if (!description.trim()) { setError('Please describe the problem first.'); return; }
    setError(null);
    setLoading(true);
    setDiagnosis(null);
    setCurrentStep(0);
    setConversation([]);

    try {
      let imageData: string | undefined;
      if (photoUri) imageData = await imageToBase64(photoUri);

      const res = await fetch(`${SUPABASE_URL}/functions/v1/yenza-ai`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          imageData,
          description: description.trim(),
          jobTitle: selectedJob?.title,
          jobCategory: selectedJob?.category,
          jobId: selectedJobId ?? undefined,
          mode,
          language,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }

      const data = await res.json();
      const diag = data as AiDiagnosis & { id?: string };
      const withTools = (diag.tools ?? []).map((t) => ({ ...t, hasIt: false }));
      const withSteps = (diag.steps ?? []).map((s) => ({ ...s, completed: false }));
      setDiagnosis({ ...diag, tools: withTools, steps: withSteps });
      setTools(withTools);
      setDiagnosisId(diag.id ?? null);
      setDiagnosisMode(mode);
      if (diag.id) loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not get a diagnosis. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openHistoryItem = (row: AiDiagnosisRow) => {
    Speech.stop();
    setSpeakingStep(null);
    const diag = rowToDiagnosis(row);
    setDiagnosis(diag);
    setTools(diag.tools);
    setDiagnosisId(row.id);
    setDiagnosisMode(row.mode);
    setLanguage(row.language);
    setCurrentStep(0);
    setPhotoUri(null);
    setDescription(row.description);
    setAskOpen(false);
    setAskDraft('');
    setConversation([]);
    loadConversation(row.id);
    setView('new');
  };

  const speak = (text: string, stepIndex: number) => {
    if (speakingStep === stepIndex) { Speech.stop(); setSpeakingStep(null); return; }
    Speech.stop();
    setSpeakingStep(stepIndex);
    Speech.speak(text, {
      language: activeLanguage === 'zu' ? 'zu-ZA' : 'en-ZA',
      onDone: () => setSpeakingStep(null),
      onStopped: () => setSpeakingStep(null),
    });
  };

  const toggleTool = (index: number) => {
    setTools((prev) => prev.map((t, i) => (i === index ? { ...t, hasIt: !t.hasIt } : t)));
  };

  const markStepDone = (index: number) => {
    if (!diagnosis) return;
    setDiagnosis({
      ...diagnosis,
      steps: diagnosis.steps.map((s, i) => (i === index ? { ...s, completed: !s.completed } : s)),
    });
  };

  const nextStep = () => {
    if (!diagnosis) return;
    if (currentStep < diagnosis.steps.length - 1) {
      setCurrentStep(currentStep + 1);
      Speech.stop();
      setSpeakingStep(null);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) { setCurrentStep(currentStep - 1); Speech.stop(); setSpeakingStep(null); }
  };

  const resetAll = () => {
    Speech.stop();
    setSpeakingStep(null);
    setDiagnosis(null);
    setDiagnosisId(null);
    setPhotoUri(null);
    setDescription('');
    setError(null);
    setCurrentStep(0);
    setTools([]);
    setAskOpen(false);
    setAskDraft('');
    setConversation([]);
  };

  const askQuestion = async () => {
    if (!askDraft.trim() || !diagnosis || !diagnosisId) return;
    setAskLoading(true);
    const questionText = askDraft.trim();
    setAskDraft('');

    const optimisticRow: AiConversationRow = {
      id: `temp-${Date.now()}`,
      diagnosis_id: diagnosisId,
      worker_id: '',
      role: 'worker',
      message: questionText,
      created_at: new Date().toISOString(),
    };
    setConversation((prev) => [...prev, optimisticRow]);

    try {
      const context = `Problem: ${diagnosis.problemTitle}. ${diagnosis.explanation} Steps: ${diagnosis.steps.map((s) => s.title).join(', ')}`;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/yenza-ai/ask`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({ diagnosisId, question: questionText, context, language: activeLanguage }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Could not get an answer');
      }
      const data = await res.json();
      const aiRow: AiConversationRow = {
        id: `temp-ai-${Date.now()}`,
        diagnosis_id: diagnosisId,
        worker_id: '',
        role: 'ai',
        message: data.answer,
        created_at: new Date().toISOString(),
      };
      setConversation((prev) => [...prev, aiRow]);
      loadConversation(diagnosisId);
    } catch {
      setConversation((prev) => prev.filter((m) => m.id !== optimisticRow.id));
      setConversation((prev) => [...prev, {
        id: `err-${Date.now()}`, diagnosis_id: diagnosisId, worker_id: '', role: 'ai',
        message: 'Sorry, I could not answer that right now. Please try again.',
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setAskLoading(false);
    }
  };

  const allToolsChecked = tools.length > 0 && tools.every((t) => t.hasIt);
  const step = diagnosis?.steps[currentStep];
  const completedCount = diagnosis?.steps.filter((s) => s.completed).length ?? 0;
  const allDone = diagnosis !== null && completedCount === diagnosis.steps.length;

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIdentity}>
            <View style={styles.sparkleMark}><Sparkles size={25} color={COLORS.primary} strokeWidth={2.4} /></View>
            <View><Text style={styles.title}>Yenza-AI</Text><Text style={styles.subtitle}>Your digital supervisor</Text></View>
          </View>
          <Pressable style={styles.profileButton} onPress={openDrawer} hitSlop={8}><UserRound size={22} color={COLORS.primary} strokeWidth={2.1} /></Pressable>
        </View>

        {/* View toggle: New vs History */}
        {!diagnosis && (
          <View style={styles.viewToggle}>
            <Pressable style={[styles.viewTab, view === 'new' && styles.viewTabActive]} onPress={() => setView('new')}>
              <Stethoscope size={16} color={view === 'new' ? COLORS.card : COLORS.textMuted} strokeWidth={2.2} />
              <Text style={[styles.viewTabText, view === 'new' && styles.viewTabTextActive]}>New diagnosis</Text>
            </Pressable>
            <Pressable style={[styles.viewTab, view === 'history' && styles.viewTabActive]} onPress={() => { setView('history'); loadHistory(); }}>
              <Clock size={16} color={view === 'history' ? COLORS.card : COLORS.textMuted} strokeWidth={2.2} />
              <Text style={[styles.viewTabText, view === 'history' && styles.viewTabTextActive]}>History</Text>
              {history.length > 0 && <View style={styles.historyBadge}><Text style={styles.historyBadgeText}>{history.length}</Text></View>}
            </Pressable>
          </View>
        )}

        {/* HISTORY VIEW */}
        {view === 'history' && !diagnosis && (
          <View>
            {historyLoading ? (
              <View style={styles.loadingCard}><ActivityIndicator size="large" color={COLORS.primary} /><Text style={styles.loadingText}>Loading your past diagnoses...</Text></View>
            ) : history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Clock size={40} color={COLORS.textMuted} strokeWidth={1.5} />
                <Text style={styles.emptyHistoryTitle}>No diagnoses yet</Text>
                <Text style={styles.emptyHistoryText}>Your past AI diagnoses will appear here so you can revisit them without asking again.</Text>
                <Pressable style={styles.emptyHistoryBtn} onPress={() => setView('new')}>
                  <Text style={styles.emptyHistoryBtnText}>Start a new diagnosis</Text>
                </Pressable>
              </View>
            ) : (
              history.map((row) => (
                <Pressable key={row.id} style={styles.historyCard} onPress={() => openHistoryItem(row)}>
                  <View style={styles.historyCardLeft}>
                    <View style={[styles.historyModeBadge, row.mode === 'learn' ? styles.historyModeLearn : styles.historyModeDo]}>
                      {row.mode === 'learn' ? <Lightbulb size={14} color={COLORS.card} strokeWidth={2.2} /> : <Wrench size={14} color={COLORS.card} strokeWidth={2.2} />}
                      <Text style={styles.historyModeText}>{row.mode === 'learn' ? 'Learn' : 'Do'}</Text>
                    </View>
                    {row.needs_professional && <View style={styles.historyProBadge}><AlertTriangle size={12} color={COLORS.error} strokeWidth={2.2} /><Text style={styles.historyProText}>Pro</Text></View>}
                  </View>
                  <View style={styles.historyCardContent}>
                    <Text style={styles.historyCardTitle}>{row.problem_title}</Text>
                    <Text style={styles.historyCardDesc} numberOfLines={2}>{row.description}</Text>
                    <View style={styles.historyCardMeta}>
                      <View style={[styles.historyConfDot, { backgroundColor: confidenceColor(row.confidence) }]} />
                      <Text style={styles.historyCardDate}>{formatDate(row.created_at)}</Text>
                      <View style={styles.historyStepsInfo}>
                        <CheckCircle2 size={13} color={COLORS.success} strokeWidth={2} />
                        <Text style={styles.historyStepsText}>{row.steps?.length ?? 0} steps</Text>
                      </View>
                    </View>
                  </View>
                  <ChevronRight size={19} color={COLORS.textMuted} strokeWidth={2} />
                </Pressable>
              ))
            )}
          </View>
        )}

        {/* NEW DIAGNOSIS VIEW */}
        {view === 'new' && !diagnosis && (
          <>
            {/* Mode + Language toggles */}
            <View style={styles.configRow}>
              <View style={styles.toggleGroup}>
                <Pressable style={[styles.toggleBtn, mode === 'do' && styles.toggleActive]} onPress={() => setMode('do')}>
                  <Wrench size={16} color={mode === 'do' ? COLORS.card : COLORS.textMuted} strokeWidth={2.2} />
                  <Text style={[styles.toggleText, mode === 'do' && styles.toggleTextActive]}>Do mode</Text>
                </Pressable>
                <Pressable style={[styles.toggleBtn, mode === 'learn' && styles.toggleActive]} onPress={() => setMode('learn')}>
                  <Lightbulb size={16} color={mode === 'learn' ? COLORS.card : COLORS.textMuted} strokeWidth={2.2} />
                  <Text style={[styles.toggleText, mode === 'learn' && styles.toggleTextActive]}>Learn mode</Text>
                </Pressable>
              </View>
              <View style={styles.langGroup}>
                <Pressable style={[styles.langBtn, language === 'en' && styles.langActive]} onPress={() => setLanguage('en')}>
                  <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
                </Pressable>
                <Pressable style={[styles.langBtn, language === 'zu' && styles.langActive]} onPress={() => setLanguage('zu')}>
                  <Text style={[styles.langText, language === 'zu' && styles.langTextActive]}>ZU</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.modeHint}>
              {mode === 'do'
                ? language === 'zu'
                  ? 'Ngekathesi: Yenza-AI izokuhola izinyathelo ngezinyathelo ukuba uqedise umsebenzi wangempela.'
                  : 'Do mode: Yenza-AI will guide you step by step through a real job you are working on.'
                : language === 'zu'
                  ? 'Ikhasi: Yenza-AI izokufundisa indlela yokwenza umsebenzi, okuhlanganisa amathuluzi nobuciko.'
                  : 'Learn mode: Yenza-AI will teach you the skill, including tools, techniques, and why each step matters.'}
            </Text>

            {/* Job selector */}
            {availableJobs.length > 0 && (
              <View style={styles.jobSelector}>
                <Text style={styles.jobSelectorLabel}>Linked job (optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobChips}>
                  <Pressable style={[styles.jobChip, !selectedJobId && styles.jobChipActive]} onPress={() => setSelectedJobId(null)}>
                    <Text style={[styles.jobChipText, !selectedJobId && styles.jobChipTextActive]}>No specific job</Text>
                  </Pressable>
                  {availableJobs.map((job) => (
                    <Pressable key={job.id} style={[styles.jobChip, selectedJobId === job.id && styles.jobChipActive]} onPress={() => setSelectedJobId(job.id)}>
                      <Text style={[styles.jobChipText, selectedJobId === job.id && styles.jobChipTextActive]}>{job.title}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Input section */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>{language === 'zu' ? 'Chaza inkinga' : 'Describe the problem'}</Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder={language === 'zu' ? 'Isibonelo: Ipayipi ngaphansi kwesinki liyaphuma amanzi.' : 'Example: The pipe under the kitchen sink is leaking.'}
                placeholderTextColor={COLORS.textMuted}
                multiline numberOfLines={3} textAlignVertical="top"
              />

              <Text style={styles.inputLabel}>{language === 'zu' ? 'Faka isithombe (kukhethwa)' : 'Add a photo (optional)'}</Text>
              <View style={styles.photoActions}>
                <Pressable style={styles.photoBtn} onPress={() => choosePhoto(false)}>
                  <ImageIcon size={20} color={COLORS.primary} strokeWidth={2} />
                  <Text style={styles.photoBtnText}>Gallery</Text>
                </Pressable>
                <Pressable style={styles.photoBtn} onPress={() => choosePhoto(true)}>
                  <Camera size={20} color={COLORS.primary} strokeWidth={2} />
                  <Text style={styles.photoBtnText}>Camera</Text>
                </Pressable>
              </View>

              {photoUri && (
                <View style={styles.photoPreviewWrap}>
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} resizeMode="cover" />
                  <Pressable style={styles.photoRemove} onPress={() => setPhotoUri(null)}>
                    <X size={16} color={COLORS.card} strokeWidth={2.5} />
                  </Pressable>
                </View>
              )}

              {error && (
                <View style={styles.errorBanner}>
                  <AlertTriangle size={17} color={COLORS.error} strokeWidth={2.2} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <Pressable style={[styles.diagnoseBtn, loading && styles.diagnoseBtnDisabled]} onPress={runDiagnosis} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color={COLORS.card} /> : (
                  <>
                    <Stethoscope size={20} color={COLORS.card} strokeWidth={2.2} />
                    <Text style={styles.diagnoseBtnText}>{language === 'zu' ? 'Hlolisisa inkinga' : 'Diagnose the problem'}</Text>
                  </>
                )}
              </Pressable>
            </View>
          </>
        )}

        {/* Loading */}
        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>{activeLanguage === 'zu' ? 'Yenza-AI ihlola isithombe sakho...' : 'Yenza-AI is analysing your problem...'}</Text>
          </View>
        )}

        {/* Diagnosis result */}
        {diagnosis && !loading && (
          <View>
            <View style={styles.diagnosisHeader}>
              <View style={styles.diagnosisHeaderLeft}>
                <View style={styles.diagnosisBadge}><Stethoscope size={16} color={COLORS.primary} strokeWidth={2.2} /></View>
                <View>
                  <Text style={styles.diagnosisLabel}>{activeMode === 'learn' ? 'Learn guide' : 'Diagnosis'}</Text>
                  <Text style={styles.diagnosisProblemTitle}>{diagnosis.problemTitle}</Text>
                </View>
              </View>
              <Pressable style={styles.resetBtn} onPress={resetAll}><RefreshCw size={18} color={COLORS.textMuted} strokeWidth={2} /></Pressable>
            </View>

            {photoUri && <Image source={{ uri: photoUri }} style={styles.diagnosisPhoto} resizeMode="cover" />}

            <View style={styles.confidenceRow}>
              <View style={[styles.confidenceDot, { backgroundColor: confidenceColor(diagnosis.confidence) }]} />
              <Text style={[styles.confidenceText, { color: confidenceColor(diagnosis.confidence) }]}>{confidenceLabel(diagnosis.confidence)}</Text>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{activeLanguage === 'zu' ? 'Inkinga yini' : 'What may be wrong'}</Text>
              <Text style={styles.explanationText}>{diagnosis.explanation}</Text>
            </View>

            <View style={[styles.safetyCard, diagnosis.needsProfessional && styles.safetyCardDanger]}>
              <View style={styles.safetyHeader}>
                <ShieldCheck size={20} color={diagnosis.needsProfessional ? COLORS.error : COLORS.warning} strokeWidth={2.2} />
                <Text style={[styles.safetyTitle, { color: diagnosis.needsProfessional ? COLORS.error : COLORS.warning }]}>
                  {diagnosis.needsProfessional
                    ? activeLanguage === 'zu' ? 'Kudinga umuntu oqeqeshiwe' : 'Needs a qualified professional'
                    : activeLanguage === 'zu' ? 'Qaphela ukuphepha' : 'Safety first'}
                </Text>
              </View>
              <Text style={styles.safetyText}>{diagnosis.safetyWarning}</Text>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>{activeLanguage === 'zu' ? 'Isikhathi' : 'Est. time'}</Text>
                <Text style={styles.metaValue}>{diagnosis.estimatedTime}</Text>
              </View>
              <View style={styles.metaCard}>
                <Text style={styles.metaLabel}>{activeLanguage === 'zu' ? 'Izindleko' : 'Est. cost'}</Text>
                <Text style={styles.metaValue}>{diagnosis.estimatedCost}</Text>
              </View>
            </View>

            {/* Tools */}
            <View style={styles.sectionCard}>
              <View style={styles.toolsHeader}>
                <ClipboardList size={19} color={COLORS.primary} strokeWidth={2.2} />
                <Text style={styles.sectionTitle}>{activeLanguage === 'zu' ? 'Amathuluzi adingekayo' : 'Tools & materials'}</Text>
              </View>
              <Text style={styles.toolsHint}>{activeLanguage === 'zu' ? 'Khetha okuname okulawo.' : 'Tick what you already have.'}</Text>
              {tools.map((tool, i) => (
                <Pressable key={i} style={styles.toolRow} onPress={() => toggleTool(i)}>
                  <View style={[styles.toolCheckbox, tool.hasIt && styles.toolCheckboxChecked]}>
                    {tool.hasIt && <Check size={15} color={COLORS.card} strokeWidth={3} />}
                  </View>
                  <Text style={styles.toolName}>{tool.name}</Text>
                  {tool.essential && <Text style={styles.essentialBadge}>Required</Text>}
                </Pressable>
              ))}
              {tools.length > 0 && (
                <Text style={[styles.toolsStatus, allToolsChecked ? styles.toolsStatusOk : styles.toolsStatusMissing]}>
                  {allToolsChecked
                    ? activeLanguage === 'zu' ? 'Unayo yonke izinto!' : 'You have everything you need!'
                    : activeLanguage === 'zu' ? 'Udinga amathuluzi amanye' : 'Some tools still needed'}
                </Text>
              )}
            </View>

            {/* Steps */}
            <View style={styles.sectionCard}>
              <View style={styles.stepsHeader}>
                <Text style={styles.sectionTitle}>{activeLanguage === 'zu' ? 'Izinyathelo zakho' : 'Your guided steps'}</Text>
                <Text style={styles.stepCounter}>{completedCount}/{diagnosis.steps.length} done</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(completedCount / diagnosis.steps.length) * 100}%` }]} />
              </View>

              {step && (
                <View style={styles.stepCard}>
                  <View style={styles.stepHeader}>
                    <View style={[styles.stepNumber, step.completed && styles.stepNumberDone]}>
                      {step.completed ? <Check size={17} color={COLORS.card} strokeWidth={3} /> : <Text style={styles.stepNumberText}>{currentStep + 1}</Text>}
                    </View>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                  </View>
                  <Text style={styles.stepInstruction}>{step.instruction}</Text>

                  {step.safetyNote && (
                    <View style={styles.stepSafety}>
                      <AlertTriangle size={14} color={COLORS.warning} strokeWidth={2} />
                      <Text style={styles.stepSafetyText}>{step.safetyNote}</Text>
                    </View>
                  )}

                  <View style={styles.stepActions}>
                    <Pressable style={styles.stepActionBtn} onPress={() => speak(`${step.title}. ${step.instruction}${step.safetyNote ? `. ${step.safetyNote}` : ''}`, currentStep)}>
                      <Volume2 size={17} color={speakingStep === currentStep ? COLORS.primary : COLORS.textMuted} strokeWidth={2.2} />
                      <Text style={[styles.stepActionText, { color: speakingStep === currentStep ? COLORS.primary : COLORS.textMuted }]}>
                        {speakingStep === currentStep ? 'Stop' : 'Listen'}
                      </Text>
                    </Pressable>
                    <Pressable style={[styles.stepActionBtn, styles.stepDoneBtn, step.completed && styles.stepDoneBtnActive]} onPress={() => markStepDone(currentStep)}>
                      <CheckCircle2 size={17} color={step.completed ? COLORS.card : COLORS.success} strokeWidth={2.2} />
                      <Text style={[styles.stepActionText, { color: step.completed ? COLORS.card : COLORS.success }]}>
                        {step.completed ? 'Done' : 'Mark done'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              <View style={styles.stepNav}>
                <Pressable style={[styles.navBtn, currentStep === 0 && styles.navBtnDisabled]} onPress={prevStep} disabled={currentStep === 0}>
                  <Text style={styles.navBtnText}>Back</Text>
                </Pressable>
                {currentStep < diagnosis.steps.length - 1 ? (
                  <Pressable style={styles.navBtnPrimary} onPress={nextStep}>
                    <Text style={styles.navBtnPrimaryText}>Next step</Text>
                    <ArrowRight size={17} color={COLORS.card} strokeWidth={2.2} />
                  </Pressable>
                ) : (
                  <Pressable style={[styles.navBtnPrimary, !allDone && styles.navBtnDisabled]} onPress={resetAll}>
                    <Text style={styles.navBtnPrimaryText}>Finish</Text>
                    <CheckCircle2 size={17} color={COLORS.card} strokeWidth={2.2} />
                  </Pressable>
                )}
              </View>
            </View>

            {allDone && (
              <View style={styles.completionBanner}>
                <CheckCircle2 size={28} color={COLORS.success} strokeWidth={2} />
                <Text style={styles.completionTitle}>{activeLanguage === 'zu' ? 'Uqedile wonke amanyathelo!' : 'All steps completed!'}</Text>
                <Text style={styles.completionText}>
                  {activeLanguage === 'zu'
                    ? 'Sicela ulande isithombe ukuqinisekisa ukuthi kusemandleni, noma biza umuntu oqeqeshiwe uma kudingeka.'
                    : 'Upload a follow-up photo to verify the result, or call a qualified professional if needed.'}
                </Text>
              </View>
            )}

            {/* Ask Yenza-AI with conversation history */}
            <Pressable style={styles.askButton} onPress={() => setAskOpen(!askOpen)}>
              <MessageCircle size={20} color={COLORS.card} strokeWidth={2.2} />
              <Text style={styles.askButtonText}>{activeLanguage === 'zu' ? 'Buza i-Yenza-AI' : 'Ask Yenza-AI a question'}</Text>
              {conversation.length > 0 && <View style={styles.convBadge}><Text style={styles.convBadgeText}>{conversation.length}</Text></View>}
              <ChevronRight size={19} color={COLORS.card} strokeWidth={2} style={{ transform: [{ rotate: askOpen ? '90deg' : '0deg' }] }} />
            </Pressable>

            {askOpen && (
              <View style={styles.askPanel}>
                {/* Conversation history */}
                {conversation.length > 0 && (
                  <View style={styles.convList}>
                    {conversation.map((msg) => (
                      <View key={msg.id} style={[styles.convMsg, msg.role === 'worker' ? styles.convMsgWorker : styles.convMsgAi]}>
                        {msg.role === 'ai' && <Volume2 size={15} color={COLORS.primary} strokeWidth={2} style={styles.convMsgIcon} />}
                        <Text style={styles.convMsgText}>{msg.message}</Text>
                        {msg.role === 'ai' && (
                          <Pressable style={styles.convSpeakBtn} onPress={() => speak(msg.message, -1)}>
                            <Volume2 size={14} color={speakingStep === -1 ? COLORS.primary : COLORS.textMuted} strokeWidth={2} />
                          </Pressable>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Composer */}
                <View style={styles.askComposer}>
                  <TextInput
                    style={styles.askInput}
                    value={askDraft}
                    onChangeText={setAskDraft}
                    placeholder={activeLanguage === 'zu' ? 'Buzisisa ngenkinga...' : 'Ask about the problem...'}
                    placeholderTextColor={COLORS.textMuted}
                  />
                  <Pressable style={[styles.askSend, (!askDraft.trim() || askLoading) && styles.navBtnDisabled]} onPress={askQuestion} disabled={!askDraft.trim() || askLoading}>
                    {askLoading ? <ActivityIndicator size="small" color={COLORS.card} /> : <Send size={17} color={COLORS.card} />}
                  </Pressable>
                </View>
              </View>
            )}

            <View style={styles.disclaimerRow}>
              <ShieldCheck size={15} color={COLORS.secondary} strokeWidth={2} />
              <Text style={styles.disclaimer}>
                {activeLanguage === 'zu'
                  ? 'Iseluleko kuphela. Umsebenzi wegesi nombane udinga umuntu oqeqeshiwe.'
                  : 'Guidance only. Gas and electrical work needs a registered professional.'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  headerIdentity: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  sparkleMark: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONTS.bold, fontSize: 26, color: COLORS.text, letterSpacing: -0.7 },
  subtitle: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.text, marginTop: 1 },
  profileButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#DDF4EC', alignItems: 'center', justifyContent: 'center' },
  // View toggle
  viewToggle: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  viewTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: RADIUS.md, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  viewTabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  viewTabText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.textMuted },
  viewTabTextActive: { color: COLORS.card },
  historyBadge: { backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  historyBadgeText: { fontFamily: FONTS.bold, fontSize: 10, color: COLORS.text },
  // History
  emptyHistory: { alignItems: 'center', padding: SPACING.xl, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border },
  emptyHistoryTitle: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.text, marginTop: SPACING.md },
  emptyHistoryText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textMuted, textAlign: 'center', marginTop: SPACING.sm, lineHeight: 19 },
  emptyHistoryBtn: { marginTop: SPACING.lg, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm + 2 },
  emptyHistoryBtnText: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.card },
  historyCard: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.sm },
  historyCardLeft: { alignItems: 'center', gap: 4, width: 52 },
  historyModeBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4 },
  historyModeDo: { backgroundColor: COLORS.primary },
  historyModeLearn: { backgroundColor: COLORS.secondary },
  historyModeText: { fontFamily: FONTS.bold, fontSize: 10, color: COLORS.card },
  historyProBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: COLORS.error + '15', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  historyProText: { fontFamily: FONTS.bold, fontSize: 9, color: COLORS.error },
  historyCardContent: { flex: 1 },
  historyCardTitle: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.text },
  historyCardDesc: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 3, lineHeight: 17 },
  historyCardMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 6 },
  historyConfDot: { width: 8, height: 8, borderRadius: 4 },
  historyCardDate: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted },
  historyStepsInfo: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  historyStepsText: { fontFamily: FONTS.semiBold, fontSize: 11, color: COLORS.success },
  // Config
  configRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  toggleGroup: { flexDirection: 'row', gap: 6, flex: 1 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  toggleActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  toggleText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.textMuted },
  toggleTextActive: { color: COLORS.card },
  langGroup: { flexDirection: 'row', gap: 4 },
  langBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 16, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  langActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  langText: { fontFamily: FONTS.bold, fontSize: 11, color: COLORS.textMuted },
  langTextActive: { color: COLORS.card },
  modeHint: { fontFamily: FONTS.regular, fontSize: 13, lineHeight: 19, color: COLORS.textMuted, marginBottom: SPACING.md, paddingHorizontal: 2 },
  // Job selector
  jobSelector: { marginBottom: SPACING.md },
  jobSelectorLabel: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.text, marginBottom: SPACING.sm },
  jobChips: { gap: SPACING.sm, paddingBottom: 4 },
  jobChip: { backgroundColor: COLORS.card, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  jobChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  jobChipText: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.textMuted },
  jobChipTextActive: { color: COLORS.card },
  // Input card
  inputCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md },
  inputLabel: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text, marginBottom: SPACING.sm },
  descriptionInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md, paddingHorizontal: SPACING.sm + 2, paddingVertical: SPACING.sm, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text, backgroundColor: COLORS.background, minHeight: 70, marginBottom: SPACING.md, lineHeight: 20 },
  photoActions: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  photoBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: RADIUS.md, backgroundColor: '#EAF7F2', borderWidth: 1, borderColor: '#BFE5D5' },
  photoBtnText: { fontFamily: FONTS.semiBold, fontSize: 13, color: COLORS.primary },
  photoPreviewWrap: { position: 'relative', marginBottom: SPACING.md },
  photoPreview: { width: '100%', height: 180, borderRadius: RADIUS.md },
  photoRemove: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.error + '15', borderRadius: RADIUS.md, padding: SPACING.sm + 2, marginBottom: SPACING.md },
  errorText: { flex: 1, fontFamily: FONTS.medium, fontSize: 13, color: COLORS.error, lineHeight: 18 },
  diagnoseBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: SPACING.sm + 3 },
  diagnoseBtnDisabled: { opacity: 0.6 },
  diagnoseBtnText: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.card },
  // Loading
  loadingCard: { alignItems: 'center', padding: SPACING.xl, backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md },
  loadingText: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textMuted, marginTop: SPACING.md, textAlign: 'center' },
  // Diagnosis
  diagnosisHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.md },
  diagnosisHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, flex: 1 },
  diagnosisBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#DDF4EC', alignItems: 'center', justifyContent: 'center' },
  diagnosisLabel: { fontFamily: FONTS.medium, fontSize: 11, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  diagnosisProblemTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text, marginTop: 2 },
  resetBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  diagnosisPhoto: { width: '100%', height: 200, borderRadius: RADIUS.md, marginBottom: SPACING.md },
  confidenceRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: SPACING.md },
  confidenceDot: { width: 9, height: 9, borderRadius: 5 },
  confidenceText: { fontFamily: FONTS.semiBold, fontSize: 12 },
  sectionCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md },
  sectionTitle: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text },
  explanationText: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 21, color: COLORS.text, marginTop: SPACING.sm },
  safetyCard: { backgroundColor: COLORS.warning + '12', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.warning + '40', padding: SPACING.md, marginBottom: SPACING.md },
  safetyCardDanger: { backgroundColor: COLORS.error + '12', borderColor: COLORS.error + '40' },
  safetyHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 6 },
  safetyTitle: { fontFamily: FONTS.bold, fontSize: 15 },
  safetyText: { fontFamily: FONTS.regular, fontSize: 13, lineHeight: 19, color: COLORS.text },
  metaRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  metaCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.sm + 2 },
  metaLabel: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted },
  metaValue: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.text, marginTop: 3 },
  toolsHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  toolsHint: { fontFamily: FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginBottom: SPACING.sm },
  toolRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  toolCheckbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  toolCheckboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  toolName: { flex: 1, fontFamily: FONTS.regular, fontSize: 14, color: COLORS.text },
  essentialBadge: { fontFamily: FONTS.semiBold, fontSize: 10, color: COLORS.error, backgroundColor: COLORS.error + '15', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  toolsStatus: { fontFamily: FONTS.semiBold, fontSize: 12, marginTop: SPACING.sm, textAlign: 'center' },
  toolsStatusOk: { color: COLORS.success },
  toolsStatusMissing: { color: COLORS.warning },
  stepsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  stepCounter: { fontFamily: FONTS.semiBold, fontSize: 12, color: COLORS.textMuted },
  progressTrack: { height: 5, borderRadius: 3, backgroundColor: COLORS.border, marginBottom: SPACING.md },
  progressFill: { height: 5, borderRadius: 3, backgroundColor: COLORS.primary },
  stepCard: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, padding: SPACING.md, marginBottom: SPACING.md },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: SPACING.sm },
  stepNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  stepNumberDone: { backgroundColor: COLORS.success },
  stepNumberText: { fontFamily: FONTS.bold, fontSize: 15, color: COLORS.card },
  stepTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: 15, color: COLORS.text },
  stepInstruction: { fontFamily: FONTS.regular, fontSize: 14, lineHeight: 21, color: COLORS.text, marginBottom: SPACING.sm },
  stepSafety: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: COLORS.warning + '15', borderRadius: 8, padding: 8, marginBottom: SPACING.sm },
  stepSafetyText: { flex: 1, fontFamily: FONTS.medium, fontSize: 12, color: COLORS.warning, lineHeight: 17 },
  stepActions: { flexDirection: 'row', gap: SPACING.sm },
  stepActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: RADIUS.sm, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  stepDoneBtn: { borderColor: COLORS.success },
  stepDoneBtnActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  stepActionText: { fontFamily: FONTS.semiBold, fontSize: 13 },
  stepNav: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  navBtn: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: RADIUS.md, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontFamily: FONTS.semiBold, fontSize: 14, color: COLORS.text },
  navBtnPrimary: { flex: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 11, borderRadius: RADIUS.md, backgroundColor: COLORS.primary },
  navBtnPrimaryText: { fontFamily: FONTS.bold, fontSize: 14, color: COLORS.card },
  completionBanner: { alignItems: 'center', backgroundColor: COLORS.success + '12', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: COLORS.success + '30', padding: SPACING.lg, marginBottom: SPACING.md },
  completionTitle: { fontFamily: FONTS.bold, fontSize: 17, color: COLORS.success, marginTop: SPACING.sm },
  completionText: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.text, textAlign: 'center', marginTop: 5, lineHeight: 19 },
  // Ask + conversation
  askButton: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 28, paddingHorizontal: SPACING.md, paddingVertical: 13, marginBottom: SPACING.md },
  askButtonText: { flex: 1, fontFamily: FONTS.bold, fontSize: 14, color: COLORS.card },
  convBadge: { backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  convBadgeText: { fontFamily: FONTS.bold, fontSize: 10, color: COLORS.text },
  askPanel: { backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  convList: { gap: SPACING.sm, marginBottom: SPACING.md },
  convMsg: { flexDirection: 'row', alignItems: 'flex-start', gap: SPACING.sm, borderRadius: RADIUS.md, padding: SPACING.sm },
  convMsgWorker: { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  convMsgAi: { backgroundColor: '#EAF7F2' },
  convMsgIcon: { marginTop: 2 },
  convMsgText: { flex: 1, fontFamily: FONTS.regular, fontSize: 13, lineHeight: 19, color: COLORS.text },
  convSpeakBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center' },
  askComposer: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, borderRadius: 22, paddingLeft: SPACING.sm },
  askInput: { flex: 1, fontFamily: FONTS.regular, fontSize: 13, color: COLORS.text, paddingVertical: 10 },
  askSend: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 3 },
  disclaimerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: SPACING.md, paddingHorizontal: SPACING.md },
  disclaimer: { fontFamily: FONTS.regular, fontSize: 11, color: COLORS.textMuted, textAlign: 'center', lineHeight: 16 },
});
