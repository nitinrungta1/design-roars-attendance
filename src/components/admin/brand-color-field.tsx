import { useState } from "react";
import { HexColorPicker } from "react-colorful";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const PRESETS = [
  "#4f46e5", "#3b82f6", "#0ea5e9", "#06b6d4",
  "#10b981", "#22c55e", "#84cc16", "#eab308",
  "#f97316", "#ef4444", "#ec4899", "#a855f7",
];

function relLuminance(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 0;
  const v = parseInt(m[1], 16);
  const rs = ((v >> 16) & 0xff) / 255;
  const gs = ((v >> 8) & 0xff) / 255;
  const bs = (v & 0xff) / 255;
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * f(rs) + 0.7152 * f(gs) + 0.0722 * f(bs);
}

export function bestTextOn(hex: string | null | undefined): "#ffffff" | "#0b1220" {
  if (!hex) return "#ffffff";
  return relLuminance(hex) > 0.5 ? "#0b1220" : "#ffffff";
}

interface BrandColorFieldProps {
  label: string;
  value: string | null;
  onChange: (hex: string | null) => void;
  hint?: string;
}

export function BrandColorField({ label, value, onChange, hint }: BrandColorFieldProps) {
  const [open, setOpen] = useState(false);
  const safe = value ?? "#4f46e5";
  const text = bestTextOn(safe);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-md border border-input bg-background px-2 py-1.5 text-sm shadow-sm hover:border-primary/40"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-7 w-10 rounded border border-border"
                style={{ background: safe, color: text }}
              >
                <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold">
                  Aa
                </span>
              </span>
              <span className="font-mono text-xs uppercase">{value ?? "Not set"}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-3 p-3">
          <HexColorPicker color={safe} onChange={(c) => onChange(c)} style={{ width: "100%" }} />
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Presets
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  aria-label={p}
                  onClick={() => onChange(p)}
                  className={cn(
                    "h-6 w-6 rounded-md border transition-transform hover:scale-110",
                    value?.toLowerCase() === p ? "ring-2 ring-primary ring-offset-1" : "border-border",
                  )}
                  style={{ background: p }}
                />
              ))}
            </div>
          </div>
          <Collapsible>
            <CollapsibleTrigger className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground">
              Advanced
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <Input
                value={value ?? ""}
                placeholder="#4f46e5"
                onChange={(e) => {
                  const v = e.target.value.trim();
                  if (!v) onChange(null);
                  else if (/^#?[0-9a-f]{6}$/i.test(v))
                    onChange(v.startsWith("#") ? v.toLowerCase() : `#${v.toLowerCase()}`);
                  else onChange(v);
                }}
                className="h-7 font-mono text-xs"
              />
            </CollapsibleContent>
          </Collapsible>
        </PopoverContent>
      </Popover>
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
