import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  BookOpen,
  Briefcase,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessagesSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  Target,
  User as UserIcon,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { Logo, LogoMark } from "@/components/brand/Logo";
import { CoachDock } from "@/components/coach/CoachPanel";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/resume", label: "Resume", icon: FileText },
  { to: "/job-match", label: "Job Match", icon: Briefcase },
  { to: "/skill-gap", label: "Skill Gap", icon: Target },
  { to: "/roadmap", label: "Career Roadmap", icon: Map },
  { to: "/interview", label: "Interview Prep", icon: MessagesSquare },
  { to: "/learning", label: "Learning", icon: BookOpen },
  { to: "/coach", label: "AI Coach", icon: Sparkles },
] as const;

const BOTTOM_NAV = [
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

function NavItem({
  to,
  label,
  icon: Icon,
  collapsed,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof Search;
  collapsed: boolean;
  onClick?: (() => void) | undefined;
}) {

  return (
    <Link
      to={to}
      onClick={onClick}
      activeProps={{
        className:
          "bg-primary-soft text-primary font-semibold before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] before:-translate-y-1/2 before:rounded-r-full before:bg-primary",
      }}
      className={cn(
        "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-0",
      )}
      title={collapsed ? label : undefined}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
}

function SidebarBody({
  collapsed,
  onNavigate,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Career
          </p>
        )}
        {NAV.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} onClick={onNavigate} />
        ))}
      </nav>
      <div className="space-y-1 border-t border-sidebar-border px-3 py-3">
        {BOTTOM_NAV.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} onClick={onNavigate} />
        ))}
      </div>
    </>
  );
}

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, ready, isAuthenticated } = useAuth();
  useRequireAuth();
  const navigate = useNavigate();

  if (!ready || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LogoMark className="h-10 w-10 animate-pulse" />
      </div>
    );
  }

  const initials = (user?.full_name ?? "CC")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex",
          collapsed ? "w-[72px]" : "w-[248px]",
        )}
      >
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-4",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          <Logo collapsed={collapsed} />
          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
        <SidebarBody collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[264px] flex-col border-r border-sidebar-border bg-sidebar">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SidebarBody collapsed={false} onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className={cn("transition-[padding] duration-200", collapsed ? "lg:pl-[72px]" : "lg:pl-[248px]")}>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 md:flex">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Search skills, jobs, questions…"
              className="w-52 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
          <button
            className="relative rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Notifications"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
          </button>
          <button
            onClick={() => {
              logout();
              navigate({ to: "/login" });
            }}
            className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Sign out"
          >
            <LogOut className="h-[18px] w-[18px]" />
          </button>
          <Link
            to="/profile"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-gradient text-[11px] font-semibold text-primary-foreground"
          >
            {initials}
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-6 sm:px-6">{children}</main>
      </div>

      <CoachDock />
    </div>
  );
}
