import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  Map,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import {
  AiInsight,
  KpiCard,
  Panel,
  PanelHeader,
} from "@/components/ui-kit/primitives";
import { api, ApiError } from "@/services/api";

export const Route = createFileRoute("/learning")({
  head: () => ({
    meta: [
      { title: "Learning Hub — Career Copilot" },
      {
        name: "description",
        content:
          "Personalized learning plans based on your resume, target job, skill gaps and career roadmap.",
      },
    ],
  }),
  component: LearningPage,
});

type Resume = {
  id: number;
  filename: string;
};

type Job = {
  id: number;
  title: string;
  company: string;
};

type DashboardData = {
  resumes?: Resume[];
  jobs?: Job[];
  resume_score?: number;
  missing_skills?: string[];
  skill_scores?: Array<{
    skill: string;
    score: number;
  }>;
  improvement_suggestions?: string[];
  placement_preparation_plan?: string[];
};

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
};

type RoadmapItem = {
  id: number;
  label: string;
  done: boolean;
};

type RoadmapStage = {
  id: number;
  stage_number: number;
  title: string;
  description: string;
  duration_days: number;
  completion: number;
  status: "completed" | "current" | "upcoming";
  items: RoadmapItem[];
};

type CareerRoadmap = {
  id: number;
  target_role: string;
  readiness_score: number;
  summary: string;
  total_days: number;
  overall_completion: number;
  stages: RoadmapStage[];
};

function LearningPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [skillGap, setSkillGap] =
    useState<SkillGapAnalysis | null>(null);

  const [roadmap, setRoadmap] =
    useState<CareerRoadmap | null>(null);

  const [resumeId, setResumeId] =
    useState<number | null>(null);

  const [jobId, setJobId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [skillGapLoading, setSkillGapLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [expandedSkill, setExpandedSkill] =
    useState<string | null>(null);

  const [completedTopics, setCompletedTopics] =
    useState<string[]>(() => {
      try {
        const saved =
          localStorage.getItem(
            "career-copilot-learning-progress"
          );

        return saved
          ? JSON.parse(saved)
          : [];
      } catch {
        return [];
      }
    });

  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  useEffect(() => {
    let mounted = true;

    async function loadLearningData() {
      try {
        setLoading(true);
        setError("");

        const dashboardData =
          await api.dashboard();

        if (!mounted) {
          return;
        }

        setDashboard(
          dashboardData as DashboardData
        );

        const resumes =
          dashboardData.resumes ?? [];

        const jobs =
          dashboardData.jobs ?? [];

        const firstResume =
          resumes[0];

        const firstJob =
          jobs[0];

        if (!firstResume) {
          setError(
            "Upload and analyze a resume first to unlock your personalized Learning Hub."
          );
          return;
        }

        setResumeId(
          Number(firstResume.id)
        );

        if (firstJob) {
          setJobId(
            Number(firstJob.id)
          );
        }

        /*
         * Roadmap and Skill Gap require both
         * a resume and a target job.
         */
        if (firstJob) {
          await loadSkillGap(
            Number(firstResume.id),
            Number(firstJob.id)
          );

          try {
            const roadmapResponse =
              await api.getCareerRoadmap(
                Number(firstResume.id),
                Number(firstJob.id)
              );

            if (mounted) {
              setRoadmap(
                roadmapResponse.roadmap
              );
            }
          } catch (roadmapError) {
            console.error(
              "Unable to load roadmap:",
              roadmapError
            );
          }
        }
      } catch (err) {
        console.error(
          "Unable to load learning data:",
          err
        );

        if (mounted) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load your Learning Hub."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    async function loadSkillGap(
      selectedResumeId: number,
      selectedJobId: number
    ) {
      try {
        setSkillGapLoading(true);

        const response =
          await api.analyzeSkillGap(
            selectedResumeId,
            selectedJobId
          );

        if (mounted) {
          setSkillGap(
            response.analysis
          );
        }
      } catch (err) {
        console.error(
          "Unable to load skill gap:",
          err
        );
      } finally {
        if (mounted) {
          setSkillGapLoading(false);
        }
      }
    }

    loadLearningData();

    return () => {
      mounted = false;
    };
  }, []);

  /* =========================================================
     SAVE LOCAL LEARNING PROGRESS
     ========================================================= */

  useEffect(() => {
    localStorage.setItem(
      "career-copilot-learning-progress",
      JSON.stringify(completedTopics)
    );
  }, [completedTopics]);

  /* =========================================================
     TOGGLE TOPIC
     ========================================================= */

  function toggleTopic(topic: string) {
    setCompletedTopics((previous) => {
      if (previous.includes(topic)) {
        return previous.filter(
          (item) => item !== topic
        );
      }

      return [...previous, topic];
    });
  }

  /* =========================================================
     CALCULATIONS
     ========================================================= */

  const allLearningTopics = useMemo(() => {
    if (!skillGap) {
      return [];
    }

    return skillGap.skill_gaps.flatMap(
      (gap) => gap.learning_plan
    );
  }, [skillGap]);

  const learningProgress = useMemo(() => {
    if (
      allLearningTopics.length === 0
    ) {
      return 0;
    }

    const completed =
      allLearningTopics.filter(
        (topic) =>
          completedTopics.includes(topic)
      ).length;

    return Math.round(
      (completed /
        allLearningTopics.length) *
        100
    );
  }, [
    allLearningTopics,
    completedTopics,
  ]);

  const totalLearningDays = useMemo(() => {
    if (!skillGap) {
      return 0;
    }

    return skillGap.skill_gaps.reduce(
      (sum, item) =>
        sum + item.learning_days,
      0
    );
  }, [skillGap]);

  const highPriorityCount =
    skillGap?.skill_gaps.filter(
      (item) =>
        item.priority === "HIGH"
    ).length ?? 0;

  const currentResumeScore =
    dashboard?.resume_score ?? 0;

  const topSkillGaps =
    skillGap?.skill_gaps ?? [];

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <AppShell
        title="Learning Hub"
        subtitle="Your personalized path from skill gaps to placement readiness."
      >
        <div className="flex min-h-100 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <AppShell
      title="Learning Hub"
      subtitle="Your personalized path from skill gaps to placement readiness."
    >
      <div className="space-y-6">

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm">
            <div className="flex items-start gap-3">
              <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-warning" />

              <div>
                <p className="font-semibold">
                  Learning data needs setup
                </p>

                <p className="mt-1 text-muted-foreground">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* HERO */}
        {/* ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="relative p-6 md:p-8">

            <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">

              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Personalized Learning
                </div>

                <h2 className="max-w-2xl text-2xl font-bold tracking-tight md:text-3xl">
                  Turn your skill gaps into
                  placement-ready skills.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Career Copilot uses your resume,
                  target role and skill-gap analysis
                  to prioritize what you should learn
                  next.
                </p>

                {roadmap?.target_role && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                    <Target className="h-4 w-4 text-primary" />

                    <span className="text-muted-foreground">
                      Target role:
                    </span>

                    <span className="font-semibold">
                      {roadmap.target_role}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full border-8 border-primary/10">
                  <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-primary border-r-primary" />

                  <div className="text-center">
                    <p className="text-2xl font-bold">
                      {learningProgress}%
                    </p>

                    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Learning
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================= */}
        {/* KPIs */}
        {/* ================================================= */}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <KpiCard
            label="Readiness Score"
            value={
              skillGap?.readiness_score ??
              currentResumeScore
            }
            suffix="%"
            {...(skillGap
              ? {
                  delta:
                    skillGap.readiness_score -
                    currentResumeScore,
                }
              : {})}
            spark={[45, 52, 58, 61, 68, 72]}
            color="var(--primary)"
            note="Based on your resume and target job."
          />

          <KpiCard
            label="Priority Skills"
            value={highPriorityCount}
            suffix=""
            spark={[6, 5, 5, 4, 4, highPriorityCount]}
            color="var(--warning)"
            note="High-priority gaps to work on."
          />

          <KpiCard
            label="Estimated Learning"
            value={totalLearningDays}
            suffix="days"
            spark={[30, 27, 24, 21, 18, totalLearningDays]}
            color="var(--brand-blue)"
            note="Estimated time across identified gaps."
          />

          <KpiCard
            label="Learning Progress"
            value={learningProgress}
            suffix="%"
            spark={[10, 22, 35, 48, 62, learningProgress]}
            color="var(--success)"
            note={`${completedTopics.length} topics completed.`}
          />

        </section>

        {/* ================================================= */}
        {/* PRIORITY SKILLS */}
        {/* ================================================= */}

        <Panel>
          <PanelHeader
            title="Your Priority Skills"
            subtitle="Skills ranked by the gap between your current level and the target role."
          />

          {skillGapLoading ? (
            <div className="flex min-h-50 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : topSkillGaps.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success" />

              <p className="mt-3 font-semibold">
                No skill gaps found
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Your current analysis doesn't contain
                any learning gaps yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {topSkillGaps.map(
                (gap) => {
                  const expanded =
                    expandedSkill ===
                    gap.skill;

                  const skillProgress =
                    gap.required > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (gap.current /
                              gap.required) *
                              100
                          )
                        )
                      : 0;

                  return (
                    <div
                      key={gap.skill}
                      className="p-5"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSkill(
                            expanded
                              ? null
                              : gap.skill
                          )
                        }
                        className="w-full text-left"
                      >
                        <div className="flex flex-col gap-4 md:flex-row md:items-center">

                          <div className="flex min-w-0 flex-1 items-center gap-3">
                            <div className="rounded-xl bg-primary-soft p-2.5">
                              <BrainCircuit className="h-5 w-5 text-primary" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="font-semibold">
                                  {gap.skill}
                                </h3>

                                <span
                                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                    gap.priority ===
                                    "HIGH"
                                      ? "bg-destructive/10 text-destructive"
                                      : gap.priority ===
                                          "MEDIUM"
                                        ? "bg-warning/10 text-warning"
                                        : "bg-success/10 text-success"
                                  }`}
                                >
                                  {gap.priority}
                                </span>
                              </div>

                              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                                {gap.reason}
                              </p>
                            </div>
                          </div>

                          <div className="w-full md:w-56">
                            <div className="mb-1 flex justify-between text-[11px]">
                              <span className="text-muted-foreground">
                                Current
                              </span>

                              <span className="font-semibold">
                                {gap.current} /{" "}
                                {gap.required}
                              </span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{
                                  width: `${skillProgress}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                Learn
                              </p>

                              <p className="text-sm font-bold">
                                {gap.learning_days}d
                              </p>
                            </div>

                            <ChevronDown
                              className={`h-4 w-4 text-muted-foreground transition-transform ${
                                expanded
                                  ? "rotate-180"
                                  : ""
                              }`}
                            />
                          </div>
                        </div>
                      </button>

                      {/* Expanded Learning Plan */}

                      {expanded && (
                        <div className="mt-5 grid gap-5 border-t border-border pt-5 lg:grid-cols-[1fr_280px]">

                          <div>
                            <div className="mb-3 flex items-center gap-2">
                              <BookOpen className="h-4 w-4 text-primary" />

                              <h4 className="text-sm font-semibold">
                                Personalized Learning Plan
                              </h4>
                            </div>

                            <div className="space-y-2">
                              {gap.learning_plan.map(
                                (
                                  topic,
                                  index
                                ) => {
                                  const done =
                                    completedTopics.includes(
                                      topic
                                    );

                                  return (
                                    <button
                                      key={`${gap.skill}-${topic}-${index}`}
                                      type="button"
                                      onClick={() =>
                                        toggleTopic(
                                          topic
                                        )
                                      }
                                      className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                                        done
                                          ? "border-success/30 bg-success/5"
                                          : "border-border bg-card hover:bg-muted/50"
                                      }`}
                                    >
                                      <div
                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                                          done
                                            ? "border-success bg-success text-success-foreground"
                                            : "border-muted-foreground/40"
                                        }`}
                                      >
                                        {done && (
                                          <CheckCircle2 className="h-4 w-4" />
                                        )}
                                      </div>

                                      <span
                                        className={`text-sm ${
                                          done
                                            ? "text-muted-foreground line-through"
                                            : ""
                                        }`}
                                      >
                                        {topic}
                                      </span>
                                    </button>
                                  );
                                }
                              )}
                            </div>
                          </div>

                          <div className="rounded-xl bg-muted/40 p-4">
                            <div className="flex items-center gap-2">
                              <Clock3 className="h-4 w-4 text-primary" />

                              <span className="text-xs font-semibold">
                                Estimated Time
                              </span>
                            </div>

                            <p className="mt-2 text-2xl font-bold">
                              {gap.learning_days}
                              <span className="ml-1 text-sm font-medium text-muted-foreground">
                                days
                              </span>
                            </p>

                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              Focus on these topics before
                              moving to the next priority.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </Panel>

        {/* ================================================= */}
        {/* QUICK WINS + TOP PRIORITIES */}
        {/* ================================================= */}

        {skillGap && (
          <section className="grid gap-4 lg:grid-cols-2">

            <Panel>
              <PanelHeader
                title="Quick Wins"
                subtitle="Small improvements you can make immediately."
              />

              <div className="space-y-3 p-5">
                {skillGap.quick_wins.length ===
                0 ? (
                  <p className="text-sm text-muted-foreground">
                    No quick wins available yet.
                  </p>
                ) : (
                  skillGap.quick_wins.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="flex gap-3 rounded-xl border border-border p-3"
                      >
                        <div className="rounded-lg bg-warning/10 p-2">
                          <Zap className="h-4 w-4 text-warning" />
                        </div>

                        <p className="text-sm leading-relaxed">
                          {item}
                        </p>
                      </div>
                    )
                  )
                )}
              </div>
            </Panel>

            <Panel>
              <PanelHeader
                title="Top Learning Priorities"
                subtitle="Where your study time should go first."
              />

              <div className="space-y-3 p-5">
                {skillGap.top_priorities.length ===
                0 ? (
                  <p className="text-sm text-muted-foreground">
                    No priorities available yet.
                  </p>
                ) : (
                  skillGap.top_priorities.map(
                    (item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 rounded-xl border border-border p-3"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                          {index + 1}
                        </div>

                        <span className="text-sm font-medium">
                          {item}
                        </span>
                      </div>
                    )
                  )
                )}
              </div>
            </Panel>
          </section>
        )}

        {/* ================================================= */}
        {/* ROADMAP PROGRESS */}
        {/* ================================================= */}

        {roadmap && (
          <Panel>
            <PanelHeader
              title="Career Roadmap Learning Progress"
              subtitle="Your learning activities connected to the personalized roadmap."
            />

            <div className="p-5">

              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-primary-soft p-3">
                    <Map className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <p className="font-semibold">
                      {roadmap.target_role}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {roadmap.total_days} day career plan
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {roadmap.overall_completion}%
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Roadmap completion
                  </p>
                </div>
              </div>

              <div className="mb-6 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${roadmap.overall_completion}%`,
                  }}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {roadmap.stages.map(
                  (stage) => (
                    <div
                      key={stage.id}
                      className="rounded-xl border border-border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">

                        <div className="flex gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                            {stage.stage_number}
                          </div>

                          <div>
                            <p className="font-semibold">
                              {stage.title}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                              {stage.description}
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-semibold">
                          {stage.completion}%
                        </span>
                      </div>

                      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{
                            width: `${stage.completion}%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {stage.duration_days} days
                        {" · "}
                        {stage.items.filter(
                          (item) => item.done
                        ).length}{" "}
                        /{" "}
                        {stage.items.length}{" "}
                        tasks complete
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </Panel>
        )}

        {/* ================================================= */}
        {/* AI INSIGHTS */}
        {/* ================================================= */}

        {skillGap && (
          <section className="grid gap-4 lg:grid-cols-2">

            <AiInsight
              label="AI Career Insight"
              tone="success"
            >
              {skillGap.career_insights[0] ??
                "Your learning plan is personalized from your current skills and target role."}
            </AiInsight>

            <AiInsight label="AI Recommendation">
              {dashboard?.improvement_suggestions?.[0] ??
                skillGap.quick_wins[0] ??
                "Focus on your highest-priority skill gap before moving to lower-priority topics."}
            </AiInsight>
          </section>
        )}

        {/* ================================================= */}
        {/* PLACEMENT PREPARATION */}
        {/* ================================================= */}

        {dashboard?.placement_preparation_plan &&
          dashboard.placement_preparation_plan
            .length > 0 && (
            <Panel>
              <PanelHeader
                title="Placement Preparation Plan"
                subtitle="Your resume analysis identified these preparation areas."
              />

              <div className="grid gap-3 p-5 md:grid-cols-2">
                {dashboard.placement_preparation_plan.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="flex gap-3 rounded-xl border border-border p-4"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                        {index + 1}
                      </div>

                      <span className="text-sm leading-relaxed">
                        {item}
                      </span>
                    </div>
                  )
                )}
              </div>
            </Panel>
          )}

        {/* ================================================= */}
        {/* FOOTER INSIGHT */}
        {/* ================================================= */}

        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <div className="flex gap-3">
            <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

            <div>
              <p className="font-semibold">
                Keep your learning focused
              </p>

              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Don't try to learn everything at once.
                Complete the highest-priority skill
                gaps first, then move through your
                roadmap systematically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}