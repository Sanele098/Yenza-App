export type AiMode = "learn" | "do";
export type AiLanguage = "en" | "zu";
export type AiConfidence = "low" | "medium" | "high";

export interface AiTool {
  name: string;
  essential: boolean;
  hasIt: boolean;
}

export interface AiStep {
  title: string;
  instruction: string;
  safetyNote?: string;
  completed: boolean;
}

export interface AiDiagnosis {
  problemTitle: string;
  explanation: string;
  safetyWarning: string;
  needsProfessional: boolean;
  tools: AiTool[];
  steps: AiStep[];
  estimatedTime: string;
  estimatedCost: string;
  confidence: AiConfidence;
}

export interface AiFollowUpAnswer {
  answer: string;
}

// ---- DB row types ----

export interface AiDiagnosisRow {
  id: string;
  worker_id: string;
  job_id: string | null;
  mode: AiMode;
  language: AiLanguage;
  description: string;
  photo_url: string | null;
  problem_title: string;
  explanation: string;
  safety_warning: string;
  needs_professional: boolean;
  tools: { name: string; essential: boolean }[];
  steps: { title: string; instruction: string; safetyNote?: string }[];
  estimated_time: string;
  estimated_cost: string;
  confidence: AiConfidence;
  created_at: string;
}

export interface AiConversationRow {
  id: string;
  diagnosis_id: string;
  worker_id: string;
  role: "worker" | "ai";
  message: string;
  created_at: string;
}

export interface AiDiagnosisWithConversation extends AiDiagnosisRow {
  conversation: AiConversationRow[];
}
