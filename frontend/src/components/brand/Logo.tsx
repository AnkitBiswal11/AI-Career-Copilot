import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-[10px] bg-brand-gradient shadow-elevate",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[62%] w-[62%]" aria-hidden="true">
        <path
          d="M12 3.2 19.4 19 12 15.4 4.6 19 12 3.2Z"
          fill="currentColor"
          className="text-primary-foreground"
        />
        <circle cx="12" cy="12.4" r="2.1" className="fill-primary" />
      </svg>
    </span>
  );
}

export function Logo({
  className,
  collapsed = false,
}: {
  className?: string;
  collapsed?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark className="h-8 w-8 shrink-0" />
      {!collapsed && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight">Career Copilot</span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Career Intelligence
          </span>
        </span>
      )}
    </span>
  );
}
