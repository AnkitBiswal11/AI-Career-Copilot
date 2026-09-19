import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { api } from "@/services/api";
import type { RoadmapItem, RoadmapStage } from "@/services/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/roadmap")({
  component: RoadmapPage,
});

type StageStatus = "completed" | "current" | "upcoming";

const STATUS_META: Record<
  StageStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
  }
> = {
  completed: {
    label: "Completed",
    icon: CheckCircle2,
  },
  current: {
    label: "Current",
    icon: Target,
  },
  upcoming: {
    label: "Upcoming",
    icon: Clock3,
  },
};

function calculateOverallCompletion(
  stages: RoadmapStage[],
): number {
  if (stages.length === 0) {
    return 0;
  }

  const totalItems = stages.reduce(
    (total, stage) => total + stage.items.length,
    0,
  );

  const completedItems = stages.reduce(
    (total, stage) =>
      total + stage.items.filter((item) => item.done).length,
    0,
  );

  if (totalItems === 0) {
    return 0;
  }

  return Math.round((completedItems / totalItems) * 100);
}

function recalculateStages(
  stages: RoadmapStage[],
): RoadmapStage[] {
  const updatedStages = stages.map((stage) => {
    const totalItems = stage.items.length;

    const completedItems = stage.items.filter(
      (item) => item.done,
    ).length;

    const completion =
      totalItems === 0
        ? 0
        : Math.round(
            (completedItems / totalItems) * 100,
          );

    return {
      ...stage,
      completion,
    };
  });

  let foundCurrent = false;

  return updatedStages.map((stage) => {
    if (stage.completion >= 100) {
      return {
        ...stage,
        status: "completed" as StageStatus,
      };
    }

    if (!foundCurrent) {
      foundCurrent = true;

      return {
        ...stage,
        status: "current" as StageStatus,
      };
    }

    return {
      ...stage,
      status: "upcoming" as StageStatus,
    };
  });
}

