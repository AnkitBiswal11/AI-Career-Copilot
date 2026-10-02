import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Loader2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Panel, PanelHeader } from "@/components/ui-kit/primitives";
import { inputClass } from "@/components/auth/AuthLayout";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Career Copilot" },
      {
        name: "description",
        content:
          "Manage your target role, experience level, college and preferences so career analysis stays accurate.",
      },
      { property: "og:title", content: "Profile — Career Copilot" },
      {
        property: "og:description",
        content: "Your career profile and targeting preferences.",
      },
    ],
  }),
  component: ProfilePage,
});

const TARGET_ROLES = [
  "Software Engineer",
  "Backend Developer",
  "Python Developer",
  "AI Engineer",
  "Data Analyst",
  "ML Engineer",
];

const LEVELS = [
  "Student / Fresher",
  "0–1 years",
  "1–3 years",
  "3+ years",
];

function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: user?.full_name ?? "",
    email: user?.email ?? "",
    target_role: user?.target_role ?? "Backend Developer",
    experience_level:
      user?.experience_level ?? "Student / Fresher",
    preferred_location: user?.preferred_location ?? "",
    college: user?.college ?? "",
    graduation_year: user?.graduation_year ?? "",
  });

  // Keep the form synchronized with the authenticated user.
  useEffect(() => {
    setForm({
      full_name: user?.full_name ?? "",
      email: user?.email ?? "",
      target_role: user?.target_role ?? "Backend Developer",
      experience_level:
        user?.experience_level ?? "Student / Fresher",
      preferred_location: user?.preferred_location ?? "",
      college: user?.college ?? "",
      graduation_year: user?.graduation_year ?? "",
    });
  }, [user]);

  const set =
    (key: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement
      >,
    ) => {
      setForm((previous) => ({
        ...previous,
        [key]: e.target.value,
      }));

      setSaved(false);
      setError("");
    };

  const initials = (form.full_name || "CC")
    .trim()
    .split(/\s+/)
    .map((part: string) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();

    setSaving(true);
    setSaved(false);
    setError("");

    try {
      await updateUser({
        full_name: form.full_name.trim(),
        target_role: form.target_role,
        experience_level: form.experience_level,
        preferred_location:
          form.preferred_location.trim(),
        college: form.college.trim(),
        graduation_year: form.graduation_year.trim(),
      });

      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Profile & Settings"
      subtitle="Keep your targeting accurate — analysis depends on it."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Panel>
          <PanelHeader
            title="Career Profile"
            subtitle="Used to weight job matching and roadmap generation."
          />

          <form
            onSubmit={handleSubmit}
            className="space-y-4 p-5"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Full name */}
              <label className="block">
                <span className="text-xs font-medium">
                  Full name
                </span>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={set("full_name")}
                  className={`${inputClass} mt-1.5`}
                  placeholder="Your full name"
                  required
                />
              </label>

              {/* Email */}
              <label className="block">
                <span className="text-xs font-medium">
                  Email
                </span>
                <input
                  type="email"
                  value={form.email}
                  className={`${inputClass} mt-1.5 cursor-not-allowed opacity-70`}
                  readOnly
                />
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  Email cannot be changed here.
                </span>
              </label>

              {/* Target role */}
              <label className="block">
                <span className="text-xs font-medium">
                  Target role
                </span>
                <select
                  value={form.target_role}
                  onChange={set("target_role")}
                  className={`${inputClass} mt-1.5`}
                >
                  {TARGET_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </label>

              {/* Experience level */}
              <label className="block">
                <span className="text-xs font-medium">
                  Experience level
                </span>
                <select
                  value={form.experience_level}
                  onChange={set("experience_level")}
                  className={`${inputClass} mt-1.5`}
                >
                  {LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>

              {/* Preferred location */}
              <label className="block">
                <span className="text-xs font-medium">
                  Preferred location
                </span>
                <input
                  type="text"
                  value={form.preferred_location}
                  onChange={set("preferred_location")}
                  placeholder="Bengaluru, India"
                  className={`${inputClass} mt-1.5`}
                />
              </label>

              {/* College */}
              <label className="block">
                <span className="text-xs font-medium">
                  College
                </span>
                <input
                  type="text"
                  value={form.college}
                  onChange={set("college")}
                  className={`${inputClass} mt-1.5`}
                  placeholder="Your college"
                />
              </label>

              {/* Graduation year */}
              <label className="block">
                <span className="text-xs font-medium">
                  Graduation year
                </span>
                <input
                  type="text"
                  value={form.graduation_year}
                  onChange={set("graduation_year")}
                  placeholder="2026"
                  className={`${inputClass} mt-1.5`}
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  title="Enter a four-digit graduation year"
                />
              </label>
            </div>

            {/* Error message */}
            {error && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </div>
            )}

            {/* Save button and success message */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevate hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </button>

              {saved && (
                <span
                  role="status"
                  className="flex items-center gap-1.5 text-xs font-semibold text-success"
                >
                  <Check className="h-4 w-4" />
                  Profile updated
                </span>
              )}
            </div>
          </form>
        </Panel>

        {/* Profile preview and account details */}
        <div className="space-y-4">
          <Panel className="flex flex-col items-center p-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-gradient text-lg font-semibold text-primary-foreground">
              {initials}
            </span>

            <p className="mt-3 text-sm font-semibold">
              {form.full_name || "Your name"}
            </p>

            <p className="text-xs text-muted-foreground">
              {form.email}
            </p>

            <p className="mt-3 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold text-primary">
              {form.target_role}
            </p>
          </Panel>

          <Panel className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Account
            </p>

            <div className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Plan
                </span>
                <span className="font-medium">
                  Student
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Graduation year
                </span>
                <span className="font-medium tabular">
                  {form.graduation_year || "Not set"}
                </span>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  Experience
                </span>
                <span className="text-right font-medium">
                  {form.experience_level || "Not set"}
                </span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}