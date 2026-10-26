export type AppRole = 'worker' | 'employer';
export type WorkerStatus = 'available' | 'busy' | 'unavailable';

// Job lifecycle statuses (DB-enforced)
export type JobStatus =
  | 'draft'
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'awaiting_confirmation'
  | 'completed'
  | 'cancelled'
  | 'expired';

export type FulfillmentMode = 'instant_accept' | 'application';

export type PricingType = 'fixed' | 'hourly' | 'quote';

export type CancellationBy = 'employer' | 'worker' | 'system';

// Employer-facing status labels (derived from DB status)
export type EmployerJobStatus =
  | 'Draft'
  | 'Open'
  | 'Worker selected'
  | 'In progress'
  | 'Awaiting confirmation'
  | 'Completed'
  | 'Cancelled'
  | 'Expired';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'closed';
export type CredentialVerificationStatus = 'not_verified' | 'verified' | 'rejected';

export type JobCategory =
  | 'Cleaning'
  | 'Gardening'
  | 'Moving Assistance'
  | 'Painting'
  | 'Car Washing'
  | 'Event Assistance'
  | 'General Labour'
  | 'Plumbing'
  | 'Electrical'
  | 'Carpentry'
  | 'Welding'
  | 'Tiling'
  | 'Mechanics'
  | 'Solar Installation'
  | 'Digital'
  | 'Remote'
  | 'Other';

export type ExperienceLevel = 'New to the trade' | '1–2 years' | '3–5 years' | '5+ years';

export type VerificationState = 'verified' | 'not_verified' | 'not_provided';

export interface VerificationItem {
  label: string;
  status: VerificationState;
  description: string;
}

// ============================================================
// Database row types (match Supabase schema)
// ============================================================

