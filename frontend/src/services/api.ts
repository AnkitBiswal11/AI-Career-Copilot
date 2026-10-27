const API_BASE_URL =
  import.meta.env["VITE_API_URL"] ||
  "https://ai-career-copilot-backend-tptj.onrender.com";

type ApiErrorResponse = {
  detail?: string | { msg?: string }[];
  message?: string;
};

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = window.localStorage.getItem("access_token");

  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const errorData =
        (await response.json()) as ApiErrorResponse;

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      } else if (Array.isArray(errorData.detail)) {
        message = errorData.detail
          .map((item) => item.msg || "Validation error")
          .join(", ");
      } else if (errorData.message) {
        message = errorData.message;
      }
    } catch {
      // Keep the default HTTP error message.
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export type Resume = {
  id: number;
  filename: string;
  analysis?: Record<string, unknown> | null;
};

export type Job = {
  id: number;
  title: string;
  company: string;
};

export type DashboardData = {
  latest_resume: {
    id: number;
    filename: string;
  } | null;
  resumes: Resume[];
  jobs: Job[];
};

export type JobData = {
  title: string;
  company: string;
  description: string;
};

export type CreateJobResponse = {
  message: string;
  job_id: number;
  title: string;
  company: string;
};

export type JobMatchAnalysis = {
  match_score: number;
  recommendation: string;
  matching_skills: string[];
  missing_skills: string[];
  recommended_learning: string[];
  strengths: string[];
  weaknesses: string[];
  interview_topics: string[];
};

export type JobMatchResponse = {
  job_id?: number;
  resume_id?: number;
  job_title: string;
  company: string;
  analysis: JobMatchAnalysis;
};

export type SkillGap = {
  skill: string;
  current: number;
  required: number;
  gap: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  learning_days: number;
  reason: string;
  learning_plan: string[];
};

export type SkillGapAnalysis = {
  readiness_score: number;
  skill_gaps: SkillGap[];
  strengths: string[];
  top_priorities: string[];
  career_insights: string[];
  quick_wins: string[];
  error?: string;
};

export type SkillGapResponse = {
  resume_id: number;
  job_id: number;
  job_title: string;
  company: string;
  analysis: SkillGapAnalysis;
};

const api = {
  async dashboard(): Promise<DashboardData> {
    return request<DashboardData>("/dashboard/");
  },

  async getDashboard(): Promise<DashboardData> {
    return request<DashboardData>("/dashboard/");
  },

  async getResume(resumeId: number | string): Promise<Resume> {
    return request<Resume>(`/resumes/${encodeURIComponent(resumeId)}`);
  },

  async createJob(data: JobData): Promise<CreateJobResponse> {
    return request<CreateJobResponse>("/jobs/", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async updateJob(
    jobId: number,
    data: JobData,
  ): Promise<CreateJobResponse> {
    return request<CreateJobResponse>(`/jobs/${jobId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async matchResumeWithJob(
    jobId: number,
    resumeId: number | string,
  ): Promise<Record<string, unknown>> {
    return request<Record<string, unknown>>(
      `/jobs/${jobId}/match/${encodeURIComponent(resumeId)}`,
      {
        method: "POST",
      },
    );
  },

  async matchJob(
    jobId: number,
    resumeId: number | string,
  ): Promise<Record<string, unknown>> {
    return this.matchResumeWithJob(jobId, resumeId);
  },

  async analyzeSkillGap(
    resumeId: number | string,
    jobId: number | string,
  ): Promise<SkillGapResponse> {
    return request<SkillGapResponse>(
      `/skill-gap/analyze?resume_id=${encodeURIComponent(
        String(resumeId),
      )}&job_id=${encodeURIComponent(String(jobId))}`,
      {
        method: "POST",
      },
    );
  },
};

export default api;

export { api };
