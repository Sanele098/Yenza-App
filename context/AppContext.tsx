import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import {
  AppRole, Candidate, EmployerJob, EmployerJobStatus, EmployerProfile, Job, Worker,
  JobStatus, WorkerStatus, JobCategory, VerificationItem, FulfillmentMode, PricingType,
  ApplicationStatus, JobApplication, ExperienceLevel,
  ProfileRow, ServiceRow, JobRow, WorkerServiceRow, ReviewRow, JobApplicationRow,
  RpcResult, WorkPhoto, PhotoType,
  EarningRow, EarningsSummary, EarningsActivity, PaymentRow, PaymentMethod, PreferredPaymentMethod, WithdrawalRow,
  SkillDemand,
  SkillGapAnalysis,
  SkillGapRow,
  SkillMilestone,
} from '@/types';
import { supabase } from '@/lib/supabase';
import { ALL_SERVICE_AREAS, EXPERIENCE_LEVELS } from '@/data/mockData';

// ============================================================
// DB row → UI type adapters
// ============================================================

function safeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === 'string') {
    try { const parsed = JSON.parse(value); return Array.isArray(parsed) ? parsed as T[] : []; } catch { return []; }
  }
  return [];
}

function safeObject<T extends Record<string, unknown>>(value: unknown): T {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as T;
  if (typeof value === 'string') {
    try { return JSON.parse(value) as T; } catch { return {} as T; }
  }
  return {} as T;
}

function profileToWorker(profile: ProfileRow, workerServices: WorkerServiceRow[]): Worker {
  const services = workerServices
    .filter((ws) => ws.active && ws.service)
    .map((ws) => ws.service!.name);
  return {
    id: profile.id,
    name: profile.display_name,
    phone: profile.phone ?? '',
    email: profile.email ?? '',
    bio: profile.bio,
    photo: profile.profile_photo,
    services: services as JobCategory[],
    experience: (profile.experience_level as Worker['experience']) || EXPERIENCE_LEVELS[0],
    experienceDetail: profile.experience_detail,
    location: profile.primary_location,
    serviceAreas: safeArray<string>(profile.service_areas),
    isAvailable: profile.is_available,
    preferredLanguage: profile.preferred_language,
    availabilityDays: safeArray<string>(safeObject<{ days?: string[] }>(profile.availability).days),
    qualifications: safeArray<VerificationItem>(profile.qualifications_summary),
    profilePhotoSet: profile.profile_photo_set,
  };
}

function profileToEmployer(profile: ProfileRow): EmployerProfile {
  return {
    id: profile.id,
    name: profile.display_name,
    accountType: profile.account_type ?? 'Household',
    phone: profile.phone ?? '',
    email: profile.email ?? '',
    location: profile.primary_location,
    jobsPosted: 0,
    jobsCompleted: 0,
  };
}

function jobRowToJob(job: JobRow): Job {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    category: (job.service?.name ?? 'General Labour') as JobCategory,
    price: Number(job.budget_max ?? job.budget_min ?? job.budget ?? 0),
    location: job.job_location,
    latitude: job.latitude,
    longitude: job.longitude,
    distanceKm: 0,
    scheduledDate: job.requested_date ?? '',
    scheduledTime: job.requested_time ?? '',
    estimatedDuration: job.estimated_duration,
    status: job.status,
    fulfillmentMode: job.fulfillment_mode,
    pricingType: job.pricing_type,
    preferredPaymentMethod: job.preferred_payment_method,
    isRemote: job.is_remote ?? false,
    employerName: job.employer?.display_name,
    createdAt: job.created_at,
  };
}

function jobRowToEmployerJob(job: JobRow, applicationCount: number): EmployerJob {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    category: (job.service?.name ?? 'General Labour') as JobCategory,
    location: job.job_location,
    budget: Number(job.budget_max ?? job.budget_min ?? job.budget ?? 0),
    scheduledDate: job.requested_date ?? '',
    scheduledTime: job.requested_time ?? '',
    status: mapJobStatusToEmployerStatus(job.status),
    rawStatus: job.status,
    fulfillmentMode: job.fulfillment_mode,
    preferredPaymentMethod: job.preferred_payment_method,
    applications: applicationCount,
    createdAt: job.created_at,
  };
}

function mapJobStatusToEmployerStatus(status: JobStatus): EmployerJobStatus {
  switch (status) {
    case 'draft': return 'Draft';
    case 'open': return 'Open';
    case 'assigned': return 'Worker selected';
    case 'in_progress': return 'In progress';
    case 'awaiting_confirmation': return 'Awaiting confirmation';
    case 'completed': return 'Completed';
    case 'cancelled': return 'Cancelled';
    case 'expired': return 'Expired';
    default: return 'Open';
  }
}

function profileToCandidate(
  profile: ProfileRow,
  services: JobCategory[],
  rating: number,
  completedJobs: number,
  rate: number,
): Candidate {
  const verificationCount = safeArray<VerificationItem>(profile.qualifications_summary).filter(
    (q: VerificationItem) => q.status === 'verified',
  ).length;
  return {
    id: profile.id,
    name: profile.display_name,
    services,
    experience: (profile.experience_level as Candidate['experience']) || EXPERIENCE_LEVELS[0],
    location: profile.primary_location,
    rating,
    completedJobs,
    verificationCount,
    isAvailable: profile.is_available,
    rate,
    photo: profile.profile_photo ?? '',
  };
}

function appRowToApplication(app: JobApplicationRow): JobApplication {
  return {
    id: app.id,
    jobId: app.job_id,
    workerId: app.worker_id,
    workerName: app.worker?.display_name ?? 'Worker',
    workerLocation: app.worker?.primary_location ?? '',
    workerServices: [],
    message: app.message,
    proposedPrice: app.proposed_price,
    estimatedDuration: app.estimated_duration,
    status: app.status,
    createdAt: app.created_at,
  };
}

// ============================================================
// Context interface
// ============================================================

