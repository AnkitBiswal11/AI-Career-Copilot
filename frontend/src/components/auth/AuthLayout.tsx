import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_46%]">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm animate-rise">
          <Logo />
          <h1 className="mt-10 text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>

      <aside className="relative hidden overflow-hidden border-l border-border bg-primary-soft/40 lg:block">
        <div className="absolute inset-0 surface-grid opacity-70" />
        <div className="relative flex h-full flex-col justify-center gap-8 px-14">
          <blockquote className="text-2xl font-semibold leading-snug tracking-tight">
            &ldquo;Turn your resume into a{" "}
            <span className="text-gradient-brand">career strategy</span>.&rdquo;
          </blockquote>
          <div className="grid gap-3">
            {[
              { k: "Career Readiness", v: "78 / 100" },
              { k: "Resume Score", v: "86%" },
              { k: "Average Job Match", v: "82%" },
              { k: "Skill Gaps Detected", v: "6 skills" },
            ].map((row) => (
              <div
                key={row.k}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-elevate"
              >
                <span className="text-sm text-muted-foreground">{row.k}</span>
                <span className="text-sm font-semibold tabular">{row.v}</span>
              </div>
            ))}
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Career Copilot analyses your resume, matches real job descriptions and builds the exact
            learning plan that closes your gaps.
          </p>
        </div>
      </aside>
    </div>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-foreground">{label}</span>
      <div className="mt-1.5">{children}</div>
      {error && <span className="mt-1.5 block text-xs font-medium text-destructive">{error}</span>}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15";
