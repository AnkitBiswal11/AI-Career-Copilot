import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AuthLayout, Field, inputClass } from "@/components/auth/AuthLayout";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create your account — Career Copilot" },
      {
        name: "description",
        content:
          "Create a Career Copilot account to analyse your resume, match jobs and build a placement-ready roadmap.",
      },
      { property: "og:title", content: "Create your account — Career Copilot" },
      {
        property: "og:description",
        content: "Start your AI-powered path from student to job-ready.",
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next["name"] = "Enter your full name.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next["email"] = "Enter a valid email address.";
    if (form.password.length < 8) next["password"] = "Use at least 8 characters.";
    if (form.password !== form.confirm) next["confirm"] = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate({ to: "/dashboard" });
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Unable to register." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Your AI-powered path from student to job-ready."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {errors["form"] && (
          <p className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2 text-xs font-medium text-destructive">
            {errors["form"]}
          </p>
        )}
        <Field label="Full name" {...(errors["name"] ? { error: errors["name"] } : {})}>
          <input value={form.name} onChange={set("name")} placeholder="Ankit Biswal" className={inputClass} />
        </Field>
        <Field label="Email" {...(errors["email"] ? { error: errors["email"] } : {})}>
          <input
            type="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@college.edu"
            className={inputClass}
          />
        </Field>
        <Field label="Password" {...(errors["password"] ? { error: errors["password"] } : {})}>
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
            placeholder="At least 8 characters"
            className={inputClass}
          />
        </Field>
        <Field label="Confirm password" {...(errors["confirm"] ? { error: errors["confirm"] } : {})}>
          <input
            type="password"
            value={form.confirm}
            onChange={set("confirm")}
            placeholder="Repeat your password"
            className={inputClass}
          />
        </Field>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevate transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </button>
      </form>
    </AuthLayout>
  );
}
