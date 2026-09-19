import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { AuthLayout, Field, inputClass } from "@/components/auth/AuthLayout";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Career Copilot" },
      {
        name: "description",
        content: "Request a secure password reset link for your Career Copilot account.",
      },
      { property: "og:title", content: "Reset your password — Career Copilot" },
      { property: "og:description", content: "Recover access to your career dashboard." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a secure link to set a new password."
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-success/25 bg-success/8 p-4">
          <MailCheck className="h-5 w-5 text-success" />
          <p className="mt-2 text-sm font-medium">Check your inbox</p>
          <p className="mt-1 text-xs text-muted-foreground">
            If an account exists for {email}, a reset link is on its way.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^\S+@\S+\.\S+$/.test(email)) {
              setError("Enter a valid email address.");
              return;
            }
            setError("");
            setSent(true);
          }}
          className="space-y-4"
        >
          <Field label="Email" {...(error ? { error } : {})}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@college.edu"
              className={inputClass}
            />
          </Field>
          <button
            type="submit"
            className="w-full rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-elevate transition-opacity hover:opacity-95"
          >
            Send reset link
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
