import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import { CurrencySwitcher } from "@/components/brand/currency-switcher";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/features", label: "Features" },
  { to: "/pricing", label: "Pricing" },
  { to: "/industries", label: "Industries" },
  { to: "/mobile-app", label: "Mobile App" },
  { to: "/blog", label: "Blog" },
  { to: "/contact", label: "Contact" },
];

const PRODUCT_PATHS = new Set([
  "/", "/features", "/pricing", "/industries", "/mobile-app", "/demo",
  "/attendance-management-system", "/time-tracking-software", "/employee-timesheet-software",
  "/gps-attendance-app", "/biometric-attendance-software", "/shift-management-software",
  "/overtime-management-system", "/employee-check-in-app", "/payroll-attendance-integration",
  "/attendance-app-india",
]);

export function MarketingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isProduct = PRODUCT_PATHS.has(path);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/60 bg-background/80 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto container-x flex h-16 max-w-7xl items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="Oqlio home">
          <Logo productEyebrow={isProduct} />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "text-foreground bg-accent" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          <CurrencySwitcher />
          <Button variant="ghost" asChild size="sm">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="bg-gradient-brand text-primary-foreground hover:opacity-90">
            <Link to="/signup">Start free trial</Link>
          </Button>
        </div>
        <div className="flex items-center gap-1 lg:hidden">
          <CurrencySwitcher compact />
          <button
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-accent"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur">
          <div className="mx-auto container-x max-w-7xl py-3 space-y-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
              >
                {n.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>
              </Button>
              <Button asChild className="flex-1 bg-gradient-brand text-primary-foreground">
                <Link to="/signup" onClick={() => setOpen(false)}>Start free</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
