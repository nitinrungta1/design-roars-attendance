import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CURRENCY_META } from "@/lib/currency";
import { cn } from "@/lib/utils";

const RECENTS_KEY = "oqlio.settings.currency.recents";

interface CurrencySelectProps {
  value: string;
  onChange: (code: string) => void;
}

export function CurrencySelect({ value, onChange }: CurrencySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const all = useMemo(() => Object.values(CURRENCY_META), []);
  const recents = useMemo<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(RECENTS_KEY) || "[]");
    } catch {
      return [];
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q),
    );
  }, [all, query]);

  const current = CURRENCY_META[value as keyof typeof CURRENCY_META];

  const select = (code: string) => {
    onChange(code);
    setOpen(false);
    setQuery("");
    if (typeof window !== "undefined") {
      const next = [code, ...recents.filter((r) => r !== code)].slice(0, 5);
      localStorage.setItem(RECENTS_KEY, JSON.stringify(next));
    }
  };

  const renderRow = (code: string) => {
    const c = CURRENCY_META[code as keyof typeof CURRENCY_META];
    if (!c) return null;
    return (
      <button
        key={code}
        type="button"
        onClick={() => select(code)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
      >
        <span className="text-base leading-none">{c.flag}</span>
        <span className="font-mono text-xs font-semibold">{c.code}</span>
        <span className="text-muted-foreground">{c.symbol}</span>
        <span className="ml-1 truncate text-xs text-muted-foreground">{c.name}</span>
        {value === code && <Check className="ml-auto h-4 w-4 text-primary" />}
      </button>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
          {current ? (
            <span className="flex items-center gap-2">
              <span>{current.flag}</span>
              <span className="font-mono text-xs font-semibold">{current.code}</span>
              <span className="text-muted-foreground">{current.symbol}</span>
              <span className="text-xs text-muted-foreground">· {current.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Select currency…</span>
          )}
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search currency…"
            className="h-8 pl-7 text-xs"
            autoFocus
          />
        </div>
        <div className={cn("max-h-72 space-y-0.5 overflow-y-auto")}>
          {!query && recents.length > 0 && (
            <>
              <p className="px-2 pb-1 pt-1 text-[10px] font-semibold uppercase text-muted-foreground">
                Recent
              </p>
              {recents.map(renderRow)}
              <div className="my-1 border-t border-border" />
            </>
          )}
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">No matches.</p>
          ) : (
            filtered.map((c) => renderRow(c.code))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
