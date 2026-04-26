import { cn } from "@/lib/utils";
import logo from "@/assets/logo-mark.png";

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-bold", className)}>
      <img
        src={logo}
        alt="Punchly"
        width={32}
        height={32}
        className="h-8 w-8 rounded-lg"
      />
      {showText && (
        <span className="text-lg tracking-tight">
          Punch<span className="text-gradient-brand">ly</span>
        </span>
      )}
    </span>
  );
}
