// Demo / fallback data so the dashboard looks alive before the bot is connected.
import { subHours, subMinutes, subDays } from "date-fns";

export const demoStats = {
  serverStatus: "Active" as const,
  hibernating: 12,
  awake: 47,
  energySavings: 38,
  membersAsleep: 9,
  channelsAsleep: 3,
};

export const demoTargets = [
  { id: "1", name: "#design-archive", kind: "channel" as const, state: "deep" as const, since: subHours(new Date(), 7) },
  { id: "2", name: "#bots-test", kind: "channel" as const, state: "frozen" as const, since: subDays(new Date(), 2) },
  { id: "3", name: "@nova", kind: "user" as const, state: "light" as const, since: subMinutes(new Date(), 47) },
  { id: "4", name: "@kepler", kind: "user" as const, state: "deep" as const, since: subHours(new Date(), 4) },
  { id: "5", name: "@vega", kind: "user" as const, state: "light" as const, since: subMinutes(new Date(), 22) },
  { id: "6", name: "#general", kind: "channel" as const, state: "awake" as const, since: subMinutes(new Date(), 1) },
];

export const demoActivity = Array.from({ length: 24 }).map((_, i) => ({
  hour: `${String(23 - i).padStart(2, "0")}:00`,
  active: Math.round(20 + Math.random() * 40),
  sleeping: Math.round(5 + Math.random() * 30),
})).reverse();

export const demoSleepDuration = [
  { day: "Mon", hours: 14 },
  { day: "Tue", hours: 18 },
  { day: "Wed", hours: 22 },
  { day: "Thu", hours: 11 },
  { day: "Fri", hours: 19 },
  { day: "Sat", hours: 28 },
  { day: "Sun", hours: 31 },
];

export const demoLeaderboard = [
  { name: "@solace", hours: 142, emoji: "🥇" },
  { name: "@orbit", hours: 119, emoji: "🥈" },
  { name: "@halcyon", hours: 98, emoji: "🥉" },
  { name: "@meridian", hours: 71, emoji: "🌙" },
  { name: "@zenith", hours: 54, emoji: "🌙" },
];

export const demoEvents = [
  { id: "e1", time: subMinutes(new Date(), 2), type: "wake" as const, target: "#general", trigger: "New message", from: "deep", to: "awake" },
  { id: "e2", time: subMinutes(new Date(), 12), type: "hibernate" as const, target: "@vega", trigger: "60m idle", from: "awake", to: "light" },
  { id: "e3", time: subMinutes(new Date(), 38), type: "state_change" as const, target: "@kepler", trigger: "auto", from: "light", to: "deep" },
  { id: "e4", time: subHours(new Date(), 2), type: "nickname_change" as const, target: "@nova", trigger: "auto", from: null, to: null },
  { id: "e5", time: subHours(new Date(), 4), type: "hibernate" as const, target: "#design-archive", trigger: "60m idle", from: "awake", to: "light" },
  { id: "e6", time: subDays(new Date(), 1), type: "state_change" as const, target: "#bots-test", trigger: "auto", from: "deep", to: "frozen" },
];
