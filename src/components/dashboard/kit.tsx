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
          <p className="font-mono text-xs uppercase tracking-widest text-accent mb-3">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">
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
  const toneMap = {
    default: "from-white/5",
    primary: "from-primary/15",
    accent: "from-accent/15",
    frost: "from-frost/15",
  };
  return (
    <div className={`glass rounded-2xl p-6 bg-gradient-to-br ${toneMap[tone]} to-transparent`}>
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        {emoji && <span className="text-xl opacity-80">{emoji}</span>}
      </div>
      <div className="mt-3 font-display text-3xl font-semibold tracking-tight">{value}</div>
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
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function StateBadge({ state }: { state: "awake" | "light" | "deep" | "frozen" }) {
  const map = {
    awake: { emoji: "☀️", label: "Awake", cls: "bg-green-500/10 text-green-300 border-green-500/30" },
    light: { emoji: "💠", label: "Light", cls: "bg-frost/10 text-frost border-frost/30" },
    deep: { emoji: "🌙", label: "Deep", cls: "bg-primary/10 text-primary border-primary/30" },
    frozen: { emoji: "❄️", label: "Frozen", cls: "bg-accent/10 text-accent border-accent/30" },
  } as const;
  const s = map[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-mono ${s.cls}`}>
      <span>{s.emoji}</span> {s.label}
    </span>
  );
}