interface AppStore {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  role: AppRole | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    location: string;
    serviceAreas: string[];
    availabilityDays: string[];
    services: JobCategory[];
    skillsToLearn: JobCategory[];
    experience: ExperienceLevel;
    goals: string;
    bio: string;
  }) => Promise<{ success: boolean; error?: string }>;
  registerEmployer: (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    accountType: 'Household' | 'Landlord' | 'Small business' | 'Organisation';
    location: string;
    bio: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;

  worker: Worker;
  updateWorker: (updates: Partial<Worker>) => Promise<void>;
  uploadProfilePhoto: (uri: string) => Promise<{ success: boolean; error?: string }>;
  toggleAvailability: () => void;
  workerStatus: WorkerStatus;
  setWorkerStatus: (status: WorkerStatus) => void;

  // Worker job discovery + lifecycle
  jobs: Job[];
  claimJob: (jobId: string) => Promise<RpcResult>;
  applyForJob: (jobId: string, message: string, proposedPrice?: number, estimatedDuration?: string) => Promise<RpcResult>;
  startJob: (jobId: string) => Promise<RpcResult>;
  submitCompletion: (jobId: string, notes?: string) => Promise<RpcResult>;
  cancelJob: (jobId: string, reason?: string) => Promise<RpcResult>;
  declineJob: (jobId: string) => void;

  recommendedJob: Job | null;
  availableJobs: Job[];
  activeJobs: Job[];
  declinedJobIds: string[];
  refreshJobs: () => Promise<void>;

  // Employer
  employer: EmployerProfile;
  employerJobs: EmployerJob[];
  candidates: Candidate[];
  jobApplications: Record<string, JobApplication[]>;
  createEmployerJob: (job: {
    title: string;
    description: string;
    category: JobCategory;
    location: string;
    budget: number;
    scheduledDate: string;
    scheduledTime: string;
    fulfillmentMode: FulfillmentMode;
    pricingType: PricingType;
    preferredPaymentMethod: PreferredPaymentMethod;
    isRemote: boolean;
    photoUris?: string[];
  }) => Promise<{ success: boolean; error?: string }>;
  deleteEmployerJob: (jobId: string) => Promise<void>;
  cancelEmployerJob: (jobId: string, reason?: string) => Promise<RpcResult>;
  reopenJob: (jobId: string) => Promise<RpcResult>;
  confirmCompletion: (jobId: string) => Promise<RpcResult>;
  selectWorker: (applicationId: string) => Promise<RpcResult>;
  loadApplications: (jobId: string) => Promise<void>;
  updateEmployerProfile: (updates: Partial<EmployerProfile>) => Promise<void>;

  // Earnings
  earnings: EarningsActivity[];
  earningsSummary: EarningsSummary;
  loadEarnings: () => Promise<void>;
  requestWithdrawal: (amount: number, method: 'cash' | 'bank_transfer' | 'e_wallet') => Promise<RpcResult>;
  withdrawals: WithdrawalRow[];

  // Work photos
  workPhotos: Record<string, WorkPhoto[]>;
  listingPhotos: Record<string, WorkPhoto[]>;
  uploadWorkPhoto: (jobId: string, uri: string, caption?: string) => Promise<{ success: boolean; error?: string }>;
  uploadJobPhoto: (jobId: string, uri: string) => Promise<{ success: boolean; error?: string }>;
  deleteWorkPhoto: (photoId: string, jobId: string, storagePath: string) => Promise<{ success: boolean; error?: string }>;
  loadWorkPhotos: (jobId: string) => Promise<void>;
  loadListingPhotos: (jobId: string) => Promise<void>;

  // Skill gap analysis
  skillDemand: SkillDemand[];
  loadSkillDemand: () => Promise<void>;
  skillGapAnalysis: SkillGapAnalysis | null;
  skillGapLanguage: 'en' | 'zu';
  setSkillGapLanguage: (lang: 'en' | 'zu') => void;
  loadSkillGapAnalysis: () => Promise<void>;
  generateSkillGapAnalysis: () => Promise<{ success: boolean; error?: string }>;
  addSkillMilestone: (skill: string) => Promise<{ success: boolean; error?: string }>;
  updateMilestoneStatus: (milestoneId: string, status: SkillMilestone['status']) => Promise<void>;
  skillGapLoading: boolean;
}

const AppContext = createContext<AppStore | undefined>(undefined);

const emptyWorker: Worker = {
  id: '', name: '', phone: '', email: '', bio: '', photo: '',
  services: [], experience: EXPERIENCE_LEVELS[0], experienceDetail: '',
  location: '', serviceAreas: [], isAvailable: true, preferredLanguage: 'English',
  availabilityDays: [], qualifications: [], profilePhotoSet: false,
};