export interface ProfileRow {
  id: string;
  first_name: string;
  surname: string;
  display_name: string;
  phone: string | null;
  email: string | null;
  preferred_language: string;
  bio: string;
  profile_photo: string;
  role: AppRole;
  account_type: 'Household' | 'Landlord' | 'Small business' | 'Organisation' | null;
  primary_location: string;
  service_areas: string[] | string;
  availability: { days?: string[] } | string;
  worker_status: WorkerStatus;
  identity_verified: boolean;
  is_available: boolean;
  experience_level: string;
  experience_detail: string;
  qualifications_summary: VerificationItem[] | string;
  profile_photo_set: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceRow {
  id: string;
  name: JobCategory;
  category: 'General Work' | 'Skilled Services';
  slug: string;
  active: boolean;
  created_at: string;
}

export interface WorkerServiceRow {
  id: string;
  worker_id: string;
  service_id: string;
  experience_level: string;
  years_experience: string;
  description: string;
  starting_price: number;
  pricing_type: string;
  active: boolean;
  created_at: string;
  service?: ServiceRow;
}

export interface JobRow {
  id: string;
  employer_id: string;
  assigned_worker_id: string | null;
  service_id: string | null;
  title: string;
  description: string;
  job_location: string;
  private_address: string;
  budget: number;
  budget_min: number | null;
  budget_max: number | null;
  agreed_price: number | null;
  pricing_type: PricingType;
  fulfillment_mode: FulfillmentMode;
  currency: string;
  materials_provided: boolean;
  status: JobStatus;
  application_deadline: string | null;
  scheduled_start_at: string | null;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string;
  cancellation_by: CancellationBy | null;
  requested_date: string | null;
  requested_time: string | null;
  confirmed_date: string | null;
  confirmed_time: string | null;
  estimated_duration: string;
  materials_required: string;
  latitude: number;
  longitude: number;
  preferred_payment_method: PreferredPaymentMethod;
  is_remote: boolean;
  completion_details: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  service?: ServiceRow;
  employer?: ProfileRow;
  assigned_worker?: ProfileRow;
}

export interface JobApplicationRow {
  id: string;
  job_id: string;
  worker_id: string;
  message: string;
  proposed_price: number | null;
  estimated_duration: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  worker?: ProfileRow;
  job?: JobRow;
}

export interface ReviewRow {
  id: string;
  job_id: string;
  reviewer_id: string;
  reviewed_id: string;
  rating: number;
  written_review: string;
  is_visible: boolean;
  created_at: string;
  reviewer?: ProfileRow;
}

export interface WorkerCredentialRow {
  id: string;
  worker_id: string;
  credential_name: string;
  institution: string;
  type: string;
  field_of_study: string;
  issue_date: string | null;
  expiry_date: string | null;
  document_path: string;
  verification_status: CredentialVerificationStatus;
  reviewer_id: string | null;
  review_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// RPC result types
// ============================================================

export interface RpcResult {
  success: boolean;
  error?: string;
  job_id?: string;
  title?: string;
  status?: string;
  assigned_worker_id?: string;
  assigned_at?: string;
  worker_id?: string;
  cancelled_by?: string;
}

// ============================================================
// UI-facing types (adapter layer between DB rows and components)
// ============================================================

export interface Job {
  id: string;
  title: string;
  description: string;
  category: JobCategory;
  price: number;
  location: string;
  isRemote: boolean;
  latitude: number;
  longitude: number;
  distanceKm: number;
  scheduledDate: string;
  scheduledTime: string;
  estimatedDuration: string;
  status: JobStatus;
  fulfillmentMode: FulfillmentMode;
  pricingType: PricingType;
  preferredPaymentMethod: PreferredPaymentMethod;
  employerName?: string;
  createdAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  workerId: string;
  workerName: string;
  workerLocation: string;
  workerServices: JobCategory[];
  message: string;
  proposedPrice: number | null;
  estimatedDuration: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface EmployerJob {
  id: string;
  title: string;
  description: string;
  category: JobCategory;
  location: string;
  budget: number;
  scheduledDate: string;
  scheduledTime: string;
  status: EmployerJobStatus;
  rawStatus: JobStatus;
  fulfillmentMode: FulfillmentMode;
  preferredPaymentMethod: PreferredPaymentMethod;
  applications: number;
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  services: JobCategory[];
  experience: ExperienceLevel;
  location: string;
  rating: number;
  completedJobs: number;
  verificationCount: number;
  isAvailable: boolean;
  rate: number;
  photo: string;
}

export interface EmployerProfile {
  id: string;
  name: string;
  accountType: 'Household' | 'Landlord' | 'Small business' | 'Organisation';
  phone: string;
  email: string;
  location: string;
  jobsPosted: number;
  jobsCompleted: number;
}

// ============================================================
// Earnings & Payments types
// ============================================================

export type EarningStatus = 'pending' | 'cash_completed' | 'available' | 'withdrawn';
export type PreferredPaymentMethod = 'cash' | 'card';
export type PaymentMethod = 'cash' | 'eft' | 'card';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type WithdrawalMethod = 'cash' | 'bank_transfer' | 'e_wallet';
export type WithdrawalStatus = 'requested' | 'processing' | 'completed' | 'rejected';

export interface EarningRow {
  id: string;
  worker_id: string;
  job_id: string;
  employer_id: string;
  amount: number;
  gross_amount: number;
  commission_amount: number;
  currency: string;
  status: EarningStatus;
  payment_id: string | null;
  cash_confirmed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentRow {
  id: string;
  job_id: string;
  employer_id: string;
  worker_id: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRow {
  id: string;
  worker_id: string;
  amount: number;
  method: WithdrawalMethod;
  status: WithdrawalStatus;
  bank_details: Record<string, unknown>;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EarningsSummary {
  available: number;
  pending: number;
  cashCompleted: number;
  total: number;
  grossEarnings: number;
  totalCommission: number;
}

export interface EarningsActivity {
  id: string;
  title: string;
  dateLabel: string;
  status: EarningStatus;
  amount: number;
  grossAmount: number;
  commissionAmount: number;
  jobTitle: string;
  paymentMethod: PaymentMethod | null;
}

export type PhotoType = 'listing' | 'work';

export interface WorkPhoto {
  id: string;
  jobId: string;
  publicUrl: string;
  caption: string;
  photoType: PhotoType;
  createdAt: string;
}

export interface SkillDemand {
  service: JobCategory;
  category: 'General Work' | 'Skilled Services';
  totalJobs: number;
  openJobs: number;
  workerCount: number;
}

export interface SkillMilestone {
  id: string;
  skill: string;
  title: string;
  description: string;
  steps: string[];
  estimatedTime: string;
  resources: string[];
  prerequisites: string;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface SkillGapAnalysis {
  id: string;
  workerId: string;
  currentSkills: string[];
  experienceLevel: string;
  location: string;
  summary: string;
  milestones: SkillMilestone[];
  skillSnapshotHash: string;
  updatedAt: string;
}

export interface SkillGapRow {
  id: string;
  worker_id: string;
  current_skills: string[];
  experience_level: string;
  location: string;
  summary: string;
  milestones: SkillMilestone[];
  skill_snapshot_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  name: string;
  phone: string;
  email: string;
  bio: string;
  photo: string;
  services: JobCategory[];
  experience: ExperienceLevel;
  experienceDetail: string;
  location: string;
  serviceAreas: string[];
  isAvailable: boolean;
  preferredLanguage: string;
  availabilityDays: string[];
  qualifications: VerificationItem[];
  profilePhotoSet: boolean;
}
