import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard, Panel, StateBadge } from "@/components/dashboard/kit";
import { demoStats } from "@/lib/demo-data";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

type Target = {
  id: string;
  kind: "channel" | "user";
  display_name: string | null;
  state: "awake" | "light" | "deep" | "frozen";
  last_active_at: string;
  hibernation_started_at: string | null;
};

type Event = {
  id: string;
  type: string;
  trigger: string | null;
  to_state: string | null;
  created_at: string;
  target_id: string | null;
};

function Overview() {
  const [targets, setTargets] = useState<Target[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [{ data: t }, { data: e }] = await Promise.all([
        supabase.from("hibernation_targets").select("*").order("last_active_at", { ascending: false }).limit(50),
        supabase.from("hibernation_events").select("*").order("created_at", { ascending: false }).limit(20),
      ]);
      if (!mounted) return;
      setTargets((t || []) as Target[]);
      setEvents((e || []) as Event[]);
    })();

    const channel = supabase
      .channel("portal-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "hibernation_targets" }, (payload) => {
        setTargets((prev) => {
          const row = payload.new as Target;
          if (payload.eventType === "DELETE") return prev.filter((x) => x.id !== (payload.old as any).id);
          const next = prev.filter((x) => x.id !== row.id);
          return [row, ...next].slice(0, 50);
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "hibernation_events" }, (payload) => {
        setEvents((prev) => [payload.new as Event, ...prev].slice(0, 20));
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  const counts = targets.reduce(
    (acc, t) => {
      acc[t.state] = (acc[t.state] || 0) + 1;
      return acc;
    },
    { awake: 0, light: 0, deep: 0, frozen: 0 } as Record<string, number>
  );
  const sleeping = counts.light + counts.deep + counts.frozen;
  const hasData = targets.length > 0;

  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="/ overview"
        title="Server status"
        subtitle="Live system telemetry from the Hibernation engine."
        actions={
          <div className="surface rounded-full px-4 py-2 text-xs font-mono flex items-center gap-2">
            <span className={`size-2 rounded-full ${live ? "bg-emerald-500 animate-pulse-dot" : "bg-muted-foreground/40"}`} />
            {live ? "live · realtime" : "connecting…"}
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Hibernating" value={hasData ? sleeping : demoStats.hibernating} hint="across all targets" emoji="🌙" tone="primary" />
        <StatCard label="Awake" value={hasData ? counts.awake : demoStats.awake} hint="active recently" emoji="☀️" tone="accent" />
        <StatCard label="Members asleep" value={hasData ? targets.filter((t) => t.kind === "user" && t.state !== "awake").length : demoStats.membersAsleep} emoji="💤" />
        <StatCard label="Channels asleep" value={hasData ? targets.filter((t) => t.kind === "channel" && t.state !== "awake").length : 0} emoji="📺" tone="frost" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Panel title="🌙 Currently hibernating">
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {targets
                  .filter((t) => t.state !== "awake")
                  .slice(0, 12)
                  .map((t) => (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="flex items-center justify-between rounded-xl bg-secondary/40 hover:bg-secondary transition px-4 py-3 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-muted-foreground w-12">{t.kind}</span>
                        <span className="font-display font-medium">{t.display_name || "—"}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground font-mono">
                          {formatDistanceToNow(new Date(t.hibernation_started_at || t.last_active_at), { addSuffix: true })}
                        </span>
                        <StateBadge state={t.state} />
                      </div>
                    </motion.div>
                  ))}
              </AnimatePresence>
              {hasData && targets.filter((t) => t.state !== "awake").length === 0 && (
                <div className="text-center py-10 text-sm text-muted-foreground">Everyone is awake ☀️</div>
              )}
              {!hasData && (
                <div className="text-center py-10 text-sm text-muted-foreground">
                  Waiting for the bot to report activity…
                </div>
              )}
            </div>
          </Panel>
        </div>

        <Panel title="⚡ Activity feed">
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {events.slice(0, 8).map((e) => (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm border-l-2 border-brand/40 pl-3"
                >
                  <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {formatDistanceToNow(new Date(e.created_at), { addSuffix: true })}
                  </div>
                  <div className="mt-0.5">
                    {e.type === "wake" && "☀️"} {e.type === "hibernate" && "🌙"} {e.type === "state_change" && "💠"}{" "}
                    <span className="font-medium">{e.to_state || e.type}</span>{" "}
                    <span className="text-muted-foreground">· {e.trigger || "—"}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {events.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">No events yet.</div>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
