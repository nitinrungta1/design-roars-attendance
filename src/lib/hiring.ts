// Shared constants/types/helpers for the Hiring module (client-safe).

export const APPLICATION_STATUSES = [
  "new",
  "screening",
  "assignment_sent",
  "assignment_submitted",
  "interview_r1",
  "interview_r2",
  "selected",
  "rejected",
  "on_hold",
  "hired",
  "withdrawn",
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const STATUS_LABEL: Record<ApplicationStatus, string> = {
  new: "New",
  screening: "Screening",
  assignment_sent: "Assignment Sent",
  assignment_submitted: "Assignment Submitted",
  interview_r1: "Interview R1",
  interview_r2: "Interview R2",
  selected: "Selected",
  rejected: "Rejected",
  on_hold: "On Hold",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

export const STATUS_TONE: Record<ApplicationStatus, string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  screening: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  assignment_sent: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  assignment_submitted: "bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20",
  interview_r1: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  interview_r2: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  selected: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  on_hold: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  hired: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  withdrawn: "bg-muted text-muted-foreground border-border",
};

export const KANBAN_COLUMNS: ApplicationStatus[] = [
  "new",
  "screening",
  "assignment_sent",
  "assignment_submitted",
  "interview_r1",
  "interview_r2",
  "selected",
  "hired",
  "on_hold",
  "rejected",
];

export const WORK_TYPES = ["remote", "hybrid", "onsite"] as const;
export type WorkType = (typeof WORK_TYPES)[number];
export const WORK_TYPE_LABEL: Record<WorkType, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
};

export const EXPERIENCE_LEVELS = ["intern", "junior", "mid", "senior", "lead"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
export const EXPERIENCE_LABEL: Record<ExperienceLevel, string> = {
  intern: "Intern",
  junior: "Junior",
  mid: "Mid-level",
  senior: "Senior",
  lead: "Lead",
};

export const INTERVIEW_MODES = ["video", "phone", "onsite"] as const;
export type InterviewMode = (typeof INTERVIEW_MODES)[number];

export interface ScreeningQuestion {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "yesno";
  required: boolean;
  options?: string[];
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function formatSalary(min?: number | null, max?: number | null, currency = "INR"): string | null {
  if (!min && !max) return null;
  const fmt = (n: number) => {
    if (n >= 100000) return `${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return `${n}`;
  };
  const sym = currency === "INR" ? "₹" : currency === "USD" ? "$" : `${currency} `;
  if (min && max) return `${sym}${fmt(min)} – ${sym}${fmt(max)}`;
  if (min) return `From ${sym}${fmt(min)}`;
  return `Up to ${sym}${fmt(max!)}`;
}
