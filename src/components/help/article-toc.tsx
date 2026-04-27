import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Builds a TOC from h2/h3 elements inside the article body container.
 * Re-runs whenever `bodyKey` changes (e.g. slug navigation).
 */
export function ArticleToc({ containerSelector, bodyKey }: { containerSelector: string; bodyKey: string }) {
  const [items, setItems] = useState<TocItem[]>([]);

  useEffect(() => {
    const root = document.querySelector(containerSelector);
    if (!root) return;
    const headings = Array.from(root.querySelectorAll("h2, h3")) as HTMLHeadingElement[];
    const next: TocItem[] = headings.map((h, idx) => {
      if (!h.id) {
        h.id =
          h.textContent
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 60) || `h-${idx}`;
      }
      return { id: h.id, text: h.textContent ?? "", level: h.tagName === "H2" ? 2 : 3 };
    });
    setItems(next);
  }, [containerSelector, bodyKey]);

  if (items.length < 2) return null;

  return (
    <nav aria-label="Article contents" className="sticky top-24 hidden lg:block">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        On this page
      </p>
      <ul className="space-y-1.5 border-l border-border pl-4 text-sm">
        {items.map((it) => (
          <li key={it.id} className={it.level === 3 ? "ml-3" : ""}>
            <a
              href={`#${it.id}`}
              className="block truncate text-muted-foreground transition-colors hover:text-foreground"
            >
              {it.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
