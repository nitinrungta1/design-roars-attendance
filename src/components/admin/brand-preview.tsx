import { Bell, LayoutDashboard, Settings, Users } from "lucide-react";
import { bestTextOn } from "./brand-color-field";

interface BrandPreviewProps {
  primary: string | null;
  secondary: string | null;
  accent: string | null;
  logoUrl: string | null;
  brandName: string;
}

export function BrandPreview({ primary, secondary, accent, logoUrl, brandName }: BrandPreviewProps) {
  const p = primary ?? "#4f46e5";
  const s = secondary ?? "#0ea5e9";
  const a = accent ?? "#22c55e";
  const onP = bestTextOn(p);
  const onS = bestTextOn(s);
  const onA = bestTextOn(a);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Live brand preview
        </p>
      </div>

      {/* Mock app shell */}
      <div className="grid grid-cols-[120px_1fr]">
        {/* Sidebar */}
        <div className="space-y-1 border-r border-border bg-muted/30 p-2">
          <div className="mb-3 flex items-center gap-1.5 px-1">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-6 w-6 rounded object-contain" />
            ) : (
              <div
                className="h-6 w-6 rounded"
                style={{ background: `linear-gradient(135deg, ${p}, ${s})` }}
              />
            )}
            <span className="truncate text-[10px] font-semibold">{brandName}</span>
          </div>
          <SideItem icon={<LayoutDashboard className="h-3 w-3" />} label="Dashboard" active style={{ background: p, color: onP }} />
          <SideItem icon={<Users className="h-3 w-3" />} label="People" />
          <SideItem icon={<Bell className="h-3 w-3" />} label="Alerts" />
          <SideItem icon={<Settings className="h-3 w-3" />} label="Settings" />
        </div>

        {/* Main */}
        <div className="space-y-3 p-3">
          {/* Header */}
          <div
            className="flex items-center justify-between rounded-md px-3 py-2"
            style={{ background: `linear-gradient(90deg, ${p}, ${s})`, color: onP }}
          >
            <span className="text-[11px] font-semibold">Welcome back</span>
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
              style={{ background: a, color: onA }}
            >
              New
            </span>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-md px-2.5 py-1 text-[10px] font-semibold"
              style={{ background: p, color: onP }}
            >
              Primary
            </button>
            <button
              type="button"
              className="rounded-md px-2.5 py-1 text-[10px] font-semibold"
              style={{ background: s, color: onS }}
            >
              Secondary
            </button>
            <button
              type="button"
              className="rounded-md border px-2.5 py-1 text-[10px] font-semibold"
              style={{ borderColor: p, color: p }}
            >
              Outline
            </button>
          </div>

          {/* Card */}
          <div className="rounded-md border border-border bg-background p-3">
            <p className="text-[10px] font-semibold">Attendance today</p>
            <p className="mt-0.5 text-lg font-bold" style={{ color: p }}>
              98.2%
            </p>
            {/* mini chart */}
            <div className="mt-2 flex h-8 items-end gap-0.5">
              {[40, 65, 50, 75, 90, 70, 85].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t"
                  style={{
                    height: `${h}%`,
                    background:
                      i === 4 ? a : `linear-gradient(180deg, ${p}, color-mix(in oklab, ${p} 40%, transparent))`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SideItem({
  icon,
  label,
  active,
  style,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded px-1.5 py-1 text-[10px]"
      style={
        active
          ? style
          : { color: "hsl(var(--muted-foreground))" }
      }
    >
      {icon}
      <span className="truncate">{label}</span>
    </div>
  );
}
