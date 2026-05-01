import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { getPlatformSettings } from "@/lib/system.functions";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

/**
 * Push the admin-chosen brand colors into CSS custom properties so the
 * dashboard, cards, and gradients can opt-in via `var(--brand-primary)`.
 */
function BrandThemeInjector() {
  const { data } = useQuery({
    queryKey: ["admin", "platform-settings"],
    queryFn: () => getPlatformSettings().catch(() => ({ settings: null })),
    retry: false,
    staleTime: 5 * 60_000,
  });
  const s = data?.settings;
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const apply = (name: string, val: string | null | undefined) => {
      if (val) root.style.setProperty(name, val);
      else root.style.removeProperty(name);
    };
    apply("--brand-primary", s?.primary_color);
    apply("--brand-secondary", s?.secondary_color);
    apply("--brand-accent", s?.accent_color);
  }, [s?.primary_color, s?.secondary_color, s?.accent_color]);
  return null;
}

function AuthenticatedLayout() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({
        to: "/login",
        search: { redirect: window.location.pathname },
      });
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <BrandThemeInjector />
      <Outlet />
    </>
  );
}
