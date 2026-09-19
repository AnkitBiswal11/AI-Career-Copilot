import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { AuthLayout, Field, inputClass } from "@/components/auth/AuthLayout";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Career Copilot" },
      {
        name: "description",
        content:
          "Sign in to Career Copilot to review your resume score, job matches and personalised career roadmap.",
      },
      { property: "og:title", content: "Sign in — Career Copilot" },
      {
        property: "og:description",
        content: "Access your AI career readiness dashboard.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if (password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Unable to sign in." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue your career analysis."
      footer={
        <>
          New to Career Copilot?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {errors.form && (
          <p className="rounded-lg border border-destructive/25 bg-destructive/8 px-3 py-2 text-xs font-medium text-destructive">
            {errors.form}
          </p>
        )}
        <Field label="Email" {...(errors.email ? { error: errors.email } : {})}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@college.edu"
            className={inputClass}
          />
        </Field>
        <Field label="Password" {...(errors.password ? { error: errors.password } : {})}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={inputClass}
          />
        </Field>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevate transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Sign in
        </button>
      </form>
    </AuthLayout>
  );
}
