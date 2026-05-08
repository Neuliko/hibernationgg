import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, StateBadge } from "@/components/dashboard/kit";
import { demoEvents } from "@/lib/demo-data";
import { format } from "date-fns";

export const Route = createFileRoute("/dashboard/logs")({
  component: Logs,
});

function Logs() {
  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="/ logs"
        title="System audit trail"
        subtitle="Every hibernation, wake, nickname change, and config edit."
      />
      <Panel title="📜 Event history">
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-border/40">
                <th className="pb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">When</th>
                <th className="pb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Type</th>
                <th className="pb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Target</th>
                <th className="pb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Transition</th>
                <th className="pb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Trigger</th>
              </tr>
            </thead>
            <tbody>
              {demoEvents.map((e) => (
                <tr key={e.id} className="border-b border-border/20 hover:bg-white/[0.03]">
                  <td className="py-3 font-mono text-xs text-muted-foreground">
                    {format(e.time, "MMM d, HH:mm:ss")}
                  </td>
                  <td className="py-3">
                    <span className="font-mono text-xs uppercase">
                      {e.type === "wake" && "☀️ wake"}
                      {e.type === "hibernate" && "🌙 hibernate"}
                      {e.type === "state_change" && "💠 transition"}
                      {e.type === "nickname_change" && "✏️ nickname"}
                    </span>
                  </td>
                  <td className="py-3 font-medium">{e.target}</td>
                  <td className="py-3">
                    {e.from && e.to ? (
                      <div className="flex items-center gap-2">
                        <StateBadge state={e.from as "awake"} />
                        <span className="text-muted-foreground">→</span>
                        <StateBadge state={e.to as "awake"} />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-3 text-muted-foreground text-xs">{e.trigger}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}
