import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/auth/auth-shell";

export const Route = createFileRoute("/auth-callback")({
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const finish = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate({ to: "/admin" });
      else navigate({ to: "/login" });
    };
    // Give the SDK a tick to consume the URL hash
    const t = setTimeout(finish, 200);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <AuthShell title="Signing you in…" subtitle="Please wait a moment.">
      <div className="flex justify-center py-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </AuthShell>
  );
}
