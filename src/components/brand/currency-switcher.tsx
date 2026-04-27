import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CURRENCY_LIST, useCurrency } from "@/lib/currency";

interface Props {
  align?: "start" | "center" | "end";
  className?: string;
  variant?: "ghost" | "outline";
  compact?: boolean;
}

export function CurrencySwitcher({
  align = "end",
  className,
  variant = "ghost",
  compact = false,
}: Props) {
  const { currency, meta, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCY_LIST;
    return CURRENCY_LIST.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={cn("gap-1.5", className)}
          aria-label={`Currency: ${meta.name}`}
        >
          <span className="text-base leading-none">{meta.flag}</span>
          {!compact && (
            <span className="text-sm font-medium">{currency}</span>
          )}
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align={align} className="w-72 p-0">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search currency..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No currency matches "{query}"
            </p>
          ) : (
            filtered.map((c) => {
              const active = c.code === currency;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setCurrency(c.code);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                    "hover:bg-accent",
                    active && "bg-accent/60"
                  )}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <span className="font-medium tabular w-10">{c.code}</span>
                  <span className="flex-1 truncate text-muted-foreground text-xs">
                    {c.name}
                  </span>
                  <span className="w-6 text-right text-xs text-muted-foreground">
                    {c.symbol}
                  </span>
                  {active && <Check className="ml-1 h-3.5 w-3.5 text-primary" />}
                </button>
              );
            })
          )}
        </div>
        <div className="border-t border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          Live rates · auto-detected by region
        </div>
      </PopoverContent>
    </Popover>
  );
}
