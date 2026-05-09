import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/dashboard/kit";
import { useState } from "react";

export const Route = createFileRoute("/dashboard/control")({
  component: Control,
});

function Control() {
  const [hibEnabled, setHibEnabled] = useState(true);
  const [nicknames, setNicknames] = useState(true);
  const [light, setLight] = useState(180);    // 3h
  const [deep, setDeep] = useState(1440);     // 1 day
  const [frozen, setFrozen] = useState(10080); // 1 week

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <PageHeader
        eyebrow="/ control"
        title="System configuration"
        subtitle="Tune the inactivity OS. Changes sync to the bot in real time."
      />

      <div className="space-y-4">
        <Panel title="⚡ Engine">
          <div className="space-y-4">
            <Toggle label="Hibernation system" desc="Master switch for the entire OS." value={hibEnabled} onChange={setHibEnabled} />
            <Toggle label="Nickname automation" desc="Add 💤 🌙 ❄️ to inactive members and restore on wake." value={nicknames} onChange={setNicknames} />
          </div>
        </Panel>

        <Panel title="⏳ Sleep state thresholds">
          <div className="space-y-5">
            <Slider emoji="💠" label="Light Sleep (default 3 h)" value={light} onChange={setLight} min={15} max={720} unit="min" />
            <Slider emoji="🌙" label="Sleeping (default 1 day)" value={deep} onChange={setDeep} min={60} max={4320} unit="min" />
            <Slider emoji="❄️" label="Hibernating (default 1 week)" value={frozen} onChange={setFrozen} min={1440} max={20160} unit="min" />
          </div>
        </Panel>

        <Panel title="🛡️ Bot tokens">
          <p className="text-sm text-muted-foreground mb-4">
            The Discord bot uses a token to authenticate to this dashboard's API. Generate a new token after installing the bot.
          </p>
          <div className="flex items-center gap-3">
            <code className="flex-1 rounded-lg bg-secondary px-4 py-2.5 font-mono text-xs text-muted-foreground">
              hib_••••••••••••••••••••••
            </code>
            <button className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-brand">
              Generate
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Toggle({
  label, desc, value, onChange,
}: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-7 w-12 rounded-full transition shrink-0 ${value ? "bg-primary shadow-brand" : "bg-secondary"}`}
      >
        <span className={`absolute top-1 size-5 rounded-full bg-white transition-all ${value ? "left-6" : "left-1"}`} />
      </button>
    </div>
  );
}

function Slider({
  emoji, label, value, onChange, min, max, unit,
}: { emoji: string; label: string; value: number; onChange: (v: number) => void; min: number; max: number; unit: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium flex items-center gap-2">
          <span>{emoji}</span> {label}
        </span>
        <span className="font-mono text-sm text-accent">{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary"
      />
    </div>
  );
}
