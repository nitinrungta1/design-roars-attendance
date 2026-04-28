import { createMiddleware } from "@tanstack/react-start";
import { requireSupabaseAuth } from "./auth-middleware";

/**
 * Returns a middleware that requires the authenticated user to either:
 *   - hold the `super_admin` role, or
 *   - have the given permission key granted via `role_permissions`.
 *
 * Throws a 403 Response otherwise. Use on any admin server function that
 * performs a write or returns sensitive cross-tenant data.
 */
export function requirePermission(key: string) {
  return createMiddleware({ type: "function" })
    .middleware([requireSupabaseAuth])
    .server(async ({ next, context }) => {
      const { supabase, userId } = context as {
        supabase: import("@supabase/supabase-js").SupabaseClient;
        userId: string;
      };

      // super_admin shortcut — always allowed
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const roles = (rolesData ?? []).map((r) => r.role as string);
      if (roles.includes("super_admin")) return next();

      const { data: ok } = await supabase.rpc("has_permission", {
        _user_id: userId,
        _key: key,
      });
      if (ok === true) return next();

      throw new Response(`Permission denied: ${key}`, { status: 403 });
    });
}
