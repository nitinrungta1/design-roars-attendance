import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search, Loader2, ArrowRight, FileText } from "lucide-react";
import { searchKbArticles, logKbSearch, type KbSearchHit } from "@/lib/public-help.functions";

export function HelpSearch({
  size = "lg",
  placeholder = "Search guides, troubleshooting, tutorials…",
  autoFocus = false,
}: {
  size?: "lg" | "md";
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const search = useServerFn(searchKbArticles);
  const log = useServerFn(logKbSearch);
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<KbSearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!q.trim()) {
      setHits([]);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await search({ data: { q: q.trim() } });
        setHits(res.hits);
        setOpen(true);
        setActiveIdx(0);
        // fire-and-forget log
        void log({ data: { query: q.trim(), results_count: res.hits.length } });
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [q, search, log]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || hits.length === 0) {
      if (e.key === "Enter" && q.trim()) {
        navigate({ to: "/help", search: { q: q.trim() } as never });
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = hits[activeIdx];
      if (hit) {
        void log({ data: { query: q.trim(), results_count: hits.length, clicked_slug: hit.slug } });
        navigate({ to: "/help/$slug", params: { slug: hit.slug } });
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const inputCls =
    size === "lg"
      ? "w-full border-0 bg-transparent text-base outline-none placeholder:text-muted-foreground"
      : "w-full border-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground";

  return (
    <div ref={wrapRef} className="relative w-full max-w-2xl">
      <div
        className={`flex items-center gap-3 rounded-2xl border border-border bg-card shadow-soft transition-shadow focus-within:shadow-md ${
          size === "lg" ? "px-5 py-4" : "px-4 py-2.5"
        }`}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-muted-foreground" />
        ) : (
          <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
        )}
        <input
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => q && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={inputCls}
          aria-label="Search help articles"
        />
        {q && (
          <kbd className="hidden rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline">↵</kbd>
        )}
      </div>

      {open && q.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[420px] overflow-y-auto rounded-2xl border border-border bg-popover p-2 shadow-md">
          {hits.length === 0 && !loading && (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matching articles. Try different keywords or
              <Link to="/contact" className="ml-1 text-primary underline">
                contact support
              </Link>
              .
            </div>
          )}
          {hits.map((h, i) => (
            <Link
              key={h.id}
              to="/help/$slug"
              params={{ slug: h.slug }}
              onClick={() =>
                void log({
                  data: { query: q.trim(), results_count: hits.length, clicked_slug: h.slug },
                })
              }
              onMouseEnter={() => setActiveIdx(i)}
              className={`flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                i === activeIdx ? "bg-accent" : "hover:bg-accent/50"
              }`}
            >
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{h.title}</p>
                {h.excerpt && (
                  <p className="line-clamp-1 text-xs text-muted-foreground">{h.excerpt}</p>
                )}
              </div>
              {h.category && (
                <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:inline">
                  {h.category}
                </span>
              )}
              <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
