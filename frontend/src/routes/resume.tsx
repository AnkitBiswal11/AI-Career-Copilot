import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Target,
  UploadCloud,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import {
  AiInsight,
  Panel,
  PanelHeader,
  ProgressRing,
  ScoreBar,
} from "@/components/ui-kit/primitives";
import { api } from "@/services/api";

export const Route = createFileRoute("/resume")({
  head: () => ({
    meta: [
      {
        title: "Resume Intelligence — Career Copilot",
      },
      {
        name: "description",
        content:
          "Understand exactly how recruiters and ATS systems read your resume, with a scored breakdown and fixes.",
      },
      {
        property: "og:title",
        content: "Resume Intelligence — Career Copilot",
      },
      {
        property: "og:description",
        content:
          "Score, ATS compatibility, strengths and improvements for your resume.",
      },
    ],
  }),
  component: ResumePage,
});

type Analysis = {
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
  skill_scores: {
    skill: string;
    score: number;
  }[];
  raw_analysis?: string;
};

function ResumePage() {
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<{
    name: string;
    size: string;
    date: string;
  } | null>(null);

  const [resumeId, setResumeId] = useState<
    number | string | null
  >(null);

  const [analysis, setAnalysis] =
    useState<Analysis | null>(null);

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingSavedResume, setLoadingSavedResume] =
    useState(true);

  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  // Load saved resume from MySQL when page opens
  useEffect(() => {
    const savedResumeId =
      localStorage.getItem("cc_resume_id");

    if (!savedResumeId) {
      setLoadingSavedResume(false);
      return;
    }

    setResumeId(savedResumeId);

    api
      .getResume(savedResumeId)
      .then((response) => {
        setFile({
          name: response.filename,
          size: "Saved resume",
          date: "Loaded from your account",
        });

        if (response.analysis) {
          setAnalysis(response.analysis);
        }
      })
      .catch((err) => {
        console.error(
          "Failed to load saved resume:",
          err,
        );

        localStorage.removeItem("cc_resume_id");

        setResumeId(null);
        setFile(null);
        setAnalysis(null);
      })
      .finally(() => {
        setLoadingSavedResume(false);
      });
  }, []);

  // Upload resume
  const accept = async (
    selectedFile: File | undefined,
  ) => {
    if (!selectedFile) {
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setError("Please upload a PDF resume.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Resume must be smaller than 10MB.");
      return;
    }

    setError("");
    setAnalysis(null);
    setResumeId(null);

    setFile({
      name: selectedFile.name,
      size: `${Math.max(
        1,
        Math.round(selectedFile.size / 1024),
      )} KB`,
      date: `Selected ${new Date().toLocaleDateString()}`,
    });

    try {
      setUploading(true);

      const response =
        await api.uploadResume(selectedFile);

      setResumeId(response.resume_id);

      localStorage.setItem(
        "cc_resume_id",
        String(response.resume_id),
      );

      setFile({
        name: response.filename,
        size: `${Math.max(
          1,
          Math.round(selectedFile.size / 1024),
        )} KB`,
        date: `Uploaded ${new Date().toLocaleDateString()}`,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload resume.",
      );

      setFile(null);
      setResumeId(null);
    } finally {
      setUploading(false);
    }
  };

  // Analyze resume
  const analyze = async () => {
    if (!resumeId) {
      setError("Please upload a resume first.");
      return;
    }

    setError("");
    setAnalyzing(true);

    try {
      const response =
        await api.analyzeResume(resumeId);

      setAnalysis(response.analysis);

      localStorage.setItem(
        "cc_resume_id",
        String(resumeId),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze resume.",
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const score = analysis?.resume_score ?? 0;

  return (
    <AppShell
      title="Resume Intelligence"
      subtitle="See your resume the way recruiters and ATS systems see it."
    >
      <div className="space-y-6">

        {/* Loading */}
        {loadingSavedResume && (
          <Panel className="flex items-center justify-center p-8">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                Loading your saved resume...
              </span>
            </div>
          </Panel>
        )}

        {/* Upload Section */}
        {!loadingSavedResume && (
          <section className="grid gap-4 lg:grid-cols-[1fr_360px]">

            <Panel className="p-6">

              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => {
                  setDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);

                  void accept(
                    event.dataTransfer.files[0],
                  );
                }}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
                  dragging
                    ? "border-primary bg-primary-soft/50"
                    : "border-border bg-muted/40"
                }`}
              >
                <UploadCloud className="h-8 w-8 text-primary" />

                <p className="mt-3 text-sm font-semibold">
                  Drop your resume here
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  PDF up to 10MB
                </p>

                <button
                  type="button"
                  onClick={() => {
                    inputRef.current?.click();
                  }}
                  disabled={uploading}
                  className="mt-5 rounded-lg border border-border bg-card px-4 py-2 text-sm font-semibold shadow-elevate transition-colors hover:border-primary/40 disabled:opacity-60"
                >
                  {uploading
                    ? "Uploading..."
                    : file
                      ? "Upload New Resume"
                      : "Choose Resume"}
                </button>

                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(event) => {
                    void accept(
                      event.target.files?.[0],
                    );

                    event.target.value = "";
                  }}
                />
              </div>

              {/* Uploaded Resume */}
              {file && (
                <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-border p-4">

                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <FileText className="h-5 w-5" />
                  </span>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {file.name}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      {file.size} · {file.date}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      void analyze();
                    }}
                    disabled={
                      analyzing ||
                      uploading ||
                      !resumeId
                    }
                    className="ml-auto inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elevate transition-opacity hover:opacity-95 disabled:opacity-70"
                  >
                    {analyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}

                    {analyzing
                      ? "Analysing..."
                      : analysis
                        ? "Re-analyze Resume"
                        : "Analyze Resume"}
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">

                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

                  <p>{error}</p>

                </div>
              )}

            </Panel>

            {/* Resume Score */}
            <Panel className="flex flex-col items-center justify-center p-6">

              <ProgressRing
                value={score}
                label="Resume Score"
                size={180}
              />

              <p className="mt-4 text-center text-xs text-muted-foreground">
                {analysis
                  ? "AI-powered score based on your resume"
                  : "Upload and analyze your resume"}
              </p>

            </Panel>

          </section>
        )}

        {/* Analysis */}
        {analysis && (
          <>

            {/* Candidate Summary */}
            <Panel>

              <PanelHeader
                title="Candidate Summary"
                subtitle="AI-generated overview of your professional profile."
              />

              <div className="p-5">
                <p className="text-sm leading-7 text-muted-foreground">
                  {analysis.candidate_summary}
                </p>
              </div>

            </Panel>

            {/* Skills */}
            <section className="grid gap-4 lg:grid-cols-2">

              <Panel>

                <PanelHeader
                  title="Technical Skills"
                  subtitle={`${analysis.technical_skills.length} skills detected`}
                />

                <div className="flex flex-wrap gap-2 p-5">
                  {analysis.technical_skills.length > 0 ? (
                    analysis.technical_skills.map(
                      (skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ),
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No technical skills detected.
                    </p>
                  )}
                </div>

              </Panel>

              <Panel>

                <PanelHeader
                  title="Soft Skills"
                  subtitle="Strengths identified from your resume."
                />

                <div className="flex flex-wrap gap-2 p-5">
                  {analysis.soft_skills.length > 0 ? (
                    analysis.soft_skills.map(
                      (skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium"
                        >
                          {skill}
                        </span>
                      ),
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No soft skills explicitly identified.
                    </p>
                  )}
                </div>

              </Panel>

            </section>

            {/* Skill Intelligence */}
            <Panel>

              <PanelHeader
                title="Skill Intelligence"
                subtitle="AI-estimated proficiency based only on evidence in your resume."
              />

              <div className="space-y-4 p-5">
                {analysis.skill_scores.length > 0 ? (
                  analysis.skill_scores.map(
                    (item) => (
                      <ScoreBar
                        key={item.skill}
                        label={item.skill}
                        current={item.score}
                      />
                    ),
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No skill scores were generated.
                  </p>
                )}
              </div>

            </Panel>

            {/* Strengths and Weaknesses */}
            <section className="grid gap-4 lg:grid-cols-2">

              <Panel>

                <PanelHeader
                  title="Strengths"
                  subtitle="What is already working for you."
                />

                {analysis.strengths.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {analysis.strengths.map(
                      (strength) => (
                        <li
                          key={strength}
                          className="flex gap-3 px-5 py-4"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

                          <p className="text-sm leading-relaxed">
                            {strength}
                          </p>
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="p-5 text-sm text-muted-foreground">
                    No strengths were identified.
                  </p>
                )}

              </Panel>

              <Panel>

                <PanelHeader
                  title="Weaknesses"
                  subtitle="Areas that need attention."
                />

                {analysis.weaknesses.length > 0 ? (
                  <ul className="divide-y divide-border">
                    {analysis.weaknesses.map(
                      (weakness) => (
                        <li
                          key={weakness}
                          className="flex gap-3 px-5 py-4"
                        >
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

                          <p className="text-sm leading-relaxed">
                            {weakness}
                          </p>
                        </li>
                      ),
                    )}
                  </ul>
                ) : (
                  <p className="p-5 text-sm text-muted-foreground">
                    No weaknesses explicitly identified.
                  </p>
                )}

              </Panel>

            </section>

            {/* Skill Gap */}
            <Panel>

              <PanelHeader
                title="Skill Gap"
                subtitle="Skills worth developing for stronger placement readiness."
              />

              <div className="p-5">

                {analysis.missing_skills.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                    {analysis.missing_skills.map(
                      (skill) => (
                        <div
                          key={skill}
                          className="flex items-center gap-3 rounded-lg border border-border p-4"
                        >
                          <Target className="h-4 w-4 shrink-0" />

                          <span className="text-sm font-medium">
                            {skill}
                          </span>
                        </div>
                      ),
                    )}

                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No specific missing skills were identified from the current resume.
                  </p>
                )}

              </div>

            </Panel>

            {/* Recommended Roles */}
            <Panel>

              <PanelHeader
                title="Recommended Career Roles"
                subtitle="Roles that align with your current resume."
              />

              <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">

                {analysis.suitable_job_roles.length > 0 ? (
                  analysis.suitable_job_roles.map(
                    (role) => (
                      <div
                        key={role}
                        className="flex items-center gap-3 rounded-xl border border-border p-4"
                      >
                        <Briefcase className="h-5 w-5 shrink-0 text-primary" />

                        <span className="text-sm font-semibold">
                          {role}
                        </span>
                      </div>
                    ),
                  )
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No suitable roles were identified.
                  </p>
                )}

              </div>

            </Panel>

            {/* Improvement Suggestions */}
            {analysis.improvement_suggestions.length > 0 && (
              <Panel>

                <PanelHeader
                  title="Improvement Suggestions"
                  subtitle="Practical actions to improve your resume."
                />

                <ul className="divide-y divide-border">

                  {analysis.improvement_suggestions.map(
                    (suggestion) => (
                      <li
                        key={suggestion}
                        className="flex gap-3 px-5 py-4"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />

                        <p className="text-sm leading-relaxed">
                          {suggestion}
                        </p>
                      </li>
                    ),
                  )}

                </ul>

              </Panel>
            )}

            {/* Placement Plan */}
            {analysis.placement_preparation_plan.length > 0 && (
              <Panel>

                <PanelHeader
                  title="Placement Preparation Plan"
                  subtitle="Your AI-generated preparation roadmap."
                />

                <ol className="divide-y divide-border">

                  {analysis.placement_preparation_plan.map(
                    (step, index) => (
                      <li
                        key={step}
                        className="flex gap-4 px-5 py-4"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                          {index + 1}
                        </span>

                        <p className="text-sm leading-relaxed">
                          {step}
                        </p>
                      </li>
                    ),
                  )}

                </ol>

              </Panel>
            )}

            {/* AI Insight */}
            <AiInsight>
              Career Copilot analyzed this resume using your
              locally running Qwen3 AI model. The recommendations
              are generated from the information detected in the
              uploaded resume.
            </AiInsight>

          </>
        )}

        {/* Empty State */}
        {!loadingSavedResume &&
          !analysis &&
          !analyzing && (
            <Panel className="p-10 text-center">

              <Sparkles className="mx-auto h-8 w-8 text-primary" />

              <h3 className="mt-4 text-sm font-semibold">
                Your AI resume analysis will appear here
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Upload your PDF resume and click Analyze Resume
                to generate your personalized career intelligence
                report.
              </p>

            </Panel>
          )}

      </div>
    </AppShell>
  );
}