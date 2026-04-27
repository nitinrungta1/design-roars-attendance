import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LifeBuoy, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

/**
 * Lightweight branded shell for the Help Centre.
 * Used on every /help and /help/$slug page so it works the same on
 * help.oqlio.com (subdomain) and oqlio.com/help (path).
 */
export function HelpLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="container-x mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/help" className="flex items-center gap-2">
            <Logo />
            <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
              · Help Centre
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground sm:inline"
            >
              Back to Oqlio
            </Link>
            <Link to="/contact">
              <Button size="sm" variant="outline" className="gap-1">
                <LifeBuoy className="h-3.5 w-3.5" />
                Contact support
              </Button>
            </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border">
        <div className="container-x mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Oqlio. Punchly is a product of Oqlio.</p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/contact" className="inline-flex items-center gap-1 hover:text-foreground">
              Need more help <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
