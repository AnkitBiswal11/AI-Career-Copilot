
import type { AuthResponse, JobMatch } from "@/types/api";

/* =========================================================
   API CONFIGURATION
   ========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000";

/* =========================================================
   AUTH TOKEN STORE
   ========================================================= */

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export const tokenStore = {
  get(): string | null {
    return localStorage.getItem("token");
  },

  set(token: string) {
    localStorage.setItem("token", token);
  },

  clear() {
    localStorage.removeItem("token");
  },
};

/**
 * Register a callback that runs whenever the API receives
 * a 401 Unauthorized response.
 */
export function onUnauthorized(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

/* =========================================================
   REQUEST TYPES
   ========================================================= */

type RequestOptions = RequestInit & {
  token?: string;
};

/* =========================================================
   API ERROR
   ========================================================= */

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(
    message: string,
    status: number,
    data: unknown = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/* =========================================================
   REQUEST HELPER
   ========================================================= */

async function request<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);

  // Don't set Content-Type for FormData.
  if (!(fetchOptions.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Use explicitly provided token first.
  const authToken = token ?? tokenStore.get();

  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      unauthorizedHandler?.();
    }

    let errorMessage = "Something went wrong.";
    let errorData: unknown = null;

    try {
      errorData = await response.json();

      if (
        typeof errorData === "object" &&
        errorData !== null &&
        "detail" in errorData
      ) {
        const detail = (
          errorData as { detail?: unknown }
        ).detail;

        if (typeof detail === "string") {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail
            .map((item) => {
              if (
                typeof item === "object" &&
                item !== null &&
                "msg" in item
              ) {
                return String(
                  (item as { msg?: unknown }).msg ??
                    "Validation error",
                );
              }

              return "Validation error";
            })
            .join(", ");
        }
      } else if (
        typeof errorData === "object" &&
        errorData !== null &&
        "message" in errorData
      ) {
        const message = (
          errorData as { message?: unknown }
        ).message;

        if (typeof message === "string") {
          errorMessage = message;
        }
      }
    } catch {
      errorMessage =
        response.statusText || errorMessage;
    }

    throw new ApiError(
      errorMessage,
      response.status,
      errorData,
    );
  }

  return response.json();
}

/* =========================================================
   GENERAL TYPES
   ========================================================= */

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

/* =========================================================
   PROFILE TYPES
   ========================================================= */

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  target_role: string | null;
  experience_level: string | null;
  preferred_location: string | null;
  college: string | null;
  graduation_year: string | null;
}

export interface UserProfileUpdate {
  name: string;
  target_role: string | null;
  experience_level: string | null;
  preferred_location: string | null;
  college: string | null;
  graduation_year: string | null;
}

/* =========================================================
   SETTINGS TYPES
   ========================================================= */

export interface UserSettings {
  weeklyDigest: boolean;
  skillGapAlerts: boolean;
  streakReminders: boolean;
  aggressiveMode: boolean;
  includeGenAI: boolean;
  prioritizeDSA: boolean;
}

export type UserSettingsUpdate = UserSettings;

/* =========================================================
   ROADMAP TYPES
   ========================================================= */

export interface RoadmapItem {
  id: number;
  label: string;
  done: boolean;
}

export interface RoadmapStage {
  id: number;
  stage_number: number;
  title: string;
  description: string;
  duration_days: number;
  completion: number;
  status: "completed" | "current" | "upcoming";
  items: RoadmapItem[];
}

export interface CareerRoadmap {
  id: number;
  target_role: string;
  readiness_score: number;
  summary: string;
  insights: string[];
  recommendations: string[];
  total_days: number;
  overall_completion: number;
  stages: RoadmapStage[];
}

/* =========================================================
   API
   ========================================================= */

