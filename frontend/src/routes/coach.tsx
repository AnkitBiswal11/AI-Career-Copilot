import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { CoachConversation } from "@/components/coach/CoachPanel";
import { AiInsight, Panel, PanelHeader } from "@/components/ui-kit/primitives";

export const Route = createFileRoute("/coach")({
  head: () => ({
    meta: [
      { title: "AI Career Coach — Career Copilot" },
      {
        name: "description",
        content:
          "Ask Career Copilot what to do next — resume fixes, learning order, interview prep and job strategy.",
      },
      { property: "og:title", content: "AI Career Coach — Career Copilot" },
      {
        property: "og:description",
        content: "A career coach that already knows your resume, gaps and target roles.",
      },
    ],
  }),
  component: CoachPage,
});

function CoachPage() {
  return (
    <AppShell title="AI Career Coach" subtitle="Grounded in your resume, skill gaps and analysed roles.">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel className="flex h-[620px] flex-col overflow-hidden">
          <PanelHeader title="Conversation" subtitle="Context: resume 86 · readiness 78 · 11 roles analysed" />
          <CoachConversation />
        </Panel>

        <div className="space-y-4">
          <AiInsight>
            The coach reads your live analysis — resume score, skill gaps, job matches and interview
            history — so answers are specific to your profile, not generic advice.
          </AiInsight>
          <Panel className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              What it can help with
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {[
                "Rewriting resume bullets with measurable impact",
                "Choosing what to learn next and in what order",
                "Explaining why a job match score is low",
                "Building day-by-day study plans",
                "Rehearsing role-specific interview answers",
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
