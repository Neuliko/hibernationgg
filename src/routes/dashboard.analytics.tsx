import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, StatCard } from "@/components/dashboard/kit";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid,
  BarChart, Bar,
} from "recharts";
import { demoActivity, demoSleepDuration, demoLeaderboard } from "@/lib/demo-data";

export const Route = createFileRoute("/dashboard/analytics")({
  component: Analytics,
});

function Analytics() {
  return (
    <div className="p-6 md:p-10">
      <PageHeader
        eyebrow="/ analytics"
        title="Inactivity intelligence"
        subtitle="Sleep streaks, energy trends, and member leaderboards."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total sleep this week" value="143h" emoji="😴" tone="primary" />
        <StatCard label="Avg session" value="4h 12m" emoji="⏳" />
        <StatCard label="Wake events" value="218" emoji="☀️" tone="accent" />
        <StatCard label="Longest streak" value="142h" hint="@solace" emoji="🥇" tone="frost" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2">
          <Panel title="📊 Activity vs sleep — last 24h">
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={demoActivity}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.78 0.18 220)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.78 0.18 220)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.72 0.21 295)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="oklch(0.72 0.21 295)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
                  <XAxis dataKey="hour" stroke="oklch(0.68 0.025 270)" fontSize={10} />
                  <YAxis stroke="oklch(0.68 0.025 270)" fontSize={10} />
                  <Tooltip
                    contentStyle={{
                      background: "oklch(0.16 0.03 280)",
                      border: "1px solid oklch(1 0 0 / 0.1)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="active" stroke="oklch(0.78 0.18 220)" fill="url(#g1)" strokeWidth={2} />
                  <Area type="monotone" dataKey="sleeping" stroke="oklch(0.72 0.21 295)" fill="url(#g2)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
        <Panel title="🏆 Sleep leaderboard">
          <ol className="space-y-3">
            {demoLeaderboard.map((u, i) => (
              <li key={u.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{u.emoji}</span>
                  <span className="font-medium">{u.name}</span>
                </div>
                <span className="font-mono text-sm text-muted-foreground">{u.hours}h</span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Panel title="💤 Sleep duration — last 7 days">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={demoSleepDuration}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.05)" />
              <XAxis dataKey="day" stroke="oklch(0.68 0.025 270)" fontSize={11} />
              <YAxis stroke="oklch(0.68 0.025 270)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.16 0.03 280)",
                  border: "1px solid oklch(1 0 0 / 0.1)",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="hours" fill="oklch(0.72 0.21 295)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