export const api = {
  /* =======================================================
     AUTH
     ======================================================= */

  async register(data: RegisterData) {
    return request<{
      message: string;
      user_id: number;
      name: string;
      email: string;
    }>("/users/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async login(data: LoginData) {
    const response = await request<AuthResponse>(
      "/users/login",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );

    if (response.access_token) {
      tokenStore.set(response.access_token);
    }

    return response;
  },

  async me() {
    return request<UserProfile>("/users/me");
  },

  async getProfile() {
    return request<UserProfile>("/users/me");
  },

  async updateProfile(data: UserProfileUpdate) {
    return request<UserProfile>("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  logout() {
    tokenStore.clear();
  },

  /* =======================================================
     SETTINGS
     ======================================================= */

  async getSettings() {
    return request<UserSettings>("/users/me/settings", {
      method: "GET",
    });
  },

  async updateSettings(data: UserSettingsUpdate) {
    return request<UserSettings>("/users/me/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  /* =======================================================
     DASHBOARD
     ======================================================= */

  async getDashboard() {
    return request<{
      user: UserProfile;
      total_resumes: number;
      total_jobs: number;
      latest_resume: {
        id: number;
        filename: string;
      } | null;
      resume_score: number;
      candidate_summary: string;
      technical_skills: string[];
      soft_skills: string[];
      strengths: string[];
      weaknesses: string[];
      missing_skills: string[];
      suitable_job_roles: string[];
      skill_scores: Array<{
        skill: string;
        score: number;
      }>;
      improvement_suggestions: string[];
      placement_preparation_plan: string[];
      resumes: Array<{
        id: number;
        filename: string;
      }>;
      jobs: Array<{
        id: number;
        title: string;
        company: string;
      }>;
    }>("/dashboard/");
  },

  async dashboard() {
    return this.getDashboard();
  },

  /* =======================================================
     RESUME
     ======================================================= */

  async uploadResume(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return request<{
      message: string;
      resume_id: number;
      filename: string;
    }>("/resumes/upload", {
      method: "POST",
      body: formData,
    });
  },

  async analyzeResume(resumeId: number) {
    return request<{
      message?: string;
      resume_id: number;
      analysis: {
        resume_score: number;
        candidate_summary: string;
        technical_skills: string[];
        soft_skills: string[];
        strengths: string[];
        weaknesses: string[];
        missing_skills: string[];
        suitable_job_roles: string[];
        improvement_suggestions: string[];
        placement_preparation_plan: string[];
        skill_scores: Array<{
          skill: string;
          score: number;
        }>;
      };
    }>(`/resumes/${resumeId}/analyze`, {
      method: "POST",
    });
  },

  async getResume(resumeId: number | string) {
    return request<{
      id: number;
      filename: string;
      extracted_text?: string;
      analysis?: string | null;
    }>(`/resumes/${resumeId}`, {
      method: "GET",
    });
  },

  /* =======================================================
     JOBS
     ======================================================= */

  async createJob(data: {
    title: string;
    company: string;
    description: string;
  }) {
    return request<{
      message: string;
      job_id: number;
      title: string;
      company: string;
    }>("/jobs/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async matchResumeWithJob(
    jobId: number,
    resumeId: number,
  ) {
    return request<{
      job_id: number;
      resume_id: number;
      company: string;
      job_title: string;
      analysis: JobMatch;
    }>(`/jobs/${jobId}/match/${resumeId}`, {
      method: "POST",
    });
  },

  async matchJob(
    jobId: number,
    resumeId: number,
  ) {
    return this.matchResumeWithJob(jobId, resumeId);
  },

  /* =======================================================
     SKILL GAP
     ======================================================= */

  async analyzeSkillGap(
    resumeId: number,
    jobId: number,
  ) {
    const query = new URLSearchParams({
      resume_id: String(resumeId),
      job_id: String(jobId),
    });

    return request<{
      resume_id: number;
      job_id: number;
      job_title: string;
      company: string;
      analysis: {
        readiness_score: number;
        skill_gaps: Array<{
          skill: string;
          current: number;
          required: number;
          gap: number;
          priority: "HIGH" | "MEDIUM" | "LOW";
          learning_days: number;
          reason: string;
          learning_plan: string[];
        }>;
        strengths: string[];
        top_priorities: string[];
        career_insights: string[];
        quick_wins: string[];
      };
    }>(`/skill-gap/analyze?${query.toString()}`, {
      method: "POST",
    });
  },

  /* =======================================================
     CAREER ROADMAP
     ======================================================= */

  async getCareerRoadmap(
    resumeId: number,
    jobId: number,
    force = false,
  ) {
    const query = new URLSearchParams({
      resume_id: String(resumeId),
      job_id: String(jobId),
      force: String(force),
    });

    return request<{
      message?: string;
      resume_id: number;
      job_id: number;
      job_title: string;
      company: string;
      roadmap: CareerRoadmap;
    }>(`/roadmap/generate?${query.toString()}`, {
      method: "POST",
    });
  },

  /* =======================================================
     ROADMAP ITEM PERSISTENCE
     ======================================================= */

  async updateRoadmapItem(
    itemId: number,
    done: boolean,
  ) {
    return request<{
      message: string;
      item_id: number;
      stage_id: number;
      done: boolean;
      stage_completion: number;
      overall_completion: number;
    }>(`/roadmap/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ done }),
    });
  },

  /* =======================================================
     INTERVIEW
     ======================================================= */

  async startInterview(data: {
    resume_id: number;
    job_id?: number;
    role?: string;
    difficulty?: string;
    interview_type?: string;
    total_questions?: number;
  }) {
    return request<{
      session_id: number;
      role?: string;
      interview_type?: string;
      difficulty?: string;
      total_questions?: number;
      question_id: number;
      question: string;
    }>("/interview/start", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async evaluateInterviewAnswer(data: {
    session_id: number;
    question_id: number;
    answer: string;
  }) {
    return request<{
      question_id: number;
      score: number;
      feedback: string;
      strengths: string[];
      weaknesses?: string[];
      improvement_tips?: string[];
      improvements?: string[];
      ideal_answer?: string;
      next_question?: string;
      next_question_id?: number;
      interview_complete?: boolean;
      overall_score?: number;
    }>("/interview/evaluate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async getNextInterviewQuestion(sessionId: number) {
    return request<{
      question_id: number;
      question: string;
      question_number?: number;
      total_questions?: number;
      interview_complete?: boolean;
    }>(`/interview/${sessionId}/next`, {
      method: "GET",
    });
  },

  async getInterviewHistory() {
    return request<
      Array<{
        session_id: number;
        role?: string;
        score?: number;
        total_questions?: number;
        completed_at?: string;
        created_at?: string;
      }>
    >("/interview/history", {
      method: "GET",
    });
  },

  /* =======================================================
     AI CAREER COACH
     ======================================================= */

  async askCoach(message: string) {
    return request<{
      answer: string;
      action_items: string[];
      related_skills: string[];
    }>("/coach/chat", {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  },
};

export default api;