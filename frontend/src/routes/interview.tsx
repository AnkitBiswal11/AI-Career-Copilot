import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  Clock3,
  History,
  Loader2,
  MessageSquare,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import {
  AiInsight,
  Panel,
  PanelHeader,
  ProgressRing,
  ScoreBar,
} from "@/components/ui-kit/primitives";

import { api, ApiError } from "@/services/api";

export const Route = createFileRoute("/interview")({
  component: InterviewPage,
});

type InterviewType = "technical" | "hr" | "mixed";
type Difficulty = "easy" | "medium" | "hard";

type ResumeItem = {
  id: number | string;
  filename: string;
};

type JobItem = {
  id: number | string;
  title: string | null;
  company: string | null;
};

type DashboardData = {
  resumes?: ResumeItem[];
  jobs?: JobItem[];
};

type InterviewQuestion = {
  question_id: number;
  question: string;
};

type Evaluation = {
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
};

type HistoryItem = {
  session_id: number;
  role?: string;
  score?: number;
  total_questions?: number;
  completed_at?: string;
  created_at?: string;
  interview_type?: string;
  difficulty?: string;
};

function InterviewPage() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [history, setHistory] =
    useState<HistoryItem[]>([]);

  const [resumeId, setResumeId] = useState("");
  const [jobId, setJobId] = useState("");

  const [interviewType, setInterviewType] =
    useState<InterviewType>("technical");

  const [difficulty, setDifficulty] =
    useState<Difficulty>("medium");

  const [totalQuestions, setTotalQuestions] =
    useState(5);

  const [sessionId, setSessionId] =
    useState<number | null>(null);

  const [currentQuestion, setCurrentQuestion] =
    useState<InterviewQuestion | null>(null);

  const [questionNumber, setQuestionNumber] =
    useState(1);

  const [answer, setAnswer] = useState("");

  const [evaluation, setEvaluation] =
    useState<Evaluation | null>(null);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [nextLoading, setNextLoading] =
    useState(false);

  const [completedScores, setCompletedScores] =
    useState<number[]>([]);

  const [error, setError] = useState("");

  const isInterviewActive =
    sessionId !== null;

  const isEvaluated =
    evaluation !== null;

  const readiness = useMemo(() => {
    if (completedScores.length === 0) {
      return 0;
    }

    const average =
      completedScores.reduce(
        (sum, score) => sum + score,
        0
      ) / completedScores.length;

    return Math.round(average * 10);
  }, [completedScores]);

  const questionsCompleted =
    completedScores.length;

  const progressPercent = Math.min(
    100,
    Math.round(
      (questionsCompleted / totalQuestions) * 100
    )
  );

  // =========================================================
  // LOAD DASHBOARD + HISTORY
  // =========================================================

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const dashboardData =
          await api.dashboard();

        if (!mounted) {
          return;
        }

        const dashboardResult =
          dashboardData as DashboardData;

        setDashboard(dashboardResult);

        const resumes =
          dashboardResult.resumes ?? [];

        const firstResume =
          resumes[0];

        if (firstResume) {
          setResumeId(
            String(firstResume.id)
          );
        }

        try {
          const historyData =
            await api.getInterviewHistory();

          if (mounted) {
            setHistory(
              historyData as HistoryItem[]
            );
          }
        } catch (historyError) {
          console.error(
            "Unable to load interview history:",
            historyError
          );

          if (mounted) {
            setHistory([]);
          }
        }
      } catch (err) {
        console.error(
          "Unable to load interview data:",
          err
        );

        if (mounted) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Unable to load interview data."
          );
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // =========================================================
  // START INTERVIEW
  // =========================================================

  async function handleStartInterview() {
    if (!resumeId) {
      setError(
        "Please select a resume first."
      );
      return;
    }

    const numericResumeId =
      Number(resumeId);

    if (
      !Number.isFinite(numericResumeId)
    ) {
      setError(
        "Invalid resume selected."
      );
      return;
    }

    if (
      jobId &&
      !Number.isFinite(Number(jobId))
    ) {
      setError(
        "Invalid job selected."
      );
      return;
    }

    try {
      setStarting(true);
      setError("");

      const interviewData: {
        resume_id: number;
        job_id?: number;
        interview_type: InterviewType;
        difficulty: Difficulty;
        total_questions: number;
      } = {
        resume_id: numericResumeId,
        interview_type: interviewType,
        difficulty,
        total_questions: totalQuestions,
      };

      if (jobId) {
        interviewData.job_id =
          Number(jobId);
      }

      const result =
        await api.startInterview(
          interviewData
        );

      setSessionId(
        result.session_id
      );

      setCurrentQuestion({
        question_id:
          result.question_id,
        question:
          result.question,
      });

      setQuestionNumber(1);
      setAnswer("");
      setEvaluation(null);
      setCompletedScores([]);
    } catch (err) {
      console.error(
        "Unable to start interview:",
        err
      );

      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to start the interview."
      );
    } finally {
      setStarting(false);
    }
  }

  // =========================================================
  // EVALUATE ANSWER
  // =========================================================

  async function handleEvaluate() {
    if (
      sessionId === null ||
      currentQuestion === null
    ) {
      return;
    }

    if (!answer.trim()) {
      setError(
        "Please write an answer before submitting."
      );
      return;
    }

    try {
      setEvaluating(true);
      setError("");

      const result =
        await api.evaluateInterviewAnswer({
          session_id: sessionId,
          question_id:
            currentQuestion.question_id,
          answer: answer.trim(),
        });

      const normalizedEvaluation: Evaluation = {
        question_id:
          result.question_id,

        score:
          result.score,

        feedback:
          result.feedback ?? "",

        strengths:
          result.strengths ?? [],

        weaknesses:
          result.weaknesses ?? [],

        improvement_tips:
          result.improvement_tips ??
          result.improvements ??
          [],

        improvements:
          result.improvements ?? [],

        ideal_answer:
          result.ideal_answer ?? "",
      };

      if (
        result.next_question !==
        undefined
      ) {
        normalizedEvaluation.next_question =
          result.next_question;
      }

      if (
        result.next_question_id !==
        undefined
      ) {
        normalizedEvaluation.next_question_id =
          result.next_question_id;
      }

      if (
        result.interview_complete !==
        undefined
      ) {
        normalizedEvaluation.interview_complete =
          result.interview_complete;
      }

      if (
        result.overall_score !==
        undefined
      ) {
        normalizedEvaluation.overall_score =
          result.overall_score;
      }

      setEvaluation(
        normalizedEvaluation
      );

      setCompletedScores(
        (previous) => [
          ...previous,
          result.score,
        ]
      );
    } catch (err) {
      console.error(
        "Unable to evaluate interview answer:",
        err
      );

      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to evaluate your answer."
      );
    } finally {
      setEvaluating(false);
    }
  }

  // =========================================================
  // NEXT QUESTION
  // =========================================================

  async function handleNextQuestion() {
    if (sessionId === null) {
      return;
    }

    if (
      questionNumber >=
      totalQuestions
    ) {
      try {
        const updatedHistory =
          await api.getInterviewHistory();

        setHistory(
          updatedHistory as HistoryItem[]
        );
      } catch (historyError) {
        console.error(
          "Unable to refresh interview history:",
          historyError
        );
      }

      return;
    }

    try {
      setNextLoading(true);
      setError("");

      const result =
        await api.getNextInterviewQuestion(
          sessionId
        );

      setCurrentQuestion({
        question_id:
          result.question_id,
        question:
          result.question,
      });

      setQuestionNumber(
        (previous) =>
          previous + 1
      );

      setAnswer("");
      setEvaluation(null);
    } catch (err) {
      console.error(
        "Unable to generate next question:",
        err
      );

      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to generate the next question."
      );
    } finally {
      setNextLoading(false);
    }
  }

  // =========================================================
  // RESET
  // =========================================================

  function handleReset() {
    setSessionId(null);
    setCurrentQuestion(null);
    setQuestionNumber(1);
    setAnswer("");
    setEvaluation(null);
    setCompletedScores([]);
    setError("");
  }

  const resumes =
    dashboard?.resumes ?? [];

  const jobs =
    dashboard?.jobs ?? [];

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <AppShell
        title="AI Interview Coach"
        subtitle="Practice interviews with personalized AI feedback."
      >
        <div className="flex min-h-100 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <AppShell
      title="AI Interview Coach"
      subtitle="Practice interviews, improve your answers, and become placement-ready."
    >
      <div className="space-y-6">

        {/* ERROR */}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* ================================================= */}
        {/* SETUP */}
        {/* ================================================= */}

        {!isInterviewActive && (
          <Panel>
            <PanelHeader
              title="Start AI Interview"
              subtitle="Configure your personalized interview session."
            />

            <div className="grid gap-5 p-5 md:grid-cols-2 lg:grid-cols-4">

              {/* Resume */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Resume
                </label>

                <select
                  value={resumeId}
                  onChange={(e) =>
                    setResumeId(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">
                    Select resume
                  </option>

                  {resumes.map(
                    (resume) => (
                      <option
                        key={resume.id}
                        value={resume.id}
                      >
                        {
                          resume.filename
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Job */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Target Job
                </label>

                <select
                  value={jobId}
                  onChange={(e) =>
                    setJobId(
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="">
                    General Interview
                  </option>

                  {jobs.map(
                    (job) => (
                      <option
                        key={job.id}
                        value={job.id}
                      >
                        {job.title ??
                          "Untitled Job"}

                        {job.company
                          ? ` — ${job.company}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Interview Type */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Interview Type
                </label>

                <select
                  value={interviewType}
                  onChange={(e) =>
                    setInterviewType(
                      e.target
                        .value as InterviewType
                    )
                  }
                  className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="technical">
                    Technical
                  </option>

                  <option value="hr">
                    HR / Behavioral
                  </option>

                  <option value="mixed">
                    Mixed
                  </option>
                </select>
              </div>

              {/* Difficulty */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Difficulty
                </label>

                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(
                      e.target
                        .value as Difficulty
                    )
                  }
                  className="w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-primary"
                >
                  <option value="easy">
                    Easy
                  </option>

                  <option value="medium">
                    Medium
                  </option>

                  <option value="hard">
                    Hard
                  </option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 border-t border-border p-5">

              {/* Number of questions */}

              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Questions
                </label>

                <select
                  value={totalQuestions}
                  onChange={(e) =>
                    setTotalQuestions(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="rounded-lg border border-input bg-card px-3 py-2 text-sm"
                >
                  <option value={3}>
                    3 Questions
                  </option>

                  <option value={5}>
                    5 Questions
                  </option>

                  <option value={10}>
                    10 Questions
                  </option>

                  <option value={15}>
                    15 Questions
                  </option>

                  <option value={20}>
                    20 Questions
                  </option>
                </select>
              </div>

              <button
                onClick={
                  handleStartInterview
                }
                disabled={
                  starting ||
                  !resumeId
                }
                className="ml-auto inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevate disabled:cursor-not-allowed disabled:opacity-50"
              >
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing Interview...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start Interview
                  </>
                )}
              </button>
            </div>
          </Panel>
        )}

        {/* ================================================= */}
        {/* ACTIVE INTERVIEW */}
        {/* ================================================= */}

        {isInterviewActive &&
          currentQuestion && (
            <>
              {/* Stats */}

              <section className="grid gap-4 md:grid-cols-3">

                <Panel className="flex items-center gap-4 p-5">
                  <div className="rounded-xl bg-primary-soft p-3">
                    <Target className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Progress
                    </p>

                    <p className="text-xl font-bold">
                      {questionNumber} /{" "}
                      {totalQuestions}
                    </p>
                  </div>
                </Panel>

                <Panel className="flex items-center gap-4 p-5">
                  <div className="rounded-xl bg-primary-soft p-3">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Current Score
                    </p>

                    <p className="text-xl font-bold">
                      {readiness}%
                    </p>
                  </div>
                </Panel>

                <Panel className="flex items-center gap-4 p-5">
                  <div className="rounded-xl bg-primary-soft p-3">
                    <Clock3 className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Difficulty
                    </p>

                    <p className="text-xl font-bold capitalize">
                      {difficulty}
                    </p>
                  </div>
                </Panel>
              </section>

              {/* Progress */}

              <Panel className="p-5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold">
                    Interview Progress
                  </span>

                  <span className="text-muted-foreground">
                    {progressPercent}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{
                      width: `${progressPercent}%`,
                    }}
                  />
                </div>
              </Panel>

              {/* Question */}

              <section className="grid gap-4 lg:grid-cols-[1fr_300px]">

                <Panel>
                  <PanelHeader
                    title={`Question ${questionNumber}`}
                    subtitle="Answer as if you were speaking directly to the interviewer."
                  />

                  <div className="p-5">

                    <div className="mb-4 flex flex-wrap items-center gap-2">

                      <span className="inline-flex items-center gap-1 rounded-md bg-primary-soft px-2.5 py-1 text-[11px] font-semibold text-primary">
                        <BrainCircuit className="h-3.5 w-3.5" />
                        AI Generated
                      </span>

                      <span className="rounded-md bg-muted px-2.5 py-1 text-[11px] font-semibold capitalize text-muted-foreground">
                        {interviewType}
                      </span>

                      <span className="rounded-md bg-muted px-2.5 py-1 text-[11px] font-semibold capitalize text-muted-foreground">
                        {difficulty}
                      </span>
                    </div>

                    <h2 className="text-xl font-semibold leading-relaxed tracking-tight">
                      {
                        currentQuestion.question
                      }
                    </h2>

                    <textarea
                      value={answer}
                      onChange={(e) =>
                        setAnswer(
                          e.target.value
                        )
                      }
                      disabled={
                        isEvaluated ||
                        evaluating
                      }
                      rows={7}
                      placeholder="Type your answer as you would say it in the interview..."
                      className="mt-6 w-full resize-y rounded-xl border border-input bg-card px-4 py-3 text-sm leading-relaxed outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:opacity-70"
                    />

                    <div className="mt-4 flex flex-wrap gap-2">

                      {!isEvaluated && (
                        <button
                          onClick={
                            handleEvaluate
                          }
                          disabled={
                            evaluating ||
                            !answer.trim()
                          }
                          className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevate disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {evaluating ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              AI Evaluating...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4" />
                              Submit Answer
                            </>
                          )}
                        </button>
                      )}

                      {isEvaluated &&
                        questionNumber <
                          totalQuestions && (
                          <button
                            onClick={
                              handleNextQuestion
                            }
                            disabled={
                              nextLoading
                            }
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevate disabled:opacity-50"
                          >
                            {nextLoading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                Next Question
                                <ChevronRight className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        )}

                      {isEvaluated &&
                        questionNumber >=
                          totalQuestions && (
                          <button
                            onClick={
                              handleReset
                            }
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted"
                          >
                            <RotateCcw className="h-4 w-4" />
                            Start New Interview
                          </button>
                        )}
                    </div>
                  </div>
                </Panel>

                {/* Score */}

                <Panel className="flex flex-col items-center justify-center p-6">

                  <ProgressRing
                    value={readiness}
                    label="Current Score"
                  />

                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    Based on your evaluated answers
                    in this session.
                  </p>

                  <div className="mt-5 w-full">
                    <ScoreBar
                      label="Interview Progress"
                      current={
                        progressPercent
                      }
                    />
                  </div>
                </Panel>
              </section>

              {/* ================================================= */}
              {/* AI FEEDBACK */}
              {/* ================================================= */}

              {evaluation && (
                <section className="grid gap-4 lg:grid-cols-2">

                  <Panel>
                    <PanelHeader
                      title="AI Evaluation"
                      subtitle="Personalized feedback for your answer."
                    />

                    <div className="space-y-5 p-5">

                      <div className="flex items-center gap-4">

                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft text-xl font-bold text-primary">
                          {
                            evaluation.score
                          }
                          /10
                        </div>

                        <div>
                          <p className="font-semibold">
                            Answer Score
                          </p>

                          <p className="text-sm text-muted-foreground">
                            {evaluation.score >=
                            8
                              ? "Excellent answer"
                              : evaluation.score >=
                                  6
                                ? "Good answer with room to improve"
                                : "Needs improvement"}
                          </p>
                        </div>
                      </div>

                      <AiInsight label="AI Feedback">
                        {
                          evaluation.feedback
                        }
                      </AiInsight>
                    </div>
                  </Panel>

                  {/* Breakdown */}

                  <Panel>
                    <PanelHeader
                      title="Answer Breakdown"
                      subtitle="What worked and what you should improve."
                    />

                    <div className="grid gap-5 p-5 sm:grid-cols-2">

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Strengths
                        </p>

                        <div className="space-y-2">
                          {(
                            evaluation.strengths ??
                            []
                          ).map(
                            (
                              item,
                              index
                            ) => (
                              <div
                                key={index}
                                className="flex gap-2 text-sm"
                              >
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />

                                <span>
                                  {item}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Weaknesses
                        </p>

                        <div className="space-y-2">
                          {(
                            evaluation.weaknesses ??
                            []
                          ).map(
                            (
                              item,
                              index
                            ) => (
                              <div
                                key={index}
                                className="flex gap-2 text-sm"
                              >
                                <Target className="mt-0.5 h-4 w-4 shrink-0 text-warning" />

                                <span>
                                  {item}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </Panel>

                  {/* Improvement */}

                  <Panel>
                    <PanelHeader
                      title="Improvement Tips"
                      subtitle="Use these suggestions in your next answer."
                    />

                    <div className="space-y-3 p-5">
                      {(
                        evaluation.improvement_tips ??
                        evaluation.improvements ??
                        []
                      ).map(
                        (
                          tip,
                          index
                        ) => (
                          <div
                            key={index}
                            className="flex gap-3 rounded-lg bg-muted/50 p-3 text-sm"
                          >
                            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />

                            <span>
                              {tip}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </Panel>

                  {/* Ideal Answer */}

                  <Panel>
                    <PanelHeader
                      title="Ideal Answer"
                      subtitle="Compare your response with a stronger approach."
                    />

                    <div className="p-5">
                      <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm leading-relaxed">
                        {evaluation.ideal_answer ||
                          "The AI did not provide an ideal answer for this question."}
                      </div>
                    </div>
                  </Panel>
                </section>
              )}

              {/* COMPLETE */}

              {isEvaluated &&
                questionNumber >=
                  totalQuestions && (
                  <Panel>
                    <div className="flex flex-col items-center justify-center p-8 text-center">

                      <div className="rounded-full bg-primary-soft p-4">
                        <Trophy className="h-8 w-8 text-primary" />
                      </div>

                      <h2 className="mt-4 text-2xl font-bold">
                        Interview Complete 🎉
                      </h2>

                      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
                        You completed all{" "}
                        {totalQuestions}{" "}
                        questions. Review the AI
                        feedback above and use it to
                        improve your next interview.
                      </p>

                      <div className="mt-6">
                        <ProgressRing
                          value={readiness}
                          label="Final Score"
                        />
                      </div>

                      <button
                        onClick={
                          handleReset
                        }
                        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevate"
                      >
                        <RotateCcw className="h-4 w-4" />
                        Practice Again
                      </button>
                    </div>
                  </Panel>
                )}
            </>
          )}

        {/* ================================================= */}
        {/* HISTORY */}
        {/* ================================================= */}

        <Panel>
          <PanelHeader
            title="Interview History"
            subtitle="Review your previous AI interview sessions."
          />

          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 text-center">

              <History className="h-8 w-8 text-muted-foreground" />

              <p className="mt-3 font-semibold">
                No interviews yet
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                Complete your first AI interview
                to see your performance history here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">

              {history.map(
                (item) => (
                  <div
                    key={
                      item.session_id
                    }
                    className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-3">

                      <div className="rounded-lg bg-primary-soft p-2.5">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>

                      <div>
                        <p className="font-semibold">
                          {item.role ||
                            "Software Developer"}
                        </p>

                        <p className="text-xs capitalize text-muted-foreground">
                          {item.interview_type ||
                            "interview"}{" "}
                          ·{" "}
                          {item.difficulty ||
                            "medium"}{" "}
                          ·{" "}
                          {item.total_questions ??
                            0}{" "}
                          questions
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-5">

                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Score
                        </p>

                        <p className="font-bold">
                          {item.score !==
                            undefined &&
                          item.score !==
                            null
                            ? `${item.score}%`
                            : "Pending"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Date
                        </p>

                        <p className="text-xs font-medium">
                          {item.created_at
                            ? new Date(
                                item.created_at
                              ).toLocaleDateString()
                            : item.completed_at
                              ? new Date(
                                  item.completed_at
                                ).toLocaleDateString()
                              : "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </Panel>

        {/* AI CAREER INSIGHT */}

        <AiInsight label="AI Career Insight">
          Practice consistently rather than memorizing
          answers. Focus on explaining your approach,
          trade-offs, and real project experience clearly.
        </AiInsight>
      </div>
    </AppShell>
  );
}