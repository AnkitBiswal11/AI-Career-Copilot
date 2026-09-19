export interface User {
  id: number | string;
  full_name: string;
  email: string;
  target_role?: string;
  experience_level?: string;
  preferred_location?: string;
  college?: string;
  graduation_year?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type?: string;
  user?: User;
}

export interface TrendPoint {
  label: string;
  value: number;
}

export interface CareerReadiness {
  score: number;
  delta: number;
  breakdown: { dimension: string; score: number }[];
  history: TrendPoint[];
}

export interface ResumeAnalysis {
  resume_id?: number | string;
  score: number;
  ats_score: number;
  technical_skills: number;
  projects: number;
  achievements: number;
  breakdown: { label: string; value: number }[];
  strengths: { title: string; detail: string }[];
  improvements: { title: string; detail: string }[];
}

export interface JobMatchAnalysis {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
  strengths: string[];
  weaknesses: string[];
  recommended_learning: string[];
  interview_topics: string[];
  recommendation: "APPLY" | "APPLY WITH PREPARATION" | "NOT READY";
}

export interface JobMatch {
  job_id: number | string;
  resume_id: number | string;
  company: string | null;
  job_title: string | null;
  analysis: JobMatchAnalysis;
}

export interface SkillGap {
  skill: string;
  current: number;
  required: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  learning_days: number;
}

export interface RoadmapStage {
  id: string;
  title: string;
  status: "completed" | "current" | "upcoming";
  completion: number;
  duration: string;
  items: { label: string; done: boolean }[];
}

export interface LearningProgress {
  total_hours: number;
  weekly_goal: number;
  goal_completion: number;
  streak_days: number;
  weekly: TrendPoint[];
  distribution: TrendPoint[];
  improvement: { month: string; python: number; dsa: number; genai: number }[];
}

export interface InterviewProgress {
  readiness: number;
  questions_completed: number;
  questions_total: number;
  categories: { label: string; value: number }[];
  radar: { topic: string; score: number }[];
  weekly: TrendPoint[];
}

export interface DashboardData {
  readiness: CareerReadiness;
  resume: ResumeAnalysis;
  matches: JobMatch[];
  skill_gaps: SkillGap[];
  next_action: {
    title: string;
    why: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    estimate: string;
    cta: string;
  };
}
