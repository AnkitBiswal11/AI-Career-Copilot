
import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { Panel, PanelHeader } from "@/components/ui-kit/primitives";
import { cn } from "@/lib/utils";
import { api } from "@/services/api";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Career Copilot" },
      {
        name: "description",
        content:
          "Configure notifications, learning preferences and backend connection.",
      },
      { property: "og:title", content: "Settings — Career Copilot" },
      {
        property: "og:description",
        content: "Preferences and platform configuration.",
      },
    ],
  }),
  component: SettingsPage,
});

const SETTINGS_KEY = "cc_settings";

export interface Settings {
  weeklyDigest: boolean;
  skillGapAlerts: boolean;
  streakReminders: boolean;
  aggressiveMode: boolean;
  includeGenAI: boolean;
  prioritizeDSA: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  weeklyDigest: true,
  skillGapAlerts: true,
  streakReminders: false,
  aggressiveMode: false,
  includeGenAI: true,
  prioritizeDSA: true,
};

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const saved = window.localStorage.getItem(SETTINGS_KEY);
    if (!saved) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(saved);

    return {
      weeklyDigest:
        typeof parsed.weeklyDigest === "boolean"
          ? parsed.weeklyDigest
          : DEFAULT_SETTINGS.weeklyDigest,
      skillGapAlerts:
        typeof parsed.skillGapAlerts === "boolean"
          ? parsed.skillGapAlerts
          : DEFAULT_SETTINGS.skillGapAlerts,
      streakReminders:
        typeof parsed.streakReminders === "boolean"
          ? parsed.streakReminders
          : DEFAULT_SETTINGS.streakReminders,
      aggressiveMode:
        typeof parsed.aggressiveMode === "boolean"
          ? parsed.aggressiveMode
          : DEFAULT_SETTINGS.aggressiveMode,
      includeGenAI:
        typeof parsed.includeGenAI === "boolean"
          ? parsed.includeGenAI
          : DEFAULT_SETTINGS.includeGenAI,
      prioritizeDSA:
        typeof parsed.prioritizeDSA === "boolean"
          ? parsed.prioritizeDSA
          : DEFAULT_SETTINGS.prioritizeDSA,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 px-5 py-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  // Load preferences from the backend when the page opens.
  useEffect(() => {
    let cancelled = false;

    async function fetchSettings() {
      setLoaded(false);
      setSaveError("");
      setSaveMessage("");

      try {
        const data = await api.getSettings();

        if (cancelled) return;

        const loadedSettings: Settings = {
          weeklyDigest: data.weeklyDigest,
          skillGapAlerts: data.skillGapAlerts,
          streakReminders: data.streakReminders,
          aggressiveMode: data.aggressiveMode,
          includeGenAI: data.includeGenAI,
          prioritizeDSA: data.prioritizeDSA,
        };

        setSettings(loadedSettings);

        try {
          saveSettings(loadedSettings);
        } catch {
          // The backend remains the source of truth.
        }

        setSaveMessage("Settings loaded from your account.");
      } catch (error) {
        if (cancelled) return;

        // If the backend is unavailable, use the browser's saved copy.
        setSettings(loadSettings());
        setSaveError(
          error instanceof Error
            ? `Could not load settings from the server: ${error.message}`
            : "Could not load settings from the server. Using browser settings.",
        );
      } finally {
        if (!cancelled) {
          setLoaded(true);
        }
      }
    }

    void fetchSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const updateSetting = (key: keyof Settings, value: boolean) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
    setSaveError("");
    setSaveMessage("");
  };

  // Save explicitly to the backend when the user clicks Save.
  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    setSaveMessage("");

    try {
      await api.updateSettings(settings);

      try {
        saveSettings(settings);
      } catch {
        // The server save succeeded even if localStorage is unavailable.
      }

      setSaveMessage("Settings saved to your account.");
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? `Unable to save settings: ${error.message}`
          : "Unable to save settings. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    setSettings({ ...DEFAULT_SETTINGS });
    setSaveError("");
    setSaveMessage("Defaults selected. Click Save to apply them.");
  };

  const apiBaseUrl =
    import.meta.env["VITE_API_BASE_URL"] || "http://localhost:8000";

  const disabled = !loaded || saving;

  return (
    <AppShell
      title="Settings"
      subtitle="Preferences, notifications and platform configuration."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader
            title="Notifications"
            subtitle="Configure your notification preferences."
          />
          <div className="divide-y divide-border">
            <Toggle
              label="Weekly readiness digest"
              hint="A Monday summary of score movement and next actions."
              checked={settings.weeklyDigest}
              onChange={(value) => updateSetting("weeklyDigest", value)}
              disabled={disabled}
            />
            <Toggle
              label="New skill gap detected"
              hint="Alert when an analysed role introduces a new required skill."
              checked={settings.skillGapAlerts}
              onChange={(value) => updateSetting("skillGapAlerts", value)}
              disabled={disabled}
            />
            <Toggle
              label="Streak reminders"
              hint="Nudge me if I'm about to break my learning streak."
              checked={settings.streakReminders}
              onChange={(value) => updateSetting("streakReminders", value)}
              disabled={disabled}
            />
          </div>
        </Panel>

        <Panel>
          <PanelHeader
            title="Learning Preferences"
            subtitle="Preferences for roadmap pacing and recommendations."
          />
          <div className="divide-y divide-border">
            <Toggle
              label="Aggressive placement mode"
              hint="Compress the roadmap into the shortest viable timeline."
              checked={settings.aggressiveMode}
              onChange={(value) => updateSetting("aggressiveMode", value)}
              disabled={disabled}
            />
            <Toggle
              label="Include GenAI track"
              hint="Keep LLM, RAG and vector database modules in the roadmap."
              checked={settings.includeGenAI}
              onChange={(value) => updateSetting("includeGenAI", value)}
              disabled={disabled}
            />
            <Toggle
              label="Prioritise DSA over breadth"
              hint="Weight interview readiness above resume breadth."
              checked={settings.prioritizeDSA}
              onChange={(value) => updateSetting("prioritizeDSA", value)}
              disabled={disabled}
            />
          </div>
        </Panel>

        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Backend Connection"
            subtitle="Connection details for your FastAPI service."
          />
          <div className="space-y-3 p-5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-4 py-3">
              <span className="text-muted-foreground">API base URL</span>
              <code className="rounded bg-muted px-2 py-1 text-xs">
                {apiBaseUrl}
              </code>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">
              Configure this using the VITE_API_BASE_URL environment variable.
              Requests use your existing authentication service.
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
                "GET /users/me/settings",
                "PUT /users/me/settings",
              ].map((endpoint) => (
                <code
                  key={endpoint}
                  className="rounded-lg border border-border bg-muted/50 px-3 py-2 text-[11px]"
                >
                  {endpoint}
                </code>
              ))}
            </div>
          </div>
        </Panel>

        <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-2">
          <div className="text-xs" role="status" aria-live="polite">
            {!loaded ? (
              <span className="text-muted-foreground">
                Loading settings...
              </span>
            ) : saveError ? (
              <span className="text-destructive">{saveError}</span>
            ) : (
              <span className="text-muted-foreground">
                {saveMessage || "Changes are not saved yet."}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetSettings}
              disabled={disabled}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset to defaults
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={disabled}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}