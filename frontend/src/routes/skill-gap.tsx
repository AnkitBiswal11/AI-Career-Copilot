
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/AppShell";
import {
  AiInsight,
  Panel,
  PanelHeader,
  PriorityTag,
} from "@/components/ui-kit/primitives";
import api from "@/services/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/skill-gap")({
  component: SkillGapPage,
});

type SkillGap = {
  skill: string;
  current: number;
  required: number;
  gap: number;
  priority: "HIGH" | "MEDIUM" | "LOW";
  learning_days: number;
  reason: string;
  learning_plan: string[];
};

type SkillGapAnalysis = {
  readiness_score: number;
  skill_gaps: SkillGap[];
  strengths: string[];
  top_priorities: string[];
  career_insights: string[];
  quick_wins: string[];
  error?: string;
};

type AnalysisResponse = {
  job_title?: string;
  company?: string;
  analysis: SkillGapAnalysis;
};

type DashboardJob = {
  id: number | string;
};

type DashboardData = {
  latest_resume?: { id: number | string } | null;
  resumes?: { id: number | string }[];
  jobs?: DashboardJob[];
};

function normalizeAnalysis(
  data: SkillGapAnalysis,
): SkillGapAnalysis {
  if (data.error) {
    throw new Error(data.error);
  }

  const score = Number(data.readiness_score);

  if (!Number.isFinite(score)) {
    throw new Error(
      "The AI returned an invalid readiness score. Please regenerate the analysis.",
    );
  }

  const skillGaps = Array.isArray(data.skill_gaps)
    ? data.skill_gaps
    : [];

  const strengths = Array.isArray(data.strengths)
    ? data.strengths
    : [];

  const priorities = Array.isArray(data.top_priorities)
    ? data.top_priorities
    : [];

  const insights = Array.isArray(data.career_insights)
    ? data.career_insights
    : [];

  const quickWins = Array.isArray(data.quick_wins)
    ? data.quick_wins
    : [];

  // Avoid silently presenting a failed or empty AI response
  // as a successful analysis.
  if (
    score === 0 &&
    skillGaps.length === 0 &&
    strengths.length === 0 &&
    priorities.length === 0 &&
    insights.length === 0 &&
    quickWins.length === 0
  ) {
    throw new Error(
      "The AI returned an empty skill-gap analysis. Please try again. If this continues, check the backend AI provider and its logs.",
    );
  }

  return {
    readiness_score: Math.min(100, Math.max(0, score)),
    skill_gaps: skillGaps,
    strengths,
    top_priorities: priorities,
    career_insights: insights,
    quick_wins: quickWins,
  };
}