function RoadmapPage() {
  const [resumeId, setResumeId] = useState<number | null>(
    null,
  );

  const [jobId, setJobId] = useState<number | null>(null);

  const [stages, setStages] = useState<RoadmapStage[]>([]);

  const [activeStageId, setActiveStageId] = useState<
    number | null
  >(null);

  const [targetRole, setTargetRole] = useState("");

  const [jobTitle, setJobTitle] = useState("");

  const [company, setCompany] = useState("");

  const [readinessScore, setReadinessScore] = useState(0);

  const [summary, setSummary] = useState("");

  const [insights, setInsights] = useState<string[]>([]);

  const [recommendations, setRecommendations] = useState<
    string[]
  >([]);

  const [overallCompletion, setOverallCompletion] = useState(
    0,
  );

  const [loading, setLoading] = useState(true);

  const [regenerating, setRegenerating] = useState(false);

  const [updatingItemId, setUpdatingItemId] = useState<
    number | null
  >(null);

  const [error, setError] = useState<string | null>(null);

  const activeStage = useMemo(() => {
    if (activeStageId === null) {
      return null;
    }

    return (
      stages.find(
        (stage) => stage.id === activeStageId,
      ) ?? null
    );
  }, [activeStageId, stages]);

  async function loadRoadmap(
    selectedResumeId: number,
    selectedJobId: number,
    force = false,
  ) {
    try {
      setError(null);

      if (force) {
        setRegenerating(true);
      } else {
        setLoading(true);
      }

      const response = await api.getCareerRoadmap(
        selectedResumeId,
        selectedJobId,
        force,
      );

      const roadmap = response.roadmap;

      const normalizedStages = recalculateStages(
        roadmap.stages ?? [],
      );

      setResumeId(response.resume_id);

      setJobId(response.job_id);

      setTargetRole(roadmap.target_role ?? "");

      setJobTitle(response.job_title ?? "");

      setCompany(response.company ?? "");

      setReadinessScore(
        roadmap.readiness_score ?? 0,
      );

      setSummary(roadmap.summary ?? "");

      setInsights(roadmap.insights ?? []);

      setRecommendations(
        roadmap.recommendations ?? [],
      );

      setStages(normalizedStages);

      setOverallCompletion(
        roadmap.overall_completion ??
          calculateOverallCompletion(
            normalizedStages,
          ),
      );

      // Safe access for TypeScript / noUncheckedIndexedAccess
      const firstStage = normalizedStages[0];

      if (firstStage) {
        setActiveStageId(firstStage.id);
      } else {
        setActiveStageId(null);
      }
    } catch (err) {
      console.error(
        "Failed to load roadmap:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load career roadmap.",
      );
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function initialize() {
      try {
        setLoading(true);

        setError(null);

        const dashboard = await api.dashboard();

        if (cancelled) {
          return;
        }

        const resumes = dashboard.resumes ?? [];

        const jobs = dashboard.jobs ?? [];

        const latestResume =
          dashboard.latest_resume ??
          resumes[0] ??
          null;

        const firstJob = jobs[0] ?? null;

        if (!latestResume) {
          setError(
            "Please upload and analyze a resume before generating your career roadmap.",
          );

          return;
        }

        if (!firstJob) {
          setError(
            "Please add a job description before generating your career roadmap.",
          );

          return;
        }

        await loadRoadmap(
          latestResume.id,
          firstJob.id,
          false,
        );
      } catch (err) {
        console.error(
          "Failed to initialize roadmap:",
          err,
        );

        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to initialize roadmap.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void initialize();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleToggleItem(
    itemId: number,
    done: boolean,
  ) {
    try {
      setUpdatingItemId(itemId);

      setError(null);

      const response =
        await api.updateRoadmapItem(
          itemId,
          done,
        );

      setStages((currentStages) => {
        const updatedStages =
          currentStages.map((stage) => ({
            ...stage,

            items: stage.items.map(
              (item) =>
                item.id === itemId
                  ? {
                      ...item,
                      done,
                    }
                  : item,
            ),
          }));

        return recalculateStages(
          updatedStages,
        );
      });

      if (
        typeof response.overall_completion ===
        "number"
      ) {
        setOverallCompletion(
          response.overall_completion,
        );
      }
    } catch (err) {
      console.error(
        "Failed to update roadmap item:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update roadmap task.",
      );
    } finally {
      setUpdatingItemId(null);
    }
  }

  async function handleRegenerate() {
    if (
      resumeId === null ||
      jobId === null
    ) {
      setError(
        "Resume and job information is required to regenerate the roadmap.",
      );

      return;
    }

    await loadRoadmap(
      resumeId,
      jobId,
      true,
    );
  }

  if (loading) {
    return (
      <AppShell
        title="Career Roadmap"
        subtitle="Your personalized AI-powered career roadmap"
      >
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-background shadow-sm">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Building your career roadmap
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Analyzing your skills and target
                role...
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Career Roadmap"
      subtitle="Your personalized AI-powered career roadmap"
    >
      <div className="space-y-6 pb-10">
        {/* Page header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="h-4 w-4" />

              AI Career Planning
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              Career Roadmap
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Your personalized learning path based on
              your resume, target job, current skills,
              and skill gaps.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void handleRegenerate()
            }
            disabled={
              regenerating ||
              resumeId === null ||
              jobId === null
            }
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition",
              "hover:bg-muted",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {regenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />

                Regenerate Roadmap
              </>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />

            <div>
              <p className="font-semibold text-destructive">
                Something went wrong
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Target role */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Target className="h-4 w-4" />

                Target career
              </div>

              <h2 className="mt-2 text-2xl font-bold">
                {targetRole ||
                  jobTitle ||
                  "Career Goal"}
              </h2>

              {(jobTitle || company) && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {jobTitle}

                  {company
                    ? ` · ${company}`
                    : ""}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border bg-muted/30 px-4 py-3">
                <div className="text-xs text-muted-foreground">
                  Readiness
                </div>

                <div className="mt-1 text-xl font-bold">
                  {readinessScore}%
                </div>
              </div>

              <div className="rounded-xl border bg-muted/30 px-4 py-3">
                <div className="text-xs text-muted-foreground">
                  Progress
                </div>

                <div className="mt-1 text-xl font-bold">
                  {overallCompletion}%
                </div>
              </div>

              <div className="col-span-2 rounded-xl border bg-muted/30 px-4 py-3 sm:col-span-1">
                <div className="text-xs text-muted-foreground">
                  Stages
                </div>

                <div className="mt-1 text-xl font-bold">
                  {stages.length}
                </div>
              </div>
            </div>
          </div>

          {summary && (
            <div className="mt-5 border-t pt-5">
              <p className="text-sm leading-6 text-muted-foreground">
                {summary}
              </p>
            </div>
          )}
        </div>

        {/* Overall progress */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">
                Overall Progress
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Complete the tasks below to become
                job-ready.
              </p>
            </div>

            <span className="text-2xl font-bold">
              {overallCompletion}%
            </span>
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  Math.max(
                    overallCompletion,
                    0,
                  ),
                  100,
                )}%`,
              }}
            />
          </div>
        </div>

        {/* Roadmap */}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Stage navigation */}
          <div className="h-fit rounded-2xl border bg-card p-5 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold">
                Roadmap
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Follow the stages in order.
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {stages.map(
                (stage, index) => {
                  const meta =
                    STATUS_META[
                      stage.status
                    ];

                  const StatusIcon =
                    meta.icon;

                  const isActive =
                    stage.id ===
                    activeStageId;

                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() =>
                        setActiveStageId(
                          stage.id,
                        )
                      }
                      className={cn(
                        "group w-full rounded-xl border p-3 text-left transition",
                        isActive
                          ? "border-foreground/20 bg-muted"
                          : "border-transparent hover:border-border hover:bg-muted/50",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold",
                            stage.status ===
                              "completed" &&
                              "bg-foreground text-background",
                          )}
                        >
                          {stage.status ===
                          "completed" ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            index + 1
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold">
                              {stage.title}
                            </span>

                            <span className="shrink-0 text-xs font-medium">
                              {
                                stage.completion
                              }
                              %
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                            <StatusIcon className="h-3 w-3" />

                            {meta.label}
                          </div>

                          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${stage.completion}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                },
              )}

              {!stages.length && (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No roadmap stages are available
                    yet.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Active stage */}
          <div className="space-y-6">
            {activeStage ? (
              <>
                {/* Stage information */}
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <span>
                          Stage{" "}
                          {
                            activeStage.stage_number
                          }
                        </span>

                        <span>•</span>

                        <span>
                          {
                            activeStage.duration_days
                          }{" "}
                          days
                        </span>
                      </div>

                      <h2 className="text-2xl font-bold">
                        {activeStage.title}
                      </h2>

                      {activeStage.description && (
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                          {
                            activeStage.description
                          }
                        </p>
                      )}
                    </div>

                    <div className="shrink-0 rounded-xl border px-4 py-3 text-center">
                      <div className="text-2xl font-bold">
                        {
                          activeStage.completion
                        }
                        %
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Complete
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks */}
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Learning Tasks
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Complete each task to progress
                      through this stage.
                    </p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {activeStage.items.map(
                      (
                        item: RoadmapItem,
                      ) => {
                        const isUpdating =
                          updatingItemId ===
                          item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            disabled={
                              isUpdating
                            }
                            onClick={() =>
                              void handleToggleItem(
                                item.id,
                                !item.done,
                              )
                            }
                            className={cn(
                              "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition",
                              item.done
                                ? "bg-muted/50"
                                : "hover:bg-muted/50",
                              isUpdating &&
                                "opacity-60",
                            )}
                          >
                            <div
                              className={cn(
                                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition",
                                item.done
                                  ? "bg-foreground text-background"
                                  : "bg-background",
                              )}
                            >
                              {isUpdating ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : item.done ? (
                                <Check className="h-3.5 w-3.5" />
                              ) : null}
                            </div>

                            <span
                              className={cn(
                                "flex-1 text-sm font-medium",
                                item.done &&
                                  "text-muted-foreground line-through",
                              )}
                            >
                              {item.label}
                            </span>

                            {!item.done && (
                              <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        );
                      },
                    )}

                    {!activeStage.items
                      .length && (
                      <div className="rounded-xl border border-dashed p-6 text-center">
                        <p className="text-sm text-muted-foreground">
                          No tasks have been added
                          to this stage.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-2xl border bg-card shadow-sm">
                <div className="flex min-h-75 items-center justify-center p-6 text-center">
                  <div>
                    <Target className="mx-auto h-10 w-10 text-muted-foreground" />

                    <h3 className="mt-4 font-semibold">
                      Your roadmap is ready
                    </h3>

                    <p className="mt-2 text-sm text-muted-foreground">
                      Select a stage to view your
                      personalized tasks.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Insights */}
        {(insights.length > 0 ||
          recommendations.length > 0) && (
          <div className="grid gap-6 lg:grid-cols-2">
            {insights.length > 0 && (
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />

                  <div>
                    <h2 className="font-semibold">
                      AI Career Insights
                    </h2>

                    <p className="text-sm text-muted-foreground">
                      What the AI found from your
                      profile.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {insights.map(
                    (insight, index) => (
                      <div
                        key={`${index}-${insight}`}
                        className="rounded-xl border p-4"
                      >
                        <div className="flex gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Lightbulb className="h-4 w-4" />
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold">
                              Insight{" "}
                              {index + 1}
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {insight}
                            </p>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {recommendations.length > 0 && (
              <div className="rounded-2xl border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />

                  <div>
                    <h2 className="font-semibold">
                      Recommended Actions
                    </h2>

                    <p className="text-sm text-muted-foreground">
                      Focus on these actions to
                      improve your placement readiness.
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {recommendations.map(
                    (
                      recommendation,
                      index,
                    ) => (
                      <div
                        key={`${index}-${recommendation}`}
                        className="rounded-xl border p-4"
                      >
                        <div className="flex gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <TrendingUp className="h-4 w-4" />
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold">
                              Recommendation{" "}
                              {index + 1}
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                              {
                                recommendation
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />

                <h2 className="font-semibold">
                  Keep building momentum
                </h2>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Finish your roadmap tasks consistently
                and keep improving your job readiness
                score.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const firstIncompleteStage =
                  stages.find(
                    (stage) =>
                      stage.completion < 100,
                  );

                if (firstIncompleteStage) {
                  setActiveStageId(
                    firstIncompleteStage.id,
                  );
                }
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
            >
              Continue Roadmap

              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}