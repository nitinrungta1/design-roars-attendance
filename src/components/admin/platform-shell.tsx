import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft, LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/lib/auth";

/**
 * Platform-level shell used by routes that should NOT be wrapped in the
 * Punchly admin sidebar (e.g. /admin/users, /admin/settings). Provides only
 * a top bar with the Oqlio logo (back to /home) and the user menu.
 */
export function PlatformShell({ children }: { children: ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const onSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };
  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link to="/home" aria-label="Oqlio home">
              <Logo />
            </Link>
            <Link
              to="/home"
              className="hidden items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground sm:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to apps
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium leading-tight">
                {profile?.full_name ?? user?.email}
              </div>
              <div className="text-xs leading-tight text-muted-foreground">{user?.email}</div>
            </div>
            <button
              onClick={onSignOut}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
