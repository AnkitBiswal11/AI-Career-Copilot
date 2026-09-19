import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  FileText,
  MessagesSquare,
  Sparkles,
  Target,
  Map as MapIcon,
} from "lucide-react";
import { Area, AreaChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { Logo } from "@/components/brand/Logo";
import { careerReadiness } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Career Copilot — Turn your resume into a career strategy" },
      {
        name: "description",
        content:
          "Analyse your resume, match real job descriptions, discover skill gaps, build a learning roadmap and prepare for interviews in one AI career platform.",
      },
      { property: "og:title", content: "Career Copilot — AI career intelligence for students" },
      {
        property: "og:description",
        content: "Your AI-powered path from student to job-ready.",
      },
    ],
  }),
  component: LandingPage,
});

const FEATURES = [
  {
    icon: FileText,
    title: "Resume Intelligence",
    body: "Understand exactly how recruiters and ATS systems see your resume.",
  },
  {
    icon: Briefcase,
    title: "Job Match",
    body: "Measure how strongly your profile matches a specific role.",
  },
  {
    icon: Target,
    title: "Skill Gap Intelligence",
    body: "Discover the exact skills you need to improve.",
  },
  {
    icon: MapIcon,
    title: "Career Roadmap",
    body: "Get a personalized path from your current level to your target role.",
  },
  {
    icon: MessagesSquare,
    title: "Interview Coach",
    body: "Practice technical, HR, behavioral and project questions.",
  },
  {
    icon: BookOpen,
    title: "AI Career Coach",
    body: "Ask Career Copilot what you should do next.",
  },
];

const STEPS = [
  { n: "01", title: "Upload Resume", body: "Drop a PDF and Career Copilot parses skills, projects and impact." },
  { n: "02", title: "Analyze Profile", body: "Scored across content, ATS parsing, projects and formatting." },
  { n: "03", title: "Match Target Jobs", body: "Compare your profile against real job descriptions, skill by skill." },
  { n: "04", title: "Build Your Career Plan", body: "A sequenced roadmap with time estimates and priorities." },
];

function HeroPreview() {
  const radar = careerReadiness.breakdown;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-float">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <Logo />
        <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
          Live preview
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { k: "Career Readiness", v: "78", s: "/ 100" },
          { k: "Resume Score", v: "86", s: "%" },
          { k: "Job Match", v: "82", s: "%" },
          { k: "Skill Gap", v: "6", s: "skills" },
        ].map((m) => (
          <div key={m.k} className="rounded-xl border border-border p-3">
            <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{m.k}</p>
            <p className="mt-1.5 text-2xl font-semibold leading-none tabular">
              {m.v}
              <span className="ml-1 text-[11px] font-medium text-muted-foreground">{m.s}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-3">
          <p className="text-[11px] font-medium text-muted-foreground">Career progress</p>
          <div className="mt-1 h-[110px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={careerReadiness.history}>
                <defs>
                  <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#heroGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border p-3">
          <p className="text-[11px] font-medium text-muted-foreground">Skill radar</p>
          <div className="h-[110px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="78%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 8, fill: "var(--muted-foreground)" }} />
                <Radar dataKey="score" stroke="var(--brand-blue)" fill="var(--brand-blue)" fillOpacity={0.18} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium">Microsoft · Backend Developer</p>
            <span className="rounded-md bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success tabular">
              84%
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-muted">
            <div className="h-1.5 w-[84%] rounded-full bg-brand-gradient" />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Missing: Docker, Azure</p>
        </div>

        <div className="rounded-xl border border-primary/25 bg-primary-soft/60 p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
            <Sparkles className="h-3 w-3" /> AI Recommendation
          </p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-foreground/80">
            Improve DSA fundamentals — 14 days of focused practice lifts interview readiness from
            64% to an estimated 79%.
          </p>
        </div>
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <Link to="/dashboard" className="transition-colors hover:text-foreground">Demo</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-primary-foreground shadow-elevate transition-opacity hover:opacity-95"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 surface-grid opacity-60" />
          <div className="absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary-soft/70 to-transparent" />
          <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:py-28">
            <div className="animate-rise">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-card px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                <Sparkles className="h-3 w-3" /> Your AI Career Copilot
              </span>
              <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
                Turn your resume into a <span className="text-gradient-brand">career strategy</span>.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
                Analyze your resume, match real job descriptions, discover skill gaps, build a
                personalized learning roadmap, and prepare for interviews — all in one intelligent
                career platform.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elevate transition-transform hover:-translate-y-0.5"
                >
                  Start My Career Analysis <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold shadow-elevate transition-colors hover:border-primary/35"
                >
                  Explore Demo
                </Link>
              </div>
              <dl className="mt-10 grid max-w-md grid-cols-3 gap-6">
                {[
                  { k: "Resume signals", v: "40+" },
                  { k: "Roadmap stages", v: "5" },
                  { k: "Practice questions", v: "50" },
                ].map((s) => (
                  <div key={s.k}>
                    <dt className="text-xl font-semibold tabular">{s.v}</dt>
                    <dd className="text-xs text-muted-foreground">{s.k}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="animate-rise [animation-delay:120ms]">
              <HeroPreview />
            </div>
          </div>
        </section>

        <section id="features" className="border-b border-border py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight">
              Everything you need to become placement-ready.
            </h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              Six connected systems, one continuous view of your career readiness.
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-border bg-card p-6 shadow-elevate transition-all hover:-translate-y-0.5 hover:border-primary/30"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <f.icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="border-b border-border py-20">
          <div className="mx-auto max-w-6xl px-5">
            <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
            <div className="relative mt-12">
              <div className="absolute left-5 top-0 hidden h-full w-px bg-border md:left-0 md:top-6 md:h-px md:w-full md:block" />
              <ol className="grid gap-8 md:grid-cols-4">
                {STEPS.map((s) => (
                  <li key={s.n} className="relative pl-14 md:pl-0 md:pt-14">
                    <span className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-primary/25 bg-card text-xs font-semibold text-primary shadow-elevate md:top-1">
                      {s.n}
                    </span>
                    <h3 className="text-sm font-semibold tracking-tight">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-4xl px-5">
            <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-primary-soft/50 p-10 text-center shadow-elevate">
              <div className="absolute inset-0 surface-grid opacity-50" />
              <div className="relative">
                <h2 className="text-3xl font-semibold tracking-tight">
                  Your AI-powered path from student to job-ready.
                </h2>
                <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
                  Upload one resume and see your readiness score, gaps and 30-day plan in minutes.
                </p>
                <Link
                  to="/register"
                  className="mt-7 inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elevate transition-transform hover:-translate-y-0.5"
                >
                  Start My Career Analysis <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 sm:flex-row">
          <Logo />
          <p className="text-xs text-muted-foreground">
            Your AI-powered path from student to job-ready.
          </p>
        </div>
      </footer>
    </div>
  );
}
