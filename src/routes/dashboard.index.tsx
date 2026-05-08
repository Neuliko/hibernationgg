import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, Panel, StateBadge } from "@/components/dashboard/kit";
import { demoStats, demoTargets, demoEvents } from "@/lib/demo-data";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="/ overview"
        title="Server status"
        subtitle="Live system telemetry from the Hibernation engine."
        actions={
          <div className="glass rounded-full px-4 py-2 text-xs font-mono flex items-center gap-2">
            <span className="size-2 rounded-full bg-green-400 animate-pulse-glow" />
            {demoStats.serverStatus}
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Hibernating" value={demoStats.hibernating} hint="across all targets" emoji="🌙" tone="primary" />
        <StatCard label="Awake" value={demoStats.awake} hint="active in last 5m" emoji="☀️" tone="accent" />
        <StatCard label="Members asleep" value={demoStats.membersAsleep} emoji="💤" />
        <StatCard label="Energy savings" value={`${demoStats.energySavings}%`} hint="quieter notifications" emoji="⚡" tone="frost" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Panel title="🌙 Currently hibernating">
            <div className="space-y-2">
              {demoTargets.filter(t => t.state !== "awake").map((t) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between rounded-xl bg-white/[0.02] hover:bg-white/[0.05] transition px-4 py-3 border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-12">
                      {t.kind === "channel" ? "channel" : "user"}
                    </span>
                    <span className="font-display font-medium">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDistanceToNow(t.since, { addSuffix: true })}
                    </span>
                    <StateBadge state={t.state} />
                  </div>
                </motion.div>
              ))}
            </div>
          </Panel>
        </div>

        <Panel title="⚡ Activity feed">
          <div className="space-y-3">
            {demoEvents.slice(0, 6).map((e) => (
              <div key={e.id} className="text-sm border-l-2 border-primary/40 pl-3">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {formatDistanceToNow(e.time, { addSuffix: true })}
                </div>
                <div className="mt-0.5">
                  {e.type === "wake" && "☀️"} {e.type === "hibernate" && "🌙"}{" "}
                  {e.type === "state_change" && "💠"} {e.type === "nickname_change" && "✏️"}{" "}
                  <span className="font-medium">{e.target}</span>{" "}
                  <span className="text-muted-foreground">· {e.trigger}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
