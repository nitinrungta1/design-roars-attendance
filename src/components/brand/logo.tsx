import { cn } from "@/lib/utils";
import logo from "@/assets/logo-mark.png";

/**
 * Oqlio wordmark. The optional `productEyebrow` prop renders a small
 * "Punchly · Attendance OS" chip next to the logo on product pages.
 * Company pages should leave it off.
 */
export function Logo({
  className,
  showText = true,
  productEyebrow = false,
}: {
  className?: string;
  showText?: boolean;
  productEyebrow?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 font-display font-bold", className)}>
      <img
        src={logo}
        alt="Oqlio"
        width={32}
        height={32}
        className="h-8 w-8 rounded-lg"
      />
      {showText && (
        <span className="text-lg tracking-tight">
          Oql<span className="text-gradient-brand">io</span>
        </span>
      )}
      {productEyebrow && (
        <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-gradient-brand" /> Punchly
        </span>
      )}
    </span>
  );
}
