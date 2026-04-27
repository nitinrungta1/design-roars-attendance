import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Sparkles, FileText, ExternalLink } from "lucide-react";
import { searchKbArticles, type KbSearchHit } from "@/lib/public-help.functions";

/**
 * Suggests up to 3 KB articles based on the live ticket subject. Used
 * inside <TicketForm> on the public contact page to deflect tickets.
 */
export function DeflectionSuggestions({
  query,
  onSelect,
}: {
  query: string;
  onSelect?: (slug: string) => void;
}) {
  const search = useServerFn(searchKbArticles);
  const [hits, setHits] = useState<KbSearchHit[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (!query.trim() || query.trim().length < 4) {
      setHits([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const res = await search({ data: { q: query.trim(), limit: 3 } });
        setHits(res.hits);
      } catch {
        // ignore — deflection is best-effort
      }
    }, 400);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query, search]);

  if (hits.length === 0) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
        <Sparkles className="h-4 w-4" />
        These help articles might solve your issue
      </div>
      <ul className="space-y-1.5">
        {hits.map((h) => (
          <li key={h.id}>
            <Link
              to="/help/$slug"
              params={{ slug: h.slug }}
              target="_blank"
              rel="noopener"
              onClick={() => onSelect?.(h.slug)}
              className="group flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-card"
            >
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate font-medium group-hover:text-primary">{h.title}</span>
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
