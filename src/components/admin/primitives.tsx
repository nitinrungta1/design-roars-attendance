import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumbs,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-card/30">
      <div className="container-x mx-auto max-w-[1400px] px-6 py-6">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-3 flex items-center gap-1 text-xs text-muted-foreground">
            {breadcrumbs.map((b, i) => (
              <span key={`${b.label}-${i}`} className="flex items-center gap-1">
                {b.to ? (
                  <Link to={b.to} className="hover:text-foreground">
                    {b.label}
                  </Link>
                ) : (
                  <span>{b.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <ChevronRight className="h-3 w-3" />}
              </span>
            ))}
          </nav>
        )}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            {description && (
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={`container-x mx-auto max-w-[1400px] px-6 py-8 ${className ?? ""}`}>
      {children}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function PlaceholderModule({
  title,
  description,
  shippedIn,
}: {
  title: string;
  description: string;
  shippedIn: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} eyebrow={shippedIn} />
      <PageBody>
        <div className="rounded-2xl border border-dashed border-border bg-card/30 p-10 text-center">
          <p className="text-sm font-semibold text-foreground">Coming up</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This module is shipping in <strong className="text-foreground">{shippedIn}</strong>.
            The route, navigation, and access rules are wired so we can iterate without breaking
            the rest of the admin.
          </p>
        </div>
      </PageBody>
    </>
  );
}
