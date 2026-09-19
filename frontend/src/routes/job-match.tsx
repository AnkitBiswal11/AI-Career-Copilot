import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Check,
  FileText,
  Lightbulb,
  Loader2,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
  ProgressRing,
} from "@/components/ui-kit/primitives";
import { inputClass } from "@/components/auth/AuthLayout";
import { api } from "@/services/api";
import type { JobMatch } from "@/types/api";

export const Route = createFileRoute("/job-match")({
  head: () => ({
    meta: [
      {
        title: "Job Match Analysis — Career Copilot",
      },
      {
        name: "description",
        content:
          "Measure how strongly your resume matches a specific job description, skill by skill.",
      },
      {
        property: "og:title",
        content: "Job Match Analysis — Career Copilot",
      },
      {
        property: "og:description",
        content:
          "Match score, matching skills and missing skills for any role.",
      },
    ],
  }),
  component: JobMatchPage,
});

type DashboardResume = {
  id: number | string;
  filename: string;
};

type DashboardData = {
  resumes?: DashboardResume[];
};

function JobMatchPage() {
  const [company, setCompany] = useState("Microsoft");

  const [title, setTitle] = useState("Backend Developer");

  const [description, setDescription] = useState(
    "We are looking for a backend developer with strong Python, FastAPI and SQL skills. Experience with Docker, AWS and solid data structures & algorithms fundamentals is required.",
  );

  const [resumeId, setResumeId] = useState<number | string | null>(null);

  const [resumeName, setResumeName] = useState(
    "No resume selected",
  );

  const [jobId, setJobId] = useState<number | string | null>(null);

  const [loading, setLoading] = useState(false);

  const [savingJob, setSavingJob] = useState(false);

  const [result, setResult] = useState<JobMatch | null>(null);

  const [error, setError] = useState<string | null>(null);

  /*
   * ------------------------------------------------------------
   * Load the user's analyzed resume
   * ------------------------------------------------------------
   *
   * First try cc_resume_id.
   *
   * If it doesn't exist, fall back to the latest resume
   * returned by the dashboard API.
   */
  useEffect(() => {
    const loadResume = async () => {
      try {
        setError(null);

        const savedResumeId =
          window.localStorage.getItem("cc_resume_id");

        let selectedResumeId = savedResumeId;

        /*
         * Fallback:
         * Get the latest resume from the real backend.
         */
        if (!selectedResumeId) {
          const dashboard =
            (await api.dashboard()) as DashboardData;

          const latestResume = dashboard.resumes?.[0];

          if (!latestResume) {
            setError(
              "No resume found. Please upload and analyze your resume first.",
            );

            return;
          }

          selectedResumeId = String(latestResume.id);

          /*
           * Save it so future visits can load it directly.
           */
          window.localStorage.setItem(
            "cc_resume_id",
            selectedResumeId,
          );
        }

        setResumeId(selectedResumeId);

        /*
         * Get the actual resume from FastAPI.
         */
        const resume = await api.getResume(
          selectedResumeId,
        );

        /*
         * Job matching should only use an analyzed resume.
         */
        if (!resume.analysis) {
          setError(
            "Your resume has not been analyzed yet. Please analyze it first.",
          );

          return;
        }

        setResumeName(resume.filename);
      } catch (err) {
        console.error(
          "Failed to load resume:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Could not load your saved resume.",
        );
      }
    };

    loadResume();
  }, []);

  /*
   * ------------------------------------------------------------
   * Analyze Job Match
   * ------------------------------------------------------------
   *
   * 1. Validate inputs
   * 2. Save job description to MySQL
   * 3. Send job + resume to FastAPI
   * 4. FastAPI calls Ollama/Qwen3
   * 5. Display real AI result
   */
  const analyze = async () => {
    if (!resumeId) {
      setError(
        "Please upload and analyze a resume first before running Job Match.",
      );

      return;
    }

    if (!company.trim()) {
      setError("Please enter the company name.");

      return;
    }

    if (!title.trim()) {
      setError("Please enter the job title.");

      return;
    }

    if (!description.trim()) {
      setError("Please enter the job description.");

      return;
    }

    setLoading(true);

    setSavingJob(true);

    setError(null);

    setResult(null);

    try {
      /*
       * Always create a fresh job.
       *
       * This prevents an old job description from being reused
       * after the user changes the current description.
       */
      const savedJob = await api.createJob({
        company: company.trim(),
        title: title.trim(),
        description: description.trim(),
      });

      const currentJobId = savedJob.job_id;

      setJobId(currentJobId);

      setSavingJob(false);

      /*
       * Run the actual AI match.
       */
      const matchResult = await api.matchJob(
        currentJobId,
        resumeId,
      );

      setResult(matchResult);
    } catch (err) {
      console.error(
        "Job match failed:",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze the job match.",
      );
    } finally {
      setLoading(false);

      setSavingJob(false);
    }
  };

  /*
   * ------------------------------------------------------------
   * Skill Coverage Chart
   * ------------------------------------------------------------
   *
   * The backend gives us matching_skills and missing_skills.
   *
   * It does NOT give us actual skill proficiency percentages,
   * so we don't pretend that it does.
   *
   * Instead:
   *
   * Matching skill = resume evidence found
   * Missing skill  = resume evidence not found
   *
   * This makes the chart honest and explainable.
   */
  const skillCoverageData =
    result
      ? [
          ...result.analysis.matching_skills.map(
            (skill) => ({
              skill,
              coverage: 100,
            }),
          ),
          ...result.analysis.missing_skills.map(
            (skill) => ({
              skill,
              coverage: 0,
            }),
          ),
        ].slice(0, 10)
      : [];

  /*
   * ------------------------------------------------------------
   * Recommendation helper
   * ------------------------------------------------------------
   */
  const getRecommendationText = () => {
    if (!result) {
      return "";
    }

    switch (result.analysis.recommendation) {
      case "APPLY":
        return "Your profile is a strong fit for this role. You should consider applying.";

      case "APPLY WITH PREPARATION":
        return "You have a reasonable foundation for this role, but prepare the identified skill gaps before interviewing.";

      case "NOT READY":
        return "Several important requirements are currently missing. Focus on the recommended learning areas before targeting this role.";

      default:
        return "Review the skill gaps and recommendations before applying.";
    }
  };

  return (
    <AppShell
      title="Job Match"
      subtitle="Compare your profile against a specific role."
    >
      <div className="space-y-6">
        {/* =====================================================
            ERROR MESSAGE
        ====================================================== */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />

            <div>
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            JOB INPUT + RESUME
        ====================================================== */}
        <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
          {/* ===================================================
              JOB DESCRIPTION
          ==================================================== */}
          <Panel>
            <PanelHeader
              title="Job Description"
              subtitle="Paste the role you want to target."
            />

            <div className="space-y-4 p-5">
              {/* Company + Job Title */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Company */}
                <label className="block">
                  <span className="text-xs font-medium">
                    Company
                  </span>

                  <input
                    value={company}
                    onChange={(e) => {
                      setCompany(e.target.value);

                      setJobId(null);

                      setResult(null);
                    }}
                    placeholder="e.g. Microsoft"
                    className={`${inputClass} mt-1.5`}
                  />
                </label>

                {/* Job Title */}
                <label className="block">
                  <span className="text-xs font-medium">
                    Job Title
                  </span>

                  <input
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);

                      setJobId(null);

                      setResult(null);
                    }}
                    placeholder="e.g. Backend Developer"
                    className={`${inputClass} mt-1.5`}
                  />
                </label>
              </div>

              {/* Job Description */}
              <label className="block">
                <span className="text-xs font-medium">
                  Job Description
                </span>

                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);

                    setJobId(null);

                    setResult(null);
                  }}
                  rows={9}
                  placeholder="Paste the complete job description here..."
                  className={`${inputClass} mt-1.5 resize-y leading-relaxed`}
                />
              </label>

              <p className="text-xs text-muted-foreground">
                Tip: Include the complete job description
                for a more useful AI skill-gap analysis.
              </p>
            </div>
          </Panel>

          {/* ===================================================
              RESUME + BUTTON
          ==================================================== */}
          <div className="space-y-4">
            {/* Selected Resume */}
            <Panel>
              <PanelHeader title="Selected Resume" />

              <div className="flex items-center gap-3 p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <FileText className="h-5 w-5" />
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {resumeName}
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {resumeId
                      ? "Latest analyzed resume"
                      : "Upload a resume first"}
                  </p>
                </div>
              </div>
            </Panel>

            {/* Analyze Button */}
            <button
              onClick={analyze}
              disabled={loading || !resumeId}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-gradient px-4 py-3 text-sm font-semibold text-primary-foreground shadow-elevate transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}

              {savingJob
                ? "Saving job…"
                : loading
                  ? "AI is analyzing your match…"
                  : "Analyze Match"}
            </button>

            {!resumeId && (
              <p className="text-center text-xs text-muted-foreground">
                Upload and analyze your resume before
                matching it with a job.
              </p>
            )}
          </div>
        </section>

        {/* =====================================================
            RESULTS
        ====================================================== */}
        {result && (
          <>
            {/* =================================================
                SCORE + MATCHING/MISSING SKILLS
            ================================================== */}
            <section className="grid animate-rise gap-4 lg:grid-cols-[340px_1fr]">
              {/* Match Score */}
              <Panel className="flex flex-col items-center justify-center p-6">
                <ProgressRing
                  value={result.analysis.match_score}
                  label={
                    result.analysis.recommendation
                  }
                />

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  {result.job_title} ·{" "}
                  {result.company}
                </p>

                <div className="mt-5 flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1.5 text-xs font-medium text-primary">
                  <Target className="h-3.5 w-3.5" />

                  {result.analysis.match_score}% match
                </div>
              </Panel>

              {/* Matching + Missing */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Matching Skills */}
                <Panel>
                  <PanelHeader
                    title="Matching Skills"
                    subtitle="Skills demonstrated by your resume."
                  />

                  <div className="p-5">
                    {result.analysis
                      .matching_skills.length > 0 ? (
                      <ul className="space-y-2.5">
                        {result.analysis.matching_skills.map(
                          (skill) => (
                            <li
                              key={skill}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Check className="h-4 w-4 shrink-0 text-success" />

                              <span>{skill}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No clear matching skills were
                        identified.
                      </p>
                    )}
                  </div>
                </Panel>

                {/* Missing Skills */}
                <Panel>
                  <PanelHeader
                    title="Missing Skills"
                    subtitle="Important requirements not demonstrated."
                  />

                  <div className="p-5">
                    {result.analysis
                      .missing_skills.length > 0 ? (
                      <ul className="space-y-2.5">
                        {result.analysis.missing_skills.map(
                          (skill) => (
                            <li
                              key={skill}
                              className="flex items-center gap-2 text-sm"
                            >
                              <X className="h-4 w-4 shrink-0 text-destructive" />

                              <span>{skill}</span>
                            </li>
                          ),
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No major skill gaps were
                        identified.
                      </p>
                    )}
                  </div>
                </Panel>
              </div>
            </section>

            {/* =================================================
                SKILL COVERAGE + AI RECOMMENDATION
            ================================================== */}
            <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
              {/* Skill Coverage Chart */}
              <Panel>
                <PanelHeader
                  title="Skill Requirement Coverage"
                  subtitle="Based on skills demonstrated in your resume."
                />

                <div className="h-[360px] p-5">
                  {skillCoverageData.length > 0 ? (
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                    >
                      <BarChart
                        data={skillCoverageData}
                        layout="vertical"
                        margin={{
                          top: 10,
                          right: 20,
                          left: 20,
                          bottom: 10,
                        }}
                      >
                        <CartesianGrid
                          stroke="var(--border)"
                          strokeDasharray="3 3"
                          horizontal={false}
                        />

                        <XAxis
                          type="number"
                          domain={[0, 100]}
                          tick={{
                            fontSize: 11,
                            fill: "var(--muted-foreground)",
                          }}
                          unit="%"
                        />

                        <YAxis
                          type="category"
                          dataKey="skill"
                          width={110}
                          tick={{
                            fontSize: 11,
                            fill: "var(--muted-foreground)",
                          }}
                        />

                        <Tooltip
                          formatter={(value) => [
                            `${value}%`,
                            "Resume evidence",
                          ]}
                          contentStyle={{
                            borderRadius: 10,
                            border:
                              "1px solid var(--border)",
                            background:
                              "var(--card)",
                            fontSize: 12,
                          }}
                        />

                        <Legend
                          wrapperStyle={{
                            fontSize: 12,
                          }}
                        />

                        <Bar
                          dataKey="coverage"
                          name="Resume Evidence"
                          fill="var(--primary)"
                          radius={[0, 6, 6, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      Not enough skill data for the
                      chart.
                    </div>
                  )}
                </div>
              </Panel>

              {/* AI Recommendation */}
              <AiInsight label="AI Recommendation">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold">
                      {result.analysis.recommendation}
                    </p>

                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {getRecommendationText()}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="text-xs text-muted-foreground">
                      Match Score
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                      {result.analysis.match_score}%
                    </p>
                  </div>

                  {/* Recommended Learning */}
                  {result.analysis
                    .recommended_learning.length >
                    0 && (
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                        <Lightbulb className="h-3.5 w-3.5" />

                        Focus next
                      </p>

                      <ul className="space-y-1.5">
                        {result.analysis.recommended_learning
                          .slice(0, 4)
                          .map((item) => (
                            <li
                              key={item}
                              className="text-sm leading-relaxed text-muted-foreground"
                            >
                              • {item}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AiInsight>
            </section>

            {/* =================================================
                STRENGTHS + WEAKNESSES
            ================================================== */}
            <section className="grid gap-4 lg:grid-cols-2">
              {/* Strengths */}
              <Panel>
                <PanelHeader
                  title="Your Strengths"
                  subtitle="What makes you a good candidate for this role."
                />

                <div className="p-5">
                  {result.analysis.strengths.length >
                  0 ? (
                    <ul className="space-y-3">
                      {result.analysis.strengths.map(
                        (strength) => (
                          <li
                            key={strength}
                            className="flex items-start gap-3"
                          >
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                              <Check className="h-3.5 w-3.5" />
                            </span>

                            <span className="text-sm leading-relaxed">
                              {strength}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No specific strengths were
                      returned by the AI.
                    </p>
                  )}
                </div>
              </Panel>

              {/* Weaknesses */}
              <Panel>
                <PanelHeader
                  title="Areas to Improve"
                  subtitle="Gaps that could reduce your chances."
                />

                <div className="p-5">
                  {result.analysis.weaknesses.length >
                  0 ? (
                    <ul className="space-y-3">
                      {result.analysis.weaknesses.map(
                        (weakness) => (
                          <li
                            key={weakness}
                            className="flex items-start gap-3"
                          >
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                              <X className="h-3.5 w-3.5" />
                            </span>

                            <span className="text-sm leading-relaxed">
                              {weakness}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No specific weaknesses were
                      returned by the AI.
                    </p>
                  )}
                </div>
              </Panel>
            </section>

            {/* =================================================
                RECOMMENDED LEARNING + INTERVIEW TOPICS
            ================================================== */}
            <section className="grid gap-4 lg:grid-cols-2">
              {/* Recommended Learning */}
              <Panel>
                <PanelHeader
                  title="Recommended Learning"
                  subtitle="What to study before targeting this role."
                />

                <div className="p-5">
                  {result.analysis
                    .recommended_learning.length >
                  0 ? (
                    <ol className="space-y-3">
                      {result.analysis.recommended_learning.map(
                        (item, index) => (
                          <li
                            key={item}
                            className="flex items-start gap-3"
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                              {index + 1}
                            </span>

                            <span className="pt-1 text-sm leading-relaxed">
                              {item}
                            </span>
                          </li>
                        ),
                      )}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No learning recommendations
                      were returned.
                    </p>
                  )}
                </div>
              </Panel>

              {/* Interview Topics */}
              <Panel>
                <PanelHeader
                  title="Interview Topics"
                  subtitle="Topics worth preparing for this role."
                />

                <div className="p-5">
                  {result.analysis
                    .interview_topics.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {result.analysis.interview_topics.map(
                        (topic) => (
                          <span
                            key={topic}
                            className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-xs font-medium"
                          >
                            {topic}
                          </span>
                        ),
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No interview topics were
                      returned.
                    </p>
                  )}
                </div>
              </Panel>
            </section>

            {/* =================================================
                FINAL AI SUMMARY
            ================================================== */}
            <AiInsight label="Career Copilot Summary">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Sparkles className="h-4 w-4" />
                </span>

                <div>
                  <p className="text-sm font-semibold">
                    Your next move
                  </p>

                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {getRecommendationText()}
                  </p>
                </div>
              </div>
            </AiInsight>
          </>
        )}

        {/* =====================================================
            EMPTY STATE
        ====================================================== */}
        {!result && !loading && !error && (
          <Panel className="p-8">
            <div className="mx-auto flex max-w-lg flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Sparkles className="h-7 w-7" />
              </span>

              <h3 className="mt-4 text-lg font-semibold">
                Ready to analyze your match?
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Enter a job description above and Career
                Copilot will compare it against your
                analyzed resume using your local AI model.
              </p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <span className="rounded-full bg-muted px-3 py-1.5 text-xs">
                  Skill matching
                </span>

                <span className="rounded-full bg-muted px-3 py-1.5 text-xs">
                  Skill gaps
                </span>

                <span className="rounded-full bg-muted px-3 py-1.5 text-xs">
                  AI recommendation
                </span>

                <span className="rounded-full bg-muted px-3 py-1.5 text-xs">
                  Interview topics
                </span>
              </div>
            </div>
          </Panel>
        )}
      </div>
    </AppShell>
  );
}