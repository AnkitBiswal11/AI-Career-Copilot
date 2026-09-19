import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Briefcase,
  CheckCircle2,
  FileText,
  Lightbulb,
  Loader2,
  Target,
  TrendingUp,
  Sparkles,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/services/api";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

type SkillScore = {
  skill: string;
  score: number;
};

type DashboardData = {
  user: {
    id: number | string;
    name: string;
    email: string;
  };

  total_resumes: number;
  total_jobs: number;

  latest_resume: {
    id: number | string;
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

  skill_scores: SkillScore[];

  improvement_suggestions: string[];
  placement_preparation_plan: string[];

  resumes: {
    id: number | string;
    filename: string;
  }[];

  jobs: {
    id: number | string;
    title: string | null;
    company: string | null;
  }[];
};

function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const result = await api.dashboard();

      console.log("🔥 REAL DASHBOARD DATA:", result);

      setData(result as DashboardData);
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  }

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------

  if (loading) {
    return (
      <AppShell
        title="Career Overview"
        subtitle="Your placement progress and AI career insights."
      >
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading your career dashboard...</span>
          </div>
        </div>
      </AppShell>
    );
  }

  // ---------------------------------------------------------
  // Error
  // ---------------------------------------------------------

  if (error) {
    return (
      <AppShell
        title="Career Overview"
        subtitle="Your placement progress and AI career insights."
      >
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <h2 className="text-xl font-semibold">
              Dashboard couldn't load
            </h2>

            <p className="mt-2 text-muted-foreground">{error}</p>

            <button
              onClick={loadDashboard}
              className="mt-5 rounded-lg bg-primary px-5 py-2.5 text-primary-foreground transition hover:opacity-90"
            >
              Try again
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!data) {
    return null;
  }

  // ---------------------------------------------------------
  // Calculations
  // ---------------------------------------------------------

  const resumeScore = Number(data.resume_score || 0);

  const safeScore = Math.min(Math.max(resumeScore, 0), 100);

  const scoreLabel =
    safeScore >= 80
      ? "Excellent"
      : safeScore >= 60
        ? "Good"
        : safeScore >= 40
          ? "Needs improvement"
          : "Early stage";

  const skillScores = data.skill_scores
    .map((item) => Number(item.score) || 0)
    .filter((score) => score >= 0);

  const averageSkillScore =
    skillScores.length > 0
      ? skillScores.reduce((sum, score) => sum + score, 0) /
        skillScores.length
      : 0;

  const placementReadiness = Math.round(
    safeScore * 0.6 + averageSkillScore * 0.4
  );

  const readinessLabel =
    placementReadiness >= 80
      ? "Placement Ready"
      : placementReadiness >= 65
        ? "Almost Ready"
        : placementReadiness >= 45
          ? "Needs Preparation"
          : "Getting Started";

  // ---------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------

  return (
    <AppShell
      title="Career Overview"
      subtitle="Your placement progress and AI career insights."
    >
      <div className="mx-auto max-w-7xl space-y-8">

        {/* =====================================================
            HEADER
        ====================================================== */}

        <section>
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold tracking-wider text-primary">
                CAREER COPILOT
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
                Welcome back, {data.user.name} 👋
              </h1>

              <p className="mt-2 text-muted-foreground">
                Your AI-powered placement command center.
              </p>
            </div>

            <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground">
                Latest resume
              </p>

              <p className="mt-1 max-w-[280px] truncate font-medium">
                {data.latest_resume?.filename ?? "No resume uploaded"}
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            KPI CARDS
        ====================================================== */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            icon={<Target className="h-5 w-5" />}
            label="Resume Score"
            value={safeScore}
            suffix="/100"
            note="AI resume evaluation"
          />

          <KpiCard
            icon={<FileText className="h-5 w-5" />}
            label="Resumes"
            value={Number(data.total_resumes || 0)}
            note="Uploaded documents"
          />

          <KpiCard
            icon={<Briefcase className="h-5 w-5" />}
            label="Jobs Tracked"
            value={Number(data.total_jobs || 0)}
            note="Saved job descriptions"
          />

          <KpiCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Placement Readiness"
            value={placementReadiness}
            suffix="%"
            note={readinessLabel}
          />
        </section>

        {/* =====================================================
            RESUME SCORE + SKILL INTELLIGENCE
        ====================================================== */}

        <section className="grid gap-6 lg:grid-cols-3">

          {/* Resume Score */}

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />

              <h2 className="font-semibold">
                Resume Score
              </h2>
            </div>

            <div className="mt-8 flex justify-center">
              <div
                className="relative flex h-44 w-44 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(
                    hsl(var(--primary)) ${safeScore * 3.6}deg,
                    hsl(var(--muted)) ${safeScore * 3.6}deg
                  )`,
                }}
              >
                <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-card">
                  <span className="text-4xl font-bold">
                    {safeScore}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    out of 100
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Overall strength
                </span>

                <span className="font-medium">
                  {scoreLabel}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700"
                  style={{
                    width: `${safeScore}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Skill Intelligence */}

          <div className="rounded-2xl border bg-card p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />

              <h2 className="font-semibold">
                Skill Intelligence
              </h2>
            </div>

            {data.skill_scores.length === 0 ? (
              <EmptyMessage
                text="Upload and analyze a resume to generate skill scores."
              />
            ) : (
              <div className="mt-6 space-y-5">
                {data.skill_scores.map((item, index) => {
                  const score = Math.min(
                    Math.max(Number(item.score) || 0, 0),
                    100
                  );

                  return (
                    <div key={`${item.skill}-${index}`}>
                      <div className="mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {item.skill}
                          </span>

                          <span className="text-sm font-medium">
                            {score}/100
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                          {score >= 80
                            ? "Strong"
                            : score >= 60
                              ? "Good"
                              : score >= 40
                                ? "Developing"
                                : "Needs focus"}
                        </p>
                      </div>

                      <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-700"
                          style={{
                            width: `${score}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* =====================================================
            PLACEMENT READINESS
        ====================================================== */}

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-primary/10 p-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Placement Readiness
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  A combined view of your resume quality and current skill
                  strength.
                </p>
              </div>
            </div>

            <div className="text-left md:text-right">
              <div className="text-4xl font-bold">
                {placementReadiness}%
              </div>

              <p className="text-sm text-muted-foreground">
                {readinessLabel}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="h-3 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-1000"
                style={{
                  width: `${placementReadiness}%`,
                }}
              />
            </div>

            <div className="mt-3 flex justify-between text-xs text-muted-foreground">
              <span>Getting started</span>
              <span>Placement ready</span>
            </div>
          </div>
        </section>

        {/* =====================================================
            AI CAREER SUMMARY
        ====================================================== */}

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />

            <h2 className="font-semibold">
              AI Career Summary
            </h2>
          </div>

          <p className="mt-4 leading-7 text-muted-foreground">
            {data.candidate_summary ||
              "Upload and analyze your resume to generate your personalized AI career summary."}
          </p>
        </section>

        {/* =====================================================
            TECHNICAL + SOFT SKILLS
        ====================================================== */}

        <section className="grid gap-6 lg:grid-cols-2">
          <SkillCard
            title="Technical Skills"
            icon={
              <CheckCircle2 className="h-5 w-5 text-primary" />
            }
            skills={data.technical_skills}
          />

          <SkillCard
            title="Soft Skills"
            icon={
              <CheckCircle2 className="h-5 w-5 text-primary" />
            }
            skills={data.soft_skills}
          />
        </section>

        {/* =====================================================
            STRENGTHS + WEAKNESSES
        ====================================================== */}

        <section className="grid gap-6 lg:grid-cols-2">
          <ListCard
            title="Your Strengths"
            icon={
              <CheckCircle2 className="h-5 w-5 text-primary" />
            }
            items={data.strengths}
          />

          <ListCard
            title="Areas to Improve"
            icon={
              <AlertTriangle className="h-5 w-5 text-primary" />
            }
            items={data.weaknesses}
          />
        </section>

        {/* =====================================================
            SKILL GAP
        ====================================================== */}

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />

              <h2 className="font-semibold">
                Your Skill Gap
              </h2>
            </div>

            <span className="text-sm text-muted-foreground">
              {data.missing_skills.length} skills to improve
            </span>
          </div>

          {data.missing_skills.length === 0 ? (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-dashed p-5">
              <CheckCircle2 className="h-5 w-5 text-primary" />

              <p className="text-sm text-muted-foreground">
                No major skill gaps identified yet.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {data.missing_skills.map((skill, index) => (
                <div
                  key={`${skill}-${index}`}
                  className="group rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                    </div>

                    <div>
                      <p className="font-medium">
                        {skill}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        Recommended improvement
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =====================================================
            RECOMMENDED JOB ROLES
        ====================================================== */}

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />

            <h2 className="font-semibold">
              Recommended Job Roles
            </h2>
          </div>

          {data.suitable_job_roles.length === 0 ? (
            <EmptyMessage
              text="AI job-role recommendations will appear after resume analysis."
            />
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.suitable_job_roles.map((role, index) => (
                <div
                  key={`${role}-${index}`}
                  className="rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                    </div>

                    <div>
                      <p className="font-medium">
                        {role}
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Potential career match
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* =====================================================
            IMPROVEMENT SUGGESTIONS
        ====================================================== */}

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />

            <h2 className="font-semibold">
              AI Improvement Suggestions
            </h2>
          </div>

          <NumberedList
            items={data.improvement_suggestions}
          />
        </section>

        {/* =====================================================
            PLACEMENT PREPARATION PLAN
        ====================================================== */}

        <section className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />

            <h2 className="font-semibold">
              Placement Preparation Plan
            </h2>
          </div>

          <NumberedList
            items={data.placement_preparation_plan}
          />
        </section>

        {/* =====================================================
            ACTIVITY
        ====================================================== */}

        <section className="grid gap-6 lg:grid-cols-2">

          {/* Resume Activity */}

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />

              <h2 className="font-semibold">
                Resume Activity
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {data.resumes.length === 0 ? (
                <EmptyMessage text="No resumes uploaded yet." />
              ) : (
                data.resumes.map((resume) => (
                  <div
                    key={resume.id}
                    className="flex items-center gap-3 rounded-xl border p-3"
                  >
                    <div className="rounded-lg bg-primary/10 p-2">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>

                    <span className="truncate text-sm">
                      {resume.filename}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Job Activity */}

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />

              <h2 className="font-semibold">
                Job Activity
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              {data.jobs.length === 0 ? (
                <EmptyMessage text="No jobs tracked yet." />
              ) : (
                data.jobs.map((job) => (
                  <div
                    key={job.id}
                    className="rounded-xl border p-3"
                  >
                    <p className="font-medium">
                      {job.title || "Untitled role"}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      {job.company || "Company not specified"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

/* =============================================================
   KPI CARD
============================================================= */

function KpiCard({
  icon,
  label,
  value,
  suffix,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  note: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          {icon}
        </div>
      </div>

      <p className="mt-5 text-sm text-muted-foreground">
        {label}
      </p>

      <div className="mt-1 text-3xl font-bold">
        {value}

        {suffix && (
          <span className="text-base font-medium text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {note}
      </p>
    </div>
  );
}

/* =============================================================
   SKILL CARD
============================================================= */

function SkillCard({
  title,
  icon,
  skills,
}: {
  title: string;
  icon: React.ReactNode;
  skills: string[];
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}

        <h2 className="font-semibold">
          {title}
        </h2>
      </div>

      {skills.length === 0 ? (
        <EmptyMessage text="No data available yet." />
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={`${skill}-${index}`}
              className="rounded-full bg-muted px-3 py-1.5 text-sm"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* =============================================================
   LIST CARD
============================================================= */

function ListCard({
  title,
  icon,
  items,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-2">
        {icon}

        <h2 className="font-semibold">
          {title}
        </h2>
      </div>

      <NumberedList items={items} />
    </div>
  );
}

/* =============================================================
   NUMBERED LIST
============================================================= */

function NumberedList({
  items,
}: {
  items: string[];
}) {
  if (items.length === 0) {
    return (
      <EmptyMessage
        text="No recommendations available yet."
      />
    );
  }

  return (
    <div className="mt-5 space-y-3">
      {items.map((item, index) => (
        <div
          key={`${item}-${index}`}
          className="flex gap-3"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {index + 1}
          </div>

          <p className="pt-1 text-sm leading-6 text-muted-foreground">
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

/* =============================================================
   EMPTY MESSAGE
============================================================= */

function EmptyMessage({
  text,
}: {
  text: string;
}) {
  return (
    <p className="mt-5 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
      {text}
    </p>
  );
}