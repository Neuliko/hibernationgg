import { createFileRoute } from "@tanstack/react-router";
import { Link, Outlet, useLocation } from "@tanstack/react-router";
import { RequireAuth } from "@/components/RequireAuth";
import { HibernationLogo } from "@/components/HibernationLogo";
import { isClerkConfigured } from "@/lib/auth-provider";
import { UserButton } from "@clerk/clerk-react";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  return (
    <RequireAuth>
      <DashboardShell />
    </RequireAuth>
  );
}

function DashboardShell() {
  const location = useLocation();

  const nav = [
    { to: "/dashboard", label: "Overview", emoji: "🌙", exact: true },
    { to: "/dashboard/analytics", label: "Analytics", emoji: "📊" },
    { to: "/dashboard/control", label: "Control", emoji: "⚡" },
    { to: "/dashboard/logs", label: "Logs", emoji: "📜" },
    { to: "/dashboard/linking", label: "Discord Link", emoji: "🔗" },
  ];

  return (
    <div className="min-h-screen flex bg-secondary/40">
      <aside className="w-64 shrink-0 border-r border-border bg-card p-5 hidden md:flex flex-col">
        <Link to="/" className="flex items-center gap-2.5 mb-10">
          <HibernationLogo size={28} />
          <span className="font-display font-semibold tracking-tight text-ink">
            Hibernation <span className="text-brand">Portal</span>
          </span>
        </Link>
        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const active = item.exact
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  active
                    ? "bg-brand/10 text-brand border border-brand/20 font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <span className="text-base">{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 pt-6 border-t border-border flex items-center gap-3">
          {isClerkConfigured ? <UserButton afterSignOutUrl="/" /> : <div className="size-8 rounded-full bg-secondary" />}
          <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse-dot" /> online
          </div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
