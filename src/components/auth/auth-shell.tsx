import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/brand/logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-hero">
      <header className="container-x mx-auto flex h-16 max-w-7xl items-center">
        <Link to="/" aria-label="Oqlio home">
          <Logo productEyebrow />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-card/80 p-8 shadow-lg backdrop-blur">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Punchly · by Oqlio
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
            {children}
          </div>
          {footer && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              {footer}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