function SkillGapPage() {
  const [resumeId, setResumeId] =
    useState<number | string | null>(null);

  const [jobId, setJobId] =
    useState<number | string | null>(null);

  const [jobTitle, setJobTitle] =
    useState<string | null>(null);

  const [company, setCompany] =
    useState<string | null>(null);

  const [analysis, setAnalysis] =
    useState<SkillGapAnalysis | null>(null);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  const applyResult = (result: AnalysisResponse) => {
    const normalized = normalizeAnalysis(result.analysis);

    setJobTitle(result.job_title ?? "Target Role");
    setCompany(result.company ?? null);
    setAnalysis(normalized);
  };

  const loadSkillGap = async () => {
    try {
      setLoading(true);
      setError("");
      setAnalysis(null);

      const dashboard =
        (await api.dashboard()) as DashboardData;

      const selectedResume =
        dashboard.latest_resume?.id ??
        dashboard.resumes?.[0]?.id ??
        null;

      const savedJobId =
        window.localStorage.getItem("cc_job_id");

      const savedJob = dashboard.jobs?.find(
        (job) => String(job.id) === savedJobId,
      );

      const selectedJob =
        savedJob?.id ??
        dashboard.jobs?.[0]?.id ??
        null;

      if (selectedResume === null) {
        throw new Error(
          "Please upload and analyze a resume first.",
        );
      }

      if (selectedJob === null) {
        throw new Error(
          "No saved job description was found. Open Job Match, enter a job description, and click Analyze Match first.",
        );
      }

      setResumeId(selectedResume);
      setJobId(selectedJob);

      const result = (await api.analyzeSkillGap(
        selectedResume,
        selectedJob,
      )) as AnalysisResponse;

      applyResult(result);
    } catch (err) {
      console.error("Skill gap analysis failed:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load skill-gap analysis.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSkillGap();
  }, []);

  const regenerate = async () => {
    if (resumeId === null || jobId === null) {
      setError(
        "A resume and saved job description are required. Please try reloading the page.",
      );
      return;
    }

    try {
      setAnalyzing(true);
      setError("");

      const result = (await api.analyzeSkillGap(
        resumeId,
        jobId,
      )) as AnalysisResponse;

      applyResult(result);
    } catch (err) {
      console.error(
        "Skill gap regeneration failed:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to regenerate skill-gap analysis.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const chartData = useMemo(() => {
    if (!analysis) {
      return [];
    }

    return analysis.skill_gaps.map((item) => ({
      skill: item.skill,
      Current: Math.min(
        Math.max(Number(item.current) || 0, 0),
        100,
      ),
      Required: Math.min(
        Math.max(Number(item.required) || 0, 0),
        100,
      ),
    }));
  }, [analysis]);

  if (loading) {
    return (
      <AppShell
        title="Skill Gap"
        subtitle="AI-powered analysis of your career readiness"
      >
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="flex items-center gap-3 text-muted-foreground">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Analyzing your skill profile...</span>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell
        title="Skill Gap"
        subtitle="AI-powered analysis of your career readiness"
      >
        <Panel>
          <div className="flex min-h-[500px] flex-col items-center justify-center px-5 text-center">
            <AlertTriangle className="mb-4 h-10 w-10" />

            <h2 className="text-xl font-semibold">
              Unable to load Skill Gap
            </h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {error}
            </p>

            <button
              type="button"
              onClick={() => void loadSkillGap()}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </Panel>
      </AppShell>
    );
  }

  if (!analysis) {
    return (
      <AppShell
        title="Skill Gap"
        subtitle="AI-powered analysis of your career readiness"
      >
        <Panel>
          <div className="flex min-h-[400px] items-center justify-center text-center">
            <div>
              <AlertTriangle className="mx-auto mb-4 h-8 w-8" />

              <h2 className="text-xl font-semibold">
                No analysis available
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Please try generating the skill-gap analysis again.
              </p>

              <button
                type="button"
                onClick={() => void loadSkillGap()}
                className="mt-5 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
              >
                <RefreshCw className="h-4 w-4" />
                Generate Analysis
              </button>
            </div>
          </div>
        </Panel>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Skill Gap"
      subtitle="AI-powered analysis of your career readiness"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />

              <h1 className="text-2xl font-bold">
                Skill Gap Analysis
              </h1>
            </div>

            <p className="mt-1 text-sm text-muted-foreground">
              {jobTitle || "Target Role"}
              {company ? ` • ${company}` : ""}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void regenerate()}
            disabled={analyzing}
            className="inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                analyzing && "animate-spin",
              )}
            />

            {analyzing
              ? "Analyzing..."
              : "Regenerate Analysis"}
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Panel>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Career Readiness
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {analysis.readiness_score}%
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  AI-estimated job readiness
                </p>
              </div>

              <div className="rounded-xl border p-3">
                <Target className="h-6 w-6" />
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Skill Gaps
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {analysis.skill_gaps.length}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Areas to improve
                </p>
              </div>

              <div className="rounded-xl border p-3">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Top Priorities
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {analysis.top_priorities.length}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Recommended focus areas
                </p>
              </div>

              <div className="rounded-xl border p-3">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </Panel>
        </div>

        {/* Skill Comparison Chart */}
        <Panel>
          <PanelHeader
            title="Current vs Required Skills"
            subtitle="Compare your estimated proficiency with the level expected for the target role"
          />

          <div className="h-[400px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={chartData}
                  margin={{
                    top: 35,
                    right: 25,
                    left: 10,
                    bottom: 80,
                  }}
                  barGap={10}
                  barCategoryGap="22%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="skill"
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    height={90}
                    tick={{ fontSize: 12 }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fontSize: 12 }}
                  />

                  <Tooltip
                    formatter={(value, name) => [
                      `${value}%`,
                      name === "Current"
                        ? "Your Current Level"
                        : "Required Level",
                    ]}
                    labelFormatter={(label) => `Skill: ${label}`}
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid hsl(var(--border))",
                      boxShadow:
                        "0 8px 24px rgba(0,0,0,0.08)",
                    }}
                  />

                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={45}
                    formatter={(value) =>
                      value === "Current"
                        ? "Your Current Level"
                        : "Required Level"
                    }
                  />

                  <Bar
                    dataKey="Current"
                    name="Current"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  >
                    <LabelList
                      dataKey="Current"
                      position="top"
                      formatter={(value) => `${value}%`}
                      fontSize={11}
                      fontWeight={600}
                    />
                  </Bar>

                  <Bar
                    dataKey="Required"
                    name="Required"
                    fill="#9333ea"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={45}
                  >
                    <LabelList
                      dataKey="Required"
                      position="top"
                      formatter={(value) => `${value}%`}
                      fontSize={11}
                      fontWeight={600}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
                No skill-gap data was returned by the AI. Try regenerating the analysis. If this persists, check the backend logs and AI provider configuration.
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-3 border-t pt-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="h-3 w-3 shrink-0 rounded-full bg-blue-600" />

              <div>
                <p className="text-sm font-medium">
                  Your Current Level
                </p>

                <p className="text-xs text-muted-foreground">
                  Estimated from your resume
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="h-3 w-3 shrink-0 rounded-full bg-purple-600" />

              <div>
                <p className="text-sm font-medium">
                  Required Level
                </p>

                <p className="text-xs text-muted-foreground">
                  Expected for the target role
                </p>
              </div>
            </div>
          </div>
        </Panel>

        {/* Skill Gaps */}
        <Panel>
          <PanelHeader
            title="Skills You Need to Improve"
            subtitle="Prioritized recommendations generated from your resume and target role"
          />

          <div className="space-y-4">
            {analysis.skill_gaps.map((item, index) => (
              <div
                key={`${item.skill}-${index}`}
                className="rounded-xl border p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">
                        {item.skill}
                      </h3>

                      <PriorityTag priority={item.priority} />
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.reason}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {item.learning_days} days
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex justify-between text-xs">
                    <span>Current: {item.current}%</span>
                    <span>Required: {item.required}%</span>
                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{
                        width: `${Math.min(
                          Math.max(Number(item.current) || 0, 0),
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {item.learning_plan?.length > 0 && (
                  <div className="mt-5">
                    <p className="mb-2 text-sm font-medium">
                      Recommended learning plan
                    </p>

                    <ul className="space-y-2">
                      {item.learning_plan.map(
                        (step, index) => (
                          <li
                            key={`${item.skill}-${index}`}
                            className="flex gap-2 text-sm text-muted-foreground"
                          >
                            <span className="mt-0.5">
                              {index + 1}.
                            </span>

                            <span>{step}</span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {analysis.skill_gaps.length === 0 && (
              <div className="flex items-center gap-3 rounded-xl border p-5">
                <CheckCircle2 className="h-5 w-5" />

                <div>
                  <p className="font-medium">
                    No skill gaps returned
                  </p>

                  <p className="text-sm text-muted-foreground">
                    The AI did not identify any skill gaps for this role. Review the other analysis details to confirm the result is meaningful.
                  </p>
                </div>
              </div>
            )}
          </div>
        </Panel>

        {/* Strengths + Priorities */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel>
            <PanelHeader
              title="Your Strengths"
              subtitle="Skills already aligned with the target role"
            />

            <div className="space-y-3">
              {analysis.strengths.map(
                (strength, index) => (
                  <div
                    key={`strength-${index}`}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

                    <span className="text-sm">{strength}</span>
                  </div>
                ),
              )}

              {analysis.strengths.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No strengths were returned by the AI.
                </p>
              )}
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Top Priorities"
              subtitle="What you should focus on first"
            />

            <div className="space-y-3">
              {analysis.top_priorities.map(
                (priority, index) => (
                  <div
                    key={`priority-${index}`}
                    className="flex items-start gap-3 rounded-lg border p-3"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                      {index + 1}
                    </span>

                    <span className="text-sm">{priority}</span>
                  </div>
                ),
              )}

              {analysis.top_priorities.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No priority recommendations were returned.
                </p>
              )}
            </div>
          </Panel>
        </div>

        {/* AI Insights + Quick Wins */}
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              AI Career Insights
            </h2>

            {analysis.career_insights.map(
              (insight, index) => (
                <AiInsight
                  key={`insight-${index}`}
                  label={`Career Insight ${index + 1}`}
                >
                  {insight}
                </AiInsight>
              ),
            )}

            {analysis.career_insights.length === 0 && (
              <div className="rounded-xl border p-5 text-sm text-muted-foreground">
                No additional career insights were generated.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              Quick Wins
            </h2>

            {analysis.quick_wins.map((win, index) => (
              <AiInsight
                key={`quick-win-${index}`}
                label={`Quick Win ${index + 1}`}
              >
                {win}
              </AiInsight>
            ))}

            {analysis.quick_wins.length === 0 && (
              <div className="rounded-xl border p-5 text-sm text-muted-foreground">
                No quick wins were generated.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
