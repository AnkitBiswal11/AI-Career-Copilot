import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card shadow-elevate",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
      <div>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function AiInsight({
  label = "AI Insight",
  children,
  tone = "primary",
  className,
}: {
  label?: string;
  children: ReactNode;
  tone?: "primary" | "warning" | "success";
  className?: string;
}) {
  const tones = {
    primary: "border-primary/20 bg-primary-soft/60 text-primary",
    warning: "border-warning/30 bg-warning/10 text-warning-foreground",
    success: "border-success/25 bg-success/10 text-success",
  } as const;

  return (
    <div className={cn("rounded-lg border p-4", tones[tone], className)}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]">
        <Sparkles className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/85">{children}</p>
    </div>
  );
}

export function Delta({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const positive = value >= 0;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular",
        positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
      )}
    >
      <Icon className="h-3 w-3" />
      {positive ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

export function Sparkline({ data, color = "var(--primary)" }: { data: number[]; color?: string }) {
  const id = `spark-${color.replace(/[^a-z]/gi, "")}`;
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data.map((value, i) => ({ i, value }))}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${id})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  suffix,
  delta,
  note,
  spark,
  color = "var(--primary)",
}: {
  label: string;
  value: number;
  suffix?: string;
  delta?: number;
  note?: string;
  spark: number[];
  color?: string;
}) {
  const animated = useCountUp(value);
  return (
    <Panel className="overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </p>
        {delta !== undefined && <Delta value={delta} />}
      </div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-[34px] font-semibold leading-none tracking-tight tabular">
          {animated}
        </span>
        {suffix && <span className="text-sm font-medium text-muted-foreground">{suffix}</span>}
      </div>
      <div className="mt-3">
        <Sparkline data={spark} color={color} />
      </div>
      {note && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note}</p>}
    </Panel>
  );
}

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}

export function ProgressRing({
  value,
  size = 200,
  stroke = 14,
  label,
  caption,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  caption?: string;
}) {
  const animated = useCountUp(value, 1200);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (animated / 100) * c;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <defs>
            <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="var(--primary)" />
              <stop offset="100%" stopColor="var(--brand-blue)" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--muted)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[44px] font-semibold leading-none tracking-tight tabular">
            {animated}
          </span>
          {label && (
            <span className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</span>
          )}
        </div>
      </div>
      {caption && <p className="mt-3 text-xs font-medium text-success">{caption}</p>}
    </div>
  );
}

export function ScoreBar({
  label,
  current,
  target,
}: {
  label: string;
  current: number;
  target?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="tabular text-muted-foreground">
          <span className="font-semibold text-foreground">{current}%</span>
          {target !== undefined && <> · target {target}%</>}
        </span>
      </div>
      <div className="relative mt-2 h-2 rounded-full bg-muted">
        {target !== undefined && (
          <div
            className="absolute top-0 h-2 rounded-full bg-primary/15"
            style={{ width: `${target}%` }}
          />
        )}
        <div
          className="absolute top-0 h-2 rounded-full bg-brand-gradient transition-[width] duration-1000 ease-out"
          style={{ width: `${current}%` }}
        />
      </div>
    </div>
  );
}

export function PriorityTag({ priority }: { priority: "HIGH" | "MEDIUM" | "LOW" }) {
  const map = {
    HIGH: "bg-destructive/10 text-destructive",
    MEDIUM: "bg-warning/15 text-warning-foreground",
    LOW: "bg-success/10 text-success",
  } as const;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]",
        map[priority],
      )}
    >
      {priority}
    </span>
  );
}

export function ScorePill({ score }: { score: number }) {
  const tone =
    score >= 90
      ? "bg-success/10 text-success"
      : score >= 80
        ? "bg-primary/10 text-primary"
        : score >= 72
          ? "bg-brand-blue/10 text-brand-blue"
          : "bg-warning/15 text-warning-foreground";
  return (
    <span className={cn("rounded-md px-2 py-1 text-xs font-semibold tabular", tone)}>
      {score}%
    </span>
  );
}
