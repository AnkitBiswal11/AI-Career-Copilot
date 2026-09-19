import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Panel, PanelHeader } from "@/components/ui-kit/primitives";
import { API_BASE_URL } from "@/services/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Career Copilot" },
      {
        name: "description",
        content:
          "Configure notifications, weekly learning goals and the backend connection for Career Copilot.",
      },
      { property: "og:title", content: "Settings — Career Copilot" },
      { property: "og:description", content: "Preferences and platform configuration." },
    ],
  }),
  component: SettingsPage,
});

function Toggle({ label, hint, defaultOn = false }: { label: string; hint: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-start justify-between gap-6 px-5 py-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>
      <button
        onClick={() => setOn((v) => !v)}
        aria-pressed={on}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          on ? "bg-primary" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform",
            on ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

function SettingsPage() {
  return (
    <AppShell title="Settings" subtitle="Preferences, notifications and platform configuration.">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Notifications" subtitle="Career Copilot only pings you when it matters." />
          <div className="divide-y divide-border">
            <Toggle label="Weekly readiness digest" hint="A Monday summary of score movement and next actions." defaultOn />
            <Toggle label="New skill gap detected" hint="Alert when an analysed role introduces a new required skill." defaultOn />
            <Toggle label="Streak reminders" hint="Nudge me if I'm about to break my learning streak." />
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Learning Preferences" subtitle="Drives roadmap pacing and time estimates." />
          <div className="divide-y divide-border">
            <Toggle label="Aggressive placement mode" hint="Compress the roadmap into the shortest viable timeline." />
            <Toggle label="Include GenAI track" hint="Keep LLM, RAG and vector database modules in the roadmap." defaultOn />
            <Toggle label="Prioritise DSA over breadth" hint="Weight interview readiness above resume breadth." defaultOn />
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Backend Connection"
            subtitle="Career Copilot talks to your existing FastAPI service. All analysis runs there."
          />
          <div className="space-y-3 p-5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-3">
              <span className="text-muted-foreground">API base URL</span>
              <code className="rounded bg-muted px-2 py-1 text-xs">{API_BASE_URL}</code>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Override with the <code className="rounded bg-muted px-1">VITE_API_BASE_URL</code>{" "}
              environment variable. Requests are sent with{" "}
              <code className="rounded bg-muted px-1">Authorization: Bearer &lt;token&gt;</code> and a
              401 response signs you out automatically.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                "POST /register",
                "POST /login",
                "POST /resumes/upload",
                "POST /resumes/{resume_id}/analyze",
                "POST /jobs/",
                "POST /jobs/{job_id}/match/{resume_id}",
                "GET /dashboard/",
              ].map((ep) => (
                <code
                  key={ep}
                  className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-[11px]"
                >
                  {ep}
                </code>
              ))}
            </div>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
