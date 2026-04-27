import { Link } from "@tanstack/react-router";
import {
  Rocket,
  Clock,
  Users,
  ClipboardList,
  CreditCard,
  Settings,
  Smartphone,
  AlertTriangle,
  Plug,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "Getting Started": Rocket,
  Attendance: Clock,
  Workforce: Users,
  Timesheets: ClipboardList,
  "Billing & Pricing": CreditCard,
  Billing: CreditCard,
  "Admin Settings": Settings,
  "Mobile App": Smartphone,
  Mobile: Smartphone,
  Troubleshooting: AlertTriangle,
  Integrations: Plug,
};

export function CategoryGrid({
  categories,
}: {
  categories: Array<{ name: string; count: number }>;
}) {
  if (categories.length === 0) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((c) => {
        const Icon = ICONS[c.name] ?? BookOpen;
        return (
          <Link
            key={c.name}
            to="/help"
            search={{ category: c.name } as never}
            className="group flex items-start gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold group-hover:text-primary">{c.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {c.count} {c.count === 1 ? "article" : "articles"}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
