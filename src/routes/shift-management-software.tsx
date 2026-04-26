import { createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/brand/marketing-layout";
import { FeaturePage } from "@/components/marketing/feature-page";
import { seo } from "@/lib/seo";
import { CalendarClock, RefreshCw, Moon, Bell, Users, Zap } from "lucide-react";

export const Route = createFileRoute("/shift-management-software")({
  head: () => seo({
    title: "Shift Management Software",
    description: "Plan, publish, and swap shifts in minutes with Punchly. Rotational, night, dynamic rosters, and grace-time policies.",
    path: "/shift-management-software",
    kind: "product",
  }),
  component: () => (
    <MarketingLayout>
      <FeaturePage
        eyebrow="Shift Management"
        h1={<>Shift management built for real-world teams</>}
        intro="From simple weekly rosters to 24/7 rotational shifts — Punchly handles every pattern."
        bullets={[
          { icon: CalendarClock, title: "Rotational shifts", desc: "A/B/C patterns, custom cycles." },
          { icon: Moon, title: "Night shifts", desc: "Cross-midnight handling, allowances." },
          { icon: RefreshCw, title: "Shift swaps", desc: "Employee-initiated with manager approval." },
          { icon: Bell, title: "Auto-detect", desc: "Detect shifts from punch patterns." },
          { icon: Users, title: "Team coverage", desc: "Live coverage view per role/shift." },
          { icon: Zap, title: "Grace time", desc: "Per-shift late tolerance rules." },
        ]}
        faq={[
          { q: "Can shifts repeat weekly or bi-weekly?", a: "Yes — set any cadence with custom days off." },
        ]}
      />
    </MarketingLayout>
  ),
});