const emptyEmployer: EmployerProfile = {
  id: '', name: '', accountType: 'Household', phone: '', email: '',
  location: '', jobsPosted: 0, jobsCompleted: 0,
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [workerServices, setWorkerServices] = useState<WorkerServiceRow[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [employerJobs, setEmployerJobs] = useState<EmployerJob[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobApplications, setJobApplications] = useState<Record<string, JobApplication[]>>({});
  const [declinedJobIds, setDeclinedJobIds] = useState<string[]>([]);
  const [earnings, setEarnings] = useState<EarningsActivity[]>([]);
  const [earningsSummary, setEarningsSummary] = useState<EarningsSummary>({ available: 0, pending: 0, cashCompleted: 0, total: 0, grossEarnings: 0, totalCommission: 0 });
  const [withdrawals, setWithdrawals] = useState<WithdrawalRow[]>([]);
  const [skillDemand, setSkillDemand] = useState<SkillDemand[]>([]);
  const [skillGapAnalysis, setSkillGapAnalysis] = useState<SkillGapAnalysis | null>(null);
  const [skillGapLoading, setSkillGapLoading] = useState(false);
  const [skillGapLanguage, setSkillGapLanguage] = useState<'en' | 'zu'>('en');
  const [workPhotos, setWorkPhotos] = useState<Record<string, WorkPhoto[]>>({});
  const [listingPhotos, setListingPhotos] = useState<Record<string, WorkPhoto[]>>({});
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>('available');
  const loadingRef = useRef(false);

  // ============================================================
  // Auth: session restoration
  // ============================================================
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id);
      } else {
        setIsAuthLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        if (newSession) {
          await loadProfile(newSession.user.id);
        } else {
          if (mounted) {
            setProfile(null);
            setRole(null);
            setIsAuthenticated(false);
            setIsAuthLoading(false);
          }
        }
      })();
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================
  // Load profile + related data after auth
  // ============================================================
  const loadProfile = useCallback(async (userId: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error || !profileData) {
        setIsAuthLoading(false);
        return;
      }

      const p = profileData as ProfileRow;
      setProfile(p);
      setRole(p.role);
      setWorkerStatus(p.worker_status as WorkerStatus);
      setIsAuthenticated(true);

      if (p.role === 'worker') {
        await loadWorkerData(p);
        await loadEarnings();
        await loadSkillDemand();
        await loadSkillGapAnalysis();
      } else {
        await loadEmployerData(p);
      }
    } finally {
      setIsAuthLoading(false);
      loadingRef.current = false;
    }
  }, []);

  const loadWorkerData = useCallback(async (p: ProfileRow) => {
    const { data: wsData } = await supabase
      .from('worker_services')
      .select('*, service:services(*)')
      .eq('worker_id', p.id)
      .eq('active', true);
    setWorkerServices((wsData ?? []) as WorkerServiceRow[]);

    // Load open jobs (marketplace) + jobs assigned to this worker
    const { data: openJobs } = await supabase
      .from('jobs')
      .select('*, service:services(*), employer:profiles!employer_id(*)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    const { data: assignedJobs } = await supabase
      .from('jobs')
      .select('*, service:services(*), employer:profiles!employer_id(*)')
      .eq('assigned_worker_id', p.id)
      .in('status', ['assigned', 'in_progress', 'awaiting_confirmation'])
      .order('created_at', { ascending: false });

    const allJobs = [...(assignedJobs ?? []), ...(openJobs ?? [])];
    setJobs(allJobs.map((j) => jobRowToJob(j as JobRow)));
  }, []);

  const loadEmployerData = useCallback(async (p: ProfileRow) => {
    const { data: myJobs } = await supabase
      .from('jobs')
      .select('*, service:services(*)')
      .eq('employer_id', p.id)
      .order('created_at', { ascending: false });

    const jobIds = (myJobs ?? []).map((j) => (j as JobRow).id);
    let appCounts: Record<string, number> = {};
    if (jobIds.length > 0) {
      const { data: apps } = await supabase
        .from('job_applications')
        .select('job_id')
        .in('job_id', jobIds);
      appCounts = (apps ?? []).reduce((acc, a) => {
        const jid = (a as { job_id: string }).job_id;
        acc[jid] = (acc[jid] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }
    setEmployerJobs((myJobs ?? []).map((j) => jobRowToEmployerJob(j as JobRow, appCounts[(j as JobRow).id] ?? 0)));

    // Load worker candidates
    const { data: workerProfiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'worker');
    const { data: allWorkerServices } = await supabase
      .from('worker_services')
      .select('*, service:services(*)')
      .eq('active', true);
    const { data: reviews } = await supabase.from('reviews').select('*');

    const wsByWorker: Record<string, WorkerServiceRow[]> = {};
    (allWorkerServices ?? []).forEach((ws) => {
      const row = ws as WorkerServiceRow;
      if (!wsByWorker[row.worker_id]) wsByWorker[row.worker_id] = [];
      wsByWorker[row.worker_id].push(row);
    });

    const ratingByWorker: Record<string, { sum: number; count: number }> = {};
    (reviews ?? []).forEach((r) => {
      const rv = r as ReviewRow;
      if (!ratingByWorker[rv.reviewed_id]) ratingByWorker[rv.reviewed_id] = { sum: 0, count: 0 };
      ratingByWorker[rv.reviewed_id].sum += rv.rating;
      ratingByWorker[rv.reviewed_id].count += 1;
    });

    setCandidates(
      (workerProfiles ?? []).map((wp) => {
        const wpRow = wp as ProfileRow;
        const wsvc = (wsByWorker[wpRow.id] ?? [])
          .map((ws) => ws.service?.name)
          .filter(Boolean) as JobCategory[];
        const r = ratingByWorker[wpRow.id];
        const avgRating = r ? r.sum / r.count : 0;
        const minRate = (wsByWorker[wpRow.id] ?? []).reduce(
          (min, ws) => Math.min(min, Number(ws.starting_price)),
          Infinity,
        );
        return profileToCandidate(wpRow, wsvc, avgRating, 0, minRate === Infinity ? 0 : minRate);
      }),
    );
  }, []);

  const refreshJobs = useCallback(async () => {
    if (!profile) return;
    if (profile.role === 'worker') {
      await loadWorkerData(profile);
      await loadSkillDemand();
    } else {
      await loadEmployerData(profile);
    }
  }, [profile]);

  const loadSkillDemand = useCallback(async () => {
    const { data: jobData } = await supabase
      .from('jobs')
      .select('service_id, status, service:services(*)')
      .not('service_id', 'is', null);
    const { data: wsData } = await supabase
      .from('worker_services')
      .select('service_id')
      .eq('active', true);

    const jobCountMap: Record<string, { total: number; open: number }> = {};
    (jobData ?? []).forEach((j: { service_id: string; status: string }) => {
      const sid = j.service_id;
      if (!jobCountMap[sid]) jobCountMap[sid] = { total: 0, open: 0 };
      jobCountMap[sid].total++;
      if (j.status === 'open') jobCountMap[sid].open++;
    });

    const workerCountMap: Record<string, number> = {};
    (wsData ?? []).forEach((ws: { service_id: string }) => {
      workerCountMap[ws.service_id] = (workerCountMap[ws.service_id] ?? 0) + 1;
    });

    const { data: services } = await supabase.from('services').select('*').eq('active', true);
    const demand: SkillDemand[] = (services ?? []).map((s: ServiceRow) => ({
      service: s.name,
      category: s.category,
      totalJobs: jobCountMap[s.id]?.total ?? 0,
      openJobs: jobCountMap[s.id]?.open ?? 0,
      workerCount: workerCountMap[s.id] ?? 0,
    }));
    setSkillDemand(demand);
  }, []);

  const SUPABASE_URL_STR = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '') as string;

  async function getAuthHeaders(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  function computeSkillHash(skills: string[], experience: string): string {
    const s = [...skills].sort().join(',') + '|' + experience;
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
    }
    return String(hash);
  }

  function rowToSkillGap(row: SkillGapRow): SkillGapAnalysis {
    return {
      id: row.id,
      workerId: row.worker_id,
      currentSkills: Array.isArray(row.current_skills) ? row.current_skills : [],
      experienceLevel: row.experience_level,
      location: row.location,
      summary: row.summary,
      milestones: Array.isArray(row.milestones) ? row.milestones as SkillMilestone[] : [],
      skillSnapshotHash: row.skill_snapshot_hash,
      updatedAt: row.updated_at,
    };
  }

  const loadSkillGapAnalysis = useCallback(async () => {
    const { data, error } = await supabase
      .from('skill_gap_analyses')
      .select('*')
      .maybeSingle();
    if (!error && data) {
      setSkillGapAnalysis(rowToSkillGap(data as SkillGapRow));
    }
  }, []);

  const generateSkillGapAnalysis = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!profile || profile.role !== 'worker') return { success: false, error: 'Only workers can use skill gap analysis.' };
    const skills = (workerServices.map((ws) => ws.service?.name).filter(Boolean) as string[]);
    setSkillGapLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL_STR}/functions/v1/yenza-ai/skill-gap`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          currentSkills: skills,
          experienceLevel: profile.experience_level,
          location: profile.primary_location,
          language: skillGapLanguage,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { success: false, error: body.error ?? `Request failed (${res.status})` };
      }
      const data = await res.json();
      const newAnalysis: SkillGapAnalysis = {
        id: '', workerId: profile.id,
        currentSkills: skills,
        experienceLevel: profile.experience_level,
        location: profile.primary_location,
        summary: data.summary ?? '',
        milestones: (data.milestones ?? []) as SkillMilestone[],
        skillSnapshotHash: computeSkillHash(skills, profile.experience_level),
        updatedAt: new Date().toISOString(),
      };
      setSkillGapAnalysis(newAnalysis);
      await loadSkillGapAnalysis();
      return { success: true };
    } catch {
      return { success: false, error: 'Could not reach AI service. Please try again.' };
    } finally {
      setSkillGapLoading(false);
    }
  }, [profile, workerServices, loadSkillGapAnalysis, skillGapLanguage]);

  const addSkillMilestone = useCallback(async (skill: string): Promise<{ success: boolean; error?: string }> => {
    if (!profile || profile.role !== 'worker') return { success: false, error: 'Only workers can use skill gap analysis.' };
    const skills = (workerServices.map((ws) => ws.service?.name).filter(Boolean) as string[]);
    setSkillGapLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL_STR}/functions/v1/yenza-ai/skill-gap`, {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          currentSkills: skills,
          experienceLevel: profile.experience_level,
          location: profile.primary_location,
          targetSkill: skill,
          language: skillGapLanguage,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        return { success: false, error: body.error ?? `Request failed (${res.status})` };
      }
      const data = await res.json();
      const milestone = data.milestone as SkillMilestone | undefined;
      if (!milestone) return { success: false, error: 'AI could not generate a milestone.' };
      const updatedMilestones = [...(skillGapAnalysis?.milestones ?? []), { ...milestone, status: 'pending' as const }];
      const { error: upsertErr } = await supabase
        .from('skill_gap_analyses')
        .upsert({
          worker_id: profile.id,
          current_skills: skills,
          experience_level: profile.experience_level,
          location: profile.primary_location,
          summary: skillGapAnalysis?.summary ?? '',
          milestones: updatedMilestones,
          skill_snapshot_hash: computeSkillHash(skills, profile.experience_level),
        }, { onConflict: 'worker_id' });
      if (upsertErr) return { success: false, error: upsertErr.message };
      setSkillGapAnalysis((prev) => prev ? { ...prev, milestones: updatedMilestones } : null);
      await loadSkillGapAnalysis();
      return { success: true };
    } catch {
      return { success: false, error: 'Could not reach AI service. Please try again.' };
    } finally {
      setSkillGapLoading(false);
    }
  }, [profile, workerServices, skillGapAnalysis, loadSkillGapAnalysis, skillGapLanguage]);

  const updateMilestoneStatus = useCallback(async (milestoneId: string, status: SkillMilestone['status']) => {
    if (!skillGapAnalysis) return;
    const updated = skillGapAnalysis.milestones.map((m) =>
      m.id === milestoneId ? { ...m, status } : m
    );
    setSkillGapAnalysis({ ...skillGapAnalysis, milestones: updated });
    await supabase
      .from('skill_gap_analyses')
      .update({ milestones: updated })
      .eq('worker_id', skillGapAnalysis.workerId);
  }, [skillGapAnalysis]);

  // ============================================================
  // Realtime: employer sees job status changes live (worker submits completion, starts job, etc.)
  // ============================================================
  useEffect(() => {
    if (!profile || profile.role !== 'employer') return;
    const channel = supabase
      .channel('employer_jobs_realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `employer_id=eq.${profile.id}` }, () => {
        loadEmployerData(profile);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'job_applications' }, () => {
        loadEmployerData(profile);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile, loadEmployerData]);

  // ============================================================
  // Auth actions
  // ============================================================
  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: error.message };
    }
    if (data.session) {
      await loadProfile(data.session.user.id);
    }
    return { success: true };
  }, [loadProfile]);

  const register = useCallback(async (regData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    location: string;
    serviceAreas: string[];
    availabilityDays: string[];
    services: JobCategory[];
    skillsToLearn: JobCategory[];
    experience: ExperienceLevel;
    goals: string;
    bio: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: regData.email.trim(),
      password: regData.password,
    });
    if (authError) return { success: false, error: authError.message };
    const userId = authData.user?.id;
    if (!userId) return { success: false, error: 'Could not create account.' };

    // If signUp didn't return a session (email confirmation enabled),
    // sign in immediately so the profile insert passes RLS.
    let session = authData.session;
    if (!session) {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: regData.email.trim(),
        password: regData.password,
      });
      if (signInErr) return { success: false, error: 'Account created but could not sign in. Please log in.' };
      session = signInData.session;
    }

    const parts = regData.fullName.trim().split(' ');
    const { error: profileErr } = await supabase.from('profiles').insert({
      id: userId,
      first_name: parts[0] ?? '',
      surname: parts.slice(1).join(' '),
      display_name: regData.fullName.trim(),
      email: regData.email.trim(),
      phone: regData.phone.trim(),
      role: 'worker',
      primary_location: regData.location,
      service_areas: regData.serviceAreas,
      availability: { days: regData.availabilityDays },
      experience_level: regData.experience,
      experience_detail: regData.goals,
      bio: regData.bio,
      worker_status: 'available',
      is_available: true,
      identity_verified: false,
      profile_photo_set: false,
      profile_photo: '',
      qualifications_summary: [],
    });
    if (profileErr) {
      return { success: false, error: profileErr.message };
    }

    if (regData.services.length > 0) {
      const { data: svcRows } = await supabase
        .from('services')
        .select('id, name')
        .in('name', regData.services);
      const svcMap: Record<string, string> = {};
      (svcRows ?? []).forEach((s: { id: string; name: string }) => { svcMap[s.name] = s.id; });
      const inserts = regData.services
        .filter((name) => svcMap[name])
        .map((name) => ({
          worker_id: userId,
          service_id: svcMap[name],
          experience_level: regData.experience,
          starting_price: 0,
          pricing_type: 'fixed',
          active: true,
        }));
      if (inserts.length > 0) {
        await supabase.from('worker_services').insert(inserts);
      }
    }

    if (session) {
      loadingRef.current = false;
      await loadProfile(userId);
    }
    return { success: true };
  }, [loadProfile]);

  const registerEmployer = useCallback(async (regData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    accountType: 'Household' | 'Landlord' | 'Small business' | 'Organisation';
    location: string;
    bio: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: regData.email.trim(),
      password: regData.password,
    });
    if (authError) return { success: false, error: authError.message };
    const userId = authData.user?.id;
    if (!userId) return { success: false, error: 'Could not create account.' };

    // If signUp didn't return a session (email confirmation enabled),
    // sign in immediately so the profile insert passes RLS.
    let session = authData.session;
    if (!session) {
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: regData.email.trim(),
        password: regData.password,
      });
      if (signInErr) return { success: false, error: 'Account created but could not sign in. Please log in.' };
      session = signInData.session;
    }

    const parts = regData.fullName.trim().split(' ');
    const { error: profileErr } = await supabase.from('profiles').insert({
      id: userId,
      first_name: parts[0] ?? '',
      surname: parts.slice(1).join(' '),
      display_name: regData.fullName.trim(),
      email: regData.email.trim(),
      phone: regData.phone.trim(),
      role: 'employer',
      account_type: regData.accountType,
      primary_location: regData.location,
      bio: regData.bio,
      identity_verified: false,
      profile_photo_set: false,
      profile_photo: '',
      qualifications_summary: [],
    });
    if (profileErr) return { success: false, error: profileErr.message };

    loadingRef.current = false;
    if (session) {
      await loadProfile(userId);
    }
    return { success: true };
  }, [loadProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    setIsAuthenticated(false);
    setSession(null);
    setJobs([]);
    setEmployerJobs([]);
    setCandidates([]);
    setJobApplications({});
    setWorkerServices([]);
    setEarnings([]);
    setEarningsSummary({ available: 0, pending: 0, cashCompleted: 0, total: 0, grossEarnings: 0, totalCommission: 0 });
    setWithdrawals([]);
    setSkillDemand([]);
    setSkillGapAnalysis(null);
  }, []);

  // ============================================================
  // Worker actions (RPC-backed)
  // ============================================================
  const worker = profile && role === 'worker'
    ? profileToWorker(profile, workerServices)
    : emptyWorker;

  const employer = profile && role === 'employer'
    ? profileToEmployer(profile)
    : emptyEmployer;

  const updateWorker = useCallback(async (updates: Partial<Worker>) => {
    if (!profile) return;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) {
      const parts = updates.name.split(' ');
      dbUpdates.display_name = updates.name;
      dbUpdates.first_name = parts[0] ?? '';
      dbUpdates.surname = parts.slice(1).join(' ');
    }
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
    if (updates.location !== undefined) dbUpdates.primary_location = updates.location;
    if (updates.preferredLanguage !== undefined) dbUpdates.preferred_language = updates.preferredLanguage;
    if (updates.serviceAreas !== undefined) dbUpdates.service_areas = updates.serviceAreas;
    if (updates.availabilityDays !== undefined) {
      const currentAvail = safeObject<{ days?: string[] }>(profile.availability);
      dbUpdates.availability = { ...currentAvail, days: updates.availabilityDays };
    }
    if (updates.experience !== undefined) dbUpdates.experience_level = updates.experience;
    if (updates.experienceDetail !== undefined) dbUpdates.experience_detail = updates.experienceDetail;
    if (updates.qualifications !== undefined) dbUpdates.qualifications_summary = updates.qualifications;
    if (updates.profilePhotoSet !== undefined) {
      dbUpdates.profile_photo_set = updates.profilePhotoSet;
      dbUpdates.profile_photo = updates.photo ?? '';
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', profile.id)
      .select('*')
      .maybeSingle();

    if (!error && data) {
      setProfile(data as ProfileRow);
    }
  }, [profile]);

  const uploadProfilePhoto = useCallback(async (uri: string): Promise<{ success: boolean; error?: string }> => {
    if (!profile) return { success: false, error: 'Not authenticated' };

    const fileExt = (uri.match(/\.(jpe?g|png|webp|gif|heic)$/i)?.[1] ?? 'jpg').toLowerCase();
    const fileName = `${profile.id}/${crypto.randomUUID()}.${fileExt}`;

    const fileResponse = await fetch(uri);
    const blob = await fileResponse.blob();
    const contentType = blob.type || (fileExt === 'png' ? 'image/png' : 'image/jpeg');

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, blob, { contentType });

    if (uploadError) return { success: false, error: uploadError.message };

    const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    const { data, error: updateError } = await supabase
      .from('profiles')
      .update({ profile_photo: publicUrl, profile_photo_set: true })
      .eq('id', profile.id)
      .select('*')
      .maybeSingle();

    if (updateError) {
      await supabase.storage.from('profile-photos').remove([fileName]);
      return { success: false, error: updateError.message };
    }

    if (data) setProfile(data as ProfileRow);
    return { success: true };
  }, [profile]);

  const toggleAvailability = useCallback(() => {
    if (!profile) return;
    const newVal = !profile.is_available;
    supabase
      .from('profiles')
      .update({ is_available: newVal, worker_status: newVal ? 'available' : 'unavailable' })
      .eq('id', profile.id)
      .then(({ data }) => {
        if (data) setProfile(data[0] as ProfileRow);
      });
  }, [profile]);

  const handleSetWorkerStatus = useCallback((status: WorkerStatus) => {
    if (!profile) return;
    setWorkerStatus(status);
    supabase
      .from('profiles')
      .update({ worker_status: status, is_available: status === 'available' })
      .eq('id', profile.id)
      .then(({ data }) => {
        if (data && data[0]) setProfile(data[0] as ProfileRow);
      });
  }, [profile]);

  const claimJob = useCallback(async (jobId: string): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc('claim_job', { p_job_id: jobId });
    if (error) return { success: false, error: error.message };
    const result = data as RpcResult;
    if (result.success) {
      setJobs((prev) => prev.map((j) =>
        j.id === jobId ? { ...j, status: 'assigned' as JobStatus } : j
      ));
    }
    return result;
  }, []);

  const applyForJob = useCallback(async (
    jobId: string,
    message: string,
    proposedPrice?: number,
    estimatedDuration?: string,
  ): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc('apply_for_job', {
      p_job_id: jobId,
      p_message: message,
      p_proposed_price: proposedPrice ?? null,
      p_estimated_duration: estimatedDuration ?? '',
    });
    if (error) return { success: false, error: error.message };
    return data as RpcResult;
  }, []);

  const startJob = useCallback(async (jobId: string): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc('start_job', { p_job_id: jobId });
    if (error) return { success: false, error: error.message };
    const result = data as RpcResult;
    if (result.success) {
      setJobs((prev) => prev.map((j) =>
        j.id === jobId ? { ...j, status: 'in_progress' as JobStatus } : j
      ));
    }
    return result;
  }, []);

  const submitCompletion = useCallback(async (jobId: string, notes?: string): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc('submit_completion', {
      p_job_id: jobId,
      p_notes: notes ?? '',
    });
    if (error) return { success: false, error: error.message };
    const result = data as RpcResult;
    if (result.success) {
      setJobs((prev) => prev.map((j) =>
        j.id === jobId ? { ...j, status: 'awaiting_confirmation' as JobStatus } : j
      ));
    }
    return result;
  }, []);

  const cancelJob = useCallback(async (jobId: string, reason?: string): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc('cancel_job', {
      p_job_id: jobId,
      p_reason: reason ?? '',
    });
    if (error) return { success: false, error: error.message };
    const result = data as RpcResult;
    if (result.success) {
      setJobs((prev) => prev.map((j) =>
        j.id === jobId ? { ...j, status: 'cancelled' as JobStatus } : j
      ));
      setEmployerJobs((prev) => prev.map((j) =>
        j.id === jobId ? { ...j, rawStatus: 'cancelled' as JobStatus, status: 'Cancelled' as EmployerJobStatus } : j
      ));
    }
    return result;
  }, []);

  const declineJob = useCallback((jobId: string) => {
    setDeclinedJobIds((prev) => [...prev, jobId]);
  }, []);

  // ============================================================
  // Job photos (listing + work evidence)
  // ============================================================
  const loadWorkPhotos = useCallback(async (jobId: string) => {
    const { data, error } = await supabase
      .from('job_photos')
      .select('id, job_id, public_url, caption, photo_type, created_at')
      .eq('job_id', jobId)
      .eq('photo_type', 'work')
      .order('created_at', { ascending: true });
    if (!error && data) {
      const photos = (data as { id: string; job_id: string; public_url: string; caption: string; photo_type: PhotoType; created_at: string }[]).map((r) => ({
        id: r.id,
        jobId: r.job_id,
        publicUrl: r.public_url,
        caption: r.caption,
        photoType: r.photo_type,
        createdAt: r.created_at,
      }));
      setWorkPhotos((prev) => ({ ...prev, [jobId]: photos }));
    }
  }, []);

  const loadListingPhotos = useCallback(async (jobId: string) => {
    const { data, error } = await supabase
      .from('job_photos')
      .select('id, job_id, public_url, caption, photo_type, created_at')
      .eq('job_id', jobId)
      .eq('photo_type', 'listing')
      .order('created_at', { ascending: true });
    if (!error && data) {
      const photos = (data as { id: string; job_id: string; public_url: string; caption: string; photo_type: PhotoType; created_at: string }[]).map((r) => ({
        id: r.id,
        jobId: r.job_id,
        publicUrl: r.public_url,
        caption: r.caption,
        photoType: r.photo_type,
        createdAt: r.created_at,
      }));
      setListingPhotos((prev) => ({ ...prev, [jobId]: photos }));
    }
  }, []);

  const uploadPhotoToStorage = useCallback(async (jobId: string, uri: string, photoType: PhotoType, caption?: string): Promise<{ success: boolean; error?: string; photo?: WorkPhoto }> => {
    const { data: existing } = await supabase
      .from('job_photos')
      .select('id')
      .eq('job_id', jobId)
      .eq('photo_type', photoType);
    if (existing && existing.length >= 3) {
      return { success: false, error: 'Maximum 3 photos allowed per job.' };
    }

    const fileExt = (uri.match(/\.(jpe?g|png|webp|gif|heic)$/i)?.[1] ?? 'jpg').toLowerCase();
    const fileName = `${jobId}/${crypto.randomUUID()}.${fileExt}`;
    const filePath = `job-photos/${fileName}`;

    const fileResponse = await fetch(uri);
    const blob = await fileResponse.blob();
    const contentType = blob.type || (fileExt === 'png' ? 'image/png' : 'image/jpeg');

    const { error: uploadError } = await supabase.storage
      .from('job-photos')
      .upload(fileName, blob, { contentType });

    if (uploadError) return { success: false, error: uploadError.message };

    const { data: urlData } = supabase.storage.from('job-photos').getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    const { data: insertData, error: insertError } = await supabase
      .from('job_photos')
      .insert({
        job_id: jobId,
        storage_path: filePath,
        public_url: publicUrl,
        caption: caption ?? '',
        photo_type: photoType,
      })
      .select('id, job_id, public_url, caption, photo_type, created_at')
      .maybeSingle();

    if (insertError) {
      await supabase.storage.from('job-photos').remove([fileName]);
      return { success: false, error: insertError.message };
    }

    if (insertData) {
      const photo: WorkPhoto = {
        id: (insertData as { id: string }).id,
        jobId: (insertData as { job_id: string }).job_id,
        publicUrl: (insertData as { public_url: string }).public_url,
        caption: (insertData as { caption: string }).caption,
        photoType: (insertData as { photo_type: PhotoType }).photo_type,
        createdAt: (insertData as { created_at: string }).created_at,
      };
      return { success: true, photo };
    }
    return { success: true };
  }, []);

  const uploadWorkPhoto = useCallback(async (jobId: string, uri: string, caption?: string): Promise<{ success: boolean; error?: string }> => {
    const result = await uploadPhotoToStorage(jobId, uri, 'work', caption);
    if (result.success && result.photo) {
      setWorkPhotos((prev) => ({
        ...prev,
        [jobId]: [...(prev[jobId] ?? []), result.photo!],
      }));
    }
    return { success: result.success, error: result.error };
  }, [uploadPhotoToStorage]);

  const uploadJobPhoto = useCallback(async (jobId: string, uri: string): Promise<{ success: boolean; error?: string }> => {
    const result = await uploadPhotoToStorage(jobId, uri, 'listing');
    if (result.success && result.photo) {
      setListingPhotos((prev) => ({
        ...prev,
        [jobId]: [...(prev[jobId] ?? []), result.photo!],
      }));
    }
    return { success: result.success, error: result.error };
  }, [uploadPhotoToStorage]);

  const deleteWorkPhoto = useCallback(async (photoId: string, jobId: string, storagePath: string): Promise<{ success: boolean; error?: string }> => {
    const path = storagePath.replace('job-photos/', '');
    const { error: storageError } = await supabase.storage.from('job-photos').remove([path]);
    if (storageError) return { success: false, error: storageError.message };

    const { error: dbError } = await supabase.from('job_photos').delete().eq('id', photoId);
    if (dbError) return { success: false, error: dbError.message };

    setWorkPhotos((prev) => ({
      ...prev,
      [jobId]: (prev[jobId] ?? []).filter((p) => p.id !== photoId),
    }));
    return { success: true };
  }, []);

  // ============================================================
  // Employer actions
  // ============================================================
  const createEmployerJob = useCallback(async (job: {
    title: string;
    description: string;
    category: JobCategory;
    location: string;
    budget: number;
    scheduledDate: string;
    scheduledTime: string;
    fulfillmentMode: FulfillmentMode;
    pricingType: PricingType;
    preferredPaymentMethod: PreferredPaymentMethod;
    isRemote: boolean;
    photoUris?: string[];
  }): Promise<{ success: boolean; error?: string }> => {
    if (!profile) return { success: false, error: 'Not authenticated' };
    const { data: svc } = await supabase
      .from('services')
      .select('id')
      .eq('name', job.category)
      .maybeSingle();

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        employer_id: profile.id,
        service_id: svc?.id ?? null,
        title: job.title,
        description: job.description,
        job_location: job.location,
        budget: job.budget,
        budget_min: job.budget,
        budget_max: job.budget,
        pricing_type: job.pricingType,
        fulfillment_mode: job.fulfillmentMode,
        preferred_payment_method: job.preferredPaymentMethod,
        is_remote: job.isRemote,
        requested_date: job.scheduledDate,
        requested_time: job.scheduledTime,
        estimated_duration: '',
        status: 'open',
      })
      .select('*, service:services(*)')
      .maybeSingle();

    if (error) return { success: false, error: error.message };
    if (data) {
      const newJob = data as JobRow;
      setEmployerJobs((prev) => [jobRowToEmployerJob(newJob, 0), ...prev]);
      if (job.photoUris && job.photoUris.length > 0) {
        for (const uri of job.photoUris.slice(0, 3)) {
          await uploadJobPhoto(newJob.id, uri);
        }
      }
    }
    return { success: true };
  }, [profile, uploadJobPhoto]);

  const deleteEmployerJob = useCallback(async (jobId: string) => {
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    if (!error) {
      setEmployerJobs((prev) => prev.filter((j) => j.id !== jobId));
    } else {
      throw new Error(
        error.code === '42501'
          ? 'This job cannot be deleted because a worker has already accepted it.'
          : error.message
      );
    }
  }, []);

  const cancelEmployerJob = useCallback(async (jobId: string, reason?: string): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc('cancel_job', {
      p_job_id: jobId,
      p_reason: reason ?? '',
    });
    if (error) return { success: false, error: error.message };
    const result = data as RpcResult;
    if (result.success) {
      setEmployerJobs((prev) => prev.map((j) =>
        j.id === jobId ? { ...j, rawStatus: 'cancelled' as JobStatus, status: 'Cancelled' as EmployerJobStatus } : j
      ));
    }
    return result;
  }, []);

  const reopenJob = useCallback(async (jobId: string): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc('reopen_job', { p_job_id: jobId });
    if (error) return { success: false, error: error.message };
    const result = data as RpcResult;
    if (result.success) {
      setEmployerJobs((prev) => prev.map((j) =>
        j.id === jobId ? { ...j, rawStatus: 'open' as JobStatus, status: 'Open' as EmployerJobStatus } : j
      ));
    }
    return result;
  }, []);

  const confirmCompletion = useCallback(async (jobId: string): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc('confirm_completion', { p_job_id: jobId });
    if (error) return { success: false, error: error.message };
    const result = data as RpcResult;
    if (result.success) {
      setEmployerJobs((prev) => prev.map((j) =>
        j.id === jobId ? { ...j, rawStatus: 'completed' as JobStatus, status: 'Completed' as EmployerJobStatus } : j
      ));
    }
    return result;
  }, []);

  const selectWorker = useCallback(async (applicationId: string): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc('select_worker', { p_application_id: applicationId });
    if (error) return { success: false, error: error.message };
    const result = data as RpcResult;
    if (result.success && result.job_id) {
      setEmployerJobs((prev) => prev.map((j) =>
        j.id === result.job_id ? { ...j, rawStatus: 'assigned' as JobStatus, status: 'Worker selected' as EmployerJobStatus } : j
      ));
    }
    return result;
  }, []);

  const loadApplications = useCallback(async (jobId: string) => {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*, worker:profiles!worker_id(*)')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });
    if (!error && data) {
      const apps = (data as JobApplicationRow[]).map(appRowToApplication);
      setJobApplications((prev) => ({ ...prev, [jobId]: apps }));
    }
  }, []);

  const loadEarnings = useCallback(async () => {
    if (!profile) return;
    const { data: earnData, error: earnErr } = await supabase
      .from('earnings')
      .select('*')
      .eq('worker_id', profile.id)
      .order('created_at', { ascending: false });
    if (earnErr || !earnData) return;

    const rows = earnData as EarningRow[];

    const jobIds = rows.map((r) => r.job_id).filter(Boolean) as string[];
    let jobTitleMap: Record<string, string> = {};
    if (jobIds.length > 0) {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('id, title')
        .in('id', jobIds);
      if (jobData) {
        jobTitleMap = (jobData as { id: string; title: string }[]).reduce((acc, j) => {
          acc[j.id] = j.title;
          return acc;
        }, {} as Record<string, string>);
      }
    }

    const paymentIds = rows.map((r) => r.payment_id).filter(Boolean) as string[];
    let paymentMethodMap: Record<string, PaymentMethod> = {};
    if (paymentIds.length > 0) {
      const { data: payData } = await supabase
        .from('payments')
        .select('id, method')
        .in('id', paymentIds);
      if (payData) {
        paymentMethodMap = (payData as { id: string; method: PaymentMethod }[]).reduce((acc, p) => {
          acc[p.id] = p.method;
          return acc;
        }, {} as Record<string, PaymentMethod>);
      }
    }

    const activities: EarningsActivity[] = rows.map((r) => ({
      id: r.id,
      title: jobTitleMap[r.job_id] ?? 'Job',
      jobTitle: jobTitleMap[r.job_id] ?? 'Job',
      dateLabel: new Date(r.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
      status: r.status,
      amount: Number(r.amount),
      grossAmount: Number(r.gross_amount ?? r.amount),
      commissionAmount: Number(r.commission_amount ?? 0),
      paymentMethod: r.payment_id ? (paymentMethodMap[r.payment_id] ?? null) : null,
    }));
    setEarnings(activities);

    const available = rows.filter((r) => r.status === 'available').reduce((s, r) => s + Number(r.amount), 0);
    const pending = rows.filter((r) => r.status === 'pending').reduce((s, r) => s + Number(r.amount), 0);
    const cashCompleted = rows.filter((r) => r.status === 'cash_completed').reduce((s, r) => s + Number(r.amount), 0);
    const total = rows.reduce((s, r) => s + Number(r.amount), 0);
    const grossEarnings = rows.reduce((s, r) => s + Number(r.gross_amount ?? r.amount), 0);
    const totalCommission = rows.reduce((s, r) => s + Number(r.commission_amount ?? 0), 0);
    setEarningsSummary({ available, pending, cashCompleted, total, grossEarnings, totalCommission });

    const { data: wdData } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('worker_id', profile.id)
      .order('created_at', { ascending: false });
    setWithdrawals((wdData ?? []) as WithdrawalRow[]);
  }, [profile]);

  // ============================================================
  // Realtime: earnings update live when employer pays or confirms
  // ============================================================
  useEffect(() => {
    if (!profile || profile.role !== 'worker') return;
    const channel = supabase
      .channel('earnings_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'earnings', filter: `worker_id=eq.${profile.id}` }, () => {
        loadEarnings();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jobs', filter: `assigned_worker_id=eq.${profile.id}` }, () => {
        loadWorkerData(profile);
        loadEarnings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [profile, loadEarnings, loadWorkerData]);

  const requestWithdrawal = useCallback(async (amount: number, method: 'cash' | 'bank_transfer' | 'e_wallet'): Promise<RpcResult> => {
    const { data, error } = await supabase.rpc('request_withdrawal', {
      p_amount: amount,
      p_method: method,
      p_bank_details: {},
    });
    if (error) return { success: false, error: error.message };
    const result = data as RpcResult;
    if (result.success) {
      await loadEarnings();
    }
    return result;
  }, [loadEarnings]);

  const updateEmployerProfile = useCallback(async (updates: Partial<EmployerProfile>) => {
    if (!profile) return;
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name !== undefined) {
      const parts = updates.name.split(' ');
      dbUpdates.display_name = updates.name;
      dbUpdates.first_name = parts[0] ?? '';
      dbUpdates.surname = parts.slice(1).join(' ');
    }
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.location !== undefined) dbUpdates.primary_location = updates.location;
    if (updates.accountType !== undefined) dbUpdates.account_type = updates.accountType;

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', profile.id)
      .select('*')
      .maybeSingle();
    if (!error && data) setProfile(data as ProfileRow);
  }, [profile]);

  // ============================================================
  // Derived data
  // ============================================================
  const availableJobs = jobs.filter(
    (j) => j.status === 'open' && !declinedJobIds.includes(j.id),
  );
  const activeJobs = jobs.filter(
    (j) => ['assigned', 'in_progress', 'awaiting_confirmation'].includes(j.status),
  );
  const recommendedJob =
    availableJobs.find((j) => worker.services.includes(j.category)) ?? availableJobs[0] ?? null;

  const value: AppStore = {
    isAuthenticated,
    isAuthLoading,
    role,
    login,
    register,
    registerEmployer,
    logout,
    worker,
    updateWorker,
    uploadProfilePhoto,
    toggleAvailability,
    workerStatus,
    setWorkerStatus: handleSetWorkerStatus,
    jobs,
    claimJob,
    applyForJob,
    startJob,
    submitCompletion,
    cancelJob,
    declineJob,
    recommendedJob,
    availableJobs,
    activeJobs,
    declinedJobIds,
    refreshJobs,
    employer,
    employerJobs,
    candidates,
    jobApplications,
    createEmployerJob,
    deleteEmployerJob,
    cancelEmployerJob,
    reopenJob,
    confirmCompletion,
    selectWorker,
    loadApplications,
    updateEmployerProfile,
    earnings,
    earningsSummary,
    loadEarnings,
    requestWithdrawal,
    withdrawals,
    workPhotos,
    listingPhotos,
    uploadWorkPhoto,
    uploadJobPhoto,
    deleteWorkPhoto,
    loadWorkPhotos,
    loadListingPhotos,
    skillDemand,
    loadSkillDemand,
    skillGapAnalysis,
    skillGapLanguage,
    setSkillGapLanguage,
    loadSkillGapAnalysis,
    generateSkillGapAnalysis,
    addSkillMilestone,
    updateMilestoneStatus,
    skillGapLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
