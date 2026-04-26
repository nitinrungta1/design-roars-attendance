import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function StickyMobileCta() {
  return (
    <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40">
      <div className="glass flex items-center gap-2 rounded-2xl p-2 shadow-elegant">
        <Button asChild variant="ghost" className="flex-1">
          <Link to="/demo">Book demo</Link>
        </Button>
        <Button asChild className="flex-1 bg-gradient-brand text-primary-foreground">
          <Link to="/demo">Start free</Link>
        </Button>
      </div>
    </div>
  );
}
