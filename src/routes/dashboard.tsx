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
    <div className="min-h-screen flex">
      <aside className="w-64 shrink-0 border-r border-border/40 glass-strong p-5 hidden md:flex flex-col">
        <Link to="/" className="flex items-center gap-2.5 mb-10">
          <HibernationLogo size={26} />
          <span className="font-display font-semibold tracking-tight">
            Hibernation<span className="text-gradient">OS</span>
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
                    ? "bg-gradient-to-r from-primary/20 to-accent/10 text-foreground border border-primary/30 shadow-neon"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <span className="text-base">{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 pt-6 border-t border-border/40 flex items-center gap-3">
          {isClerkConfigured ? <UserButton afterSignOutUrl="/" /> : <div className="size-8 rounded-full bg-secondary" />}
          <div className="text-xs text-muted-foreground font-mono">● online</div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
