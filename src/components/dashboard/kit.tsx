import { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 mb-10 flex-wrap">
      <div>
        {eyebrow && (
          <p className="font-mono text-xs uppercase tracking-widest text-brand mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        {subtitle && <p className="text-muted-foreground mt-2 max-w-xl">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  emoji,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  emoji?: string;
  tone?: "default" | "primary" | "accent" | "frost";
}) {
  const accentBar: Record<string, string> = {
    default: "bg-muted",
    primary: "bg-brand",
    accent: "bg-[oklch(0.7_0.16_240)]",
    frost: "bg-[oklch(0.78_0.12_220)]",
  };
  return (
    <div className="surface rounded-2xl p-6 relative overflow-hidden">
      <div className={`absolute left-0 top-0 h-full w-1 ${accentBar[tone]}`} />
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {emoji && <span className="text-xl opacity-80">{emoji}</span>}
      </div>
      <div className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">{value}</div>
      {hint && <p className="text-xs text-muted-foreground mt-2">{hint}</p>}
    </div>
  );
}

export function Panel({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="surface rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-semibold text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function StateBadge({ state }: { state: "awake" | "light" | "deep" | "frozen" }) {
  const map = {
    awake: { emoji: "☀️", label: "Awake", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    light: { emoji: "💠", label: "Light", cls: "bg-sky-50 text-sky-700 border-sky-200" },
    deep: { emoji: "🌙", label: "Deep", cls: "bg-brand/10 text-brand border-brand/20" },
    frozen: { emoji: "❄️", label: "Frozen", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  } as const;
  const s = map[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-mono ${s.cls}`}>
      <span>{s.emoji}</span> {s.label}
    </span>
  );
}
