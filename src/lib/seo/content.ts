import type { SeoIndustry, SeoService, TemplateVars } from "./types";

/** Deterministic per-slug pick from a pool so every page gets unique-ish copy. */
function pick<T>(pool: T[], seed: string): T {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return pool[Math.abs(h) % pool.length];
}

const CITY_OPENERS = [
  "Teams across {city} switched to Punchly to stop fighting their attendance system.",
  "Whether you run one office in {city} or twenty branches across {state}, Punchly scales with you.",
  "Punchly is built for {city} businesses that need attendance done right the first time.",
  "From startups in {city} to enterprises across {state}, Punchly is the modern attendance backbone.",
  "{city} HR and ops leaders trust Punchly to keep payroll clean and disputes low.",
];

const INDUSTRY_OPENERS = [
  "For {industry}, attendance isn't a tick-box — it directly impacts payroll, scheduling and customer experience.",
  "{industry} have unique rhythms: rotating shifts, mixed contracts, multiple locations. Punchly handles all of it.",
  "Built with feedback from real {industry}, Punchly removes friction from every check-in.",
];

const STATS_LINES = [
  "Used by 120+ teams across {state}.",
  "Cuts payroll prep time by ~62% on average.",
  "Customers report sub-2-second check-ins on most devices.",
  "99.9% uptime over the last 12 months.",
];

export function buildIntro(vars: TemplateVars, seed: string): string {
  const lines: string[] = [];
  if (vars.city) lines.push(pick(CITY_OPENERS, seed + ":city"));
  if (vars.industry) lines.push(pick(INDUSTRY_OPENERS, seed + ":industry"));
  lines.push(pick(STATS_LINES, seed + ":stat"));
  return lines
    .map((l) =>
      l
        .replaceAll("{city}", vars.city ?? "")
        .replaceAll("{state}", vars.state ?? "")
        .replaceAll("{industry}", vars.industry ?? ""),
    )
    .join(" ");
}

export type FeaturePillar = { icon: string; title: string; desc: string };

export const DEFAULT_PILLARS: FeaturePillar[] = [
  { icon: "MapPin", title: "GPS check-ins", desc: "Geofenced, spoof-resistant attendance from any phone." },
  { icon: "ScanFace", title: "Face & PIN kiosk", desc: "Any tablet becomes a face-recognition attendance kiosk." },
  { icon: "CalendarClock", title: "Shift scheduling", desc: "Plan rosters, swaps and approvals in one place." },
  { icon: "ClipboardList", title: "Timesheets", desc: "Auto-built from check-ins. Lock after submit." },
  { icon: "Calculator", title: "Payroll exports", desc: "One-click Excel, CSV and PDF for any payroll system." },
  { icon: "Clock", title: "Overtime rules", desc: "Configurable per shift, contract and statutory rule." },
];

export function builtInFallbacks(service: SeoService, city: string | null, state: string | null) {
  const where = city ? `in ${city}` : "";
  return {
    metaTitle: `Best ${service.noun} ${where} (2026) — Punchly`.replace("  ", " ").trim(),
    metaDescription: city
      ? `Looking for the best ${service.noun.toLowerCase()} in ${city}, ${state}? Punchly by Oqlio delivers GPS check-ins, shift scheduling and payroll-ready reports for ${city} teams.`
      : `Punchly by Oqlio is the modern ${service.noun.toLowerCase()} for high-growth teams. GPS check-ins, shifts, payroll-ready.`,
    h1: `Best ${service.noun.toLowerCase()} ${where}`.replace("  ", " ").trim(),
    heroIntro: city
      ? `Punchly helps ${city} businesses replace clunky biometric devices with a 2-second mobile check-in, geofenced shifts and automatic payroll exports.`
      : `Punchly modernizes ${service.noun.toLowerCase()} with GPS, geofencing, shift scheduling and payroll-ready exports.`,
    ctaText: city ? `Start your free Punchly trial for ${city}` : `Start your free Punchly trial`,
  };
}

export function industryHeroFallback(industry: SeoIndustry, city: string | null): string {
  if (industry.hero_blurb) return industry.hero_blurb;
  return city
    ? `Punchly is built for ${industry.noun} in ${city}.`
    : `Punchly is built for ${industry.noun}.`;
}
