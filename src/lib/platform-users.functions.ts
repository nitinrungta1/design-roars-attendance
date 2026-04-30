import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Roles managed in this UI
export const PLATFORM_ROLES = ["super_admin", "admin", "manager", "employee"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

// Permission keys used by the per-user override toggles
export const PERMISSION_KEYS = [
  "view_users",
  "invite_users",
  "edit_roles",
  "delete_users",
  "view_billing",
  "edit_settings",
] as const;
export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export type UserStatus = "active" | "pending" | "deactivated";

export interface PlatformUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: PlatformRole | null;
  permissions: Record<string, boolean>;
  status: UserStatus;
  joined_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
  company_id: string | null;
}

export interface ListResult {
  users: PlatformUser[];
  stats: { total: number; superAdmins: number; pending: number; deactivated: number };
  error?: string;
}

// Guard: caller must be super_admin or admin
async function ensureAdmin(userId: string): Promise<{ ok: true; companyId: string | null } | { ok: false; error: string }> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: rolesData, error } = await supabaseAdmin
    .from("user_roles")
    .select("role, company_id")
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };
  const rows = rolesData ?? [];
  const roles = rows.map((r) => r.role as string);
  if (!roles.includes("super_admin") && !roles.includes("admin")) {
    return { ok: false, error: "You must be an admin or super admin to manage users." };
  }
  const companyId = rows.find((r) => r.company_id)?.company_id ?? null;
  return { ok: true, companyId };
}

async function getDefaultCompanyId(): Promise<string | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("companies")
    .select("id")
    .eq("is_default", true)
    .limit(1)
    .maybeSingle();
  return data?.id ?? null;
}

function deriveStatus(u: { email_confirmed_at?: string | null; banned_until?: string | null }): UserStatus {
  if (u.banned_until) {
    const until = new Date(u.banned_until).getTime();
    if (!Number.isNaN(until) && until > Date.now()) return "deactivated";
  }
  if (!u.email_confirmed_at) return "pending";
  return "active";
}

// =============================================================
// LIST
// =============================================================
export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ListResult> => {
    const { userId } = context as { userId: string };
    const guard = await ensureAdmin(userId);
    const empty: ListResult["stats"] = { total: 0, superAdmins: 0, pending: 0, deactivated: 0 };
    if (!guard.ok) return { users: [], stats: empty, error: guard.error };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [authRes, rolesRes, profilesRes] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      supabaseAdmin.from("user_roles").select("user_id, role, permissions, company_id, granted_at"),
      supabaseAdmin.from("profiles").select("id, full_name, avatar_url, company_id"),
    ]);

    if (authRes.error) {
      console.error("[platform-users.listUsers] auth error", authRes.error);
      return { users: [], stats: empty, error: authRes.error.message };
    }
    if (rolesRes.error || profilesRes.error) {
      const e = rolesRes.error ?? profilesRes.error;
      console.error("[platform-users.listUsers] data error", { roles: rolesRes.error, profiles: profilesRes.error });
      return { users: [], stats: empty, error: e?.message ?? "Failed to load users" };
    }

    const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
    const roleByUser = new Map<string, { role: PlatformRole; permissions: Record<string, boolean>; company_id: string | null }>();
    for (const r of rolesRes.data ?? []) {
      // Pick the highest-priority role per user for display
      const priority: Record<string, number> = { super_admin: 4, admin: 3, manager: 2, employee: 1 };
      const existing = roleByUser.get(r.user_id);
      const role = r.role as PlatformRole;
      const score = priority[role] ?? 0;
      const existingScore = existing ? priority[existing.role] ?? 0 : -1;
      if (!existing || score > existingScore) {
        roleByUser.set(r.user_id, {
          role: (PLATFORM_ROLES as readonly string[]).includes(role) ? role : "employee",
          permissions: (r.permissions as Record<string, boolean>) ?? {},
          company_id: r.company_id ?? null,
        });
      }
    }

    const users: PlatformUser[] = (authRes.data?.users ?? []).map((u) => {
      const profile = profileById.get(u.id) ?? null;
      const roleEntry = roleByUser.get(u.id) ?? null;
      const banned_until = (u as unknown as { banned_until?: string | null }).banned_until ?? null;
      const status = deriveStatus({
        email_confirmed_at: u.email_confirmed_at ?? null,
        banned_until,
      });
      return {
        user_id: u.id,
        email: u.email ?? null,
        full_name: profile?.full_name ?? (u.user_metadata?.full_name as string | undefined) ?? null,
        avatar_url: profile?.avatar_url ?? null,
        role: roleEntry?.role ?? null,
        permissions: roleEntry?.permissions ?? {},
        status,
        joined_at: u.created_at ?? null,
        email_confirmed_at: u.email_confirmed_at ?? null,
        banned_until,
        company_id: roleEntry?.company_id ?? profile?.company_id ?? null,
      };
    });

    users.sort((a, b) => {
      const da = a.joined_at ? new Date(a.joined_at).getTime() : 0;
      const db = b.joined_at ? new Date(b.joined_at).getTime() : 0;
      return db - da;
    });

    const stats = {
      total: users.length,
      superAdmins: users.filter((u) => u.role === "super_admin").length,
      pending: users.filter((u) => u.status === "pending").length,
      deactivated: users.filter((u) => u.status === "deactivated").length,
    };
    return { users, stats };
  });

// =============================================================
// INVITE
// =============================================================
export const inviteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      email: z.string().email(),
      full_name: z.string().min(1).max(120),
      role: z.enum(PLATFORM_ROLES),
    }),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean; error?: string }> => {
    const { userId } = context as { userId: string };
    const guard = await ensureAdmin(userId);
    if (!guard.ok) return { ok: false, error: guard.error };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const companyId = guard.companyId ?? (await getDefaultCompanyId());

    try {
      const { data: invited, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        data.email,
        { data: { full_name: data.full_name } },
      );
      if (inviteErr || !invited?.user) {
        console.error("[platform-users.inviteUser] invite error", inviteErr);
        return { ok: false, error: inviteErr?.message ?? "Failed to send invite." };
      }
      const newId = invited.user.id;

      // Profile (id is PK = auth user id)
      const { error: profileErr } = await supabaseAdmin
        .from("profiles")
        .upsert({ id: newId, full_name: data.full_name, company_id: companyId }, { onConflict: "id" });
      if (profileErr) console.error("[platform-users.inviteUser] profile upsert error", profileErr);

      // Clear existing roles (handle_new_user trigger may have inserted a default)
      await supabaseAdmin.from("user_roles").delete().eq("user_id", newId);
      const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
        user_id: newId,
        role: data.role,
        company_id: companyId,
        granted_by: userId,
        permissions: {},
      });
      if (roleErr) {
        console.error("[platform-users.inviteUser] role insert error", roleErr);
        return { ok: false, error: `Invite sent, but role assignment failed: ${roleErr.message}` };
      }
      return { ok: true };
    } catch (e) {
      const err = e as Error;
      console.error("[platform-users.inviteUser] unexpected", err);
      return { ok: false, error: err.message };
    }
  });

// =============================================================
// UPDATE ROLE + PERMISSIONS
// =============================================================
export const updateUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      role: z.enum(PLATFORM_ROLES),
      permissions: z.record(z.string(), z.boolean()).optional(),
    }),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean; error?: string }> => {
    const { userId } = context as { userId: string };
    const guard = await ensureAdmin(userId);
    if (!guard.ok) return { ok: false, error: guard.error };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // super_admin always gets all permissions on
    const fullPerms: Record<string, boolean> = Object.fromEntries(PERMISSION_KEYS.map((k) => [k, true]));
    const permissions = data.role === "super_admin" ? fullPerms : data.permissions ?? {};

    // Find existing row(s) — keep one row per user. Delete extras and upsert.
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from("user_roles")
      .select("id, company_id")
      .eq("user_id", data.userId);
    if (fetchErr) {
      console.error("[platform-users.updateUserRole] fetch error", fetchErr);
      return { ok: false, error: fetchErr.message };
    }

    const companyId = existing?.[0]?.company_id ?? guard.companyId ?? (await getDefaultCompanyId());

    if ((existing ?? []).length > 0) {
      const { error: delErr } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId);
      if (delErr) {
        console.error("[platform-users.updateUserRole] delete error", delErr);
        return { ok: false, error: delErr.message };
      }
    }

    const { error: insErr } = await supabaseAdmin.from("user_roles").insert({
      user_id: data.userId,
      role: data.role,
      company_id: companyId,
      granted_by: userId,
      permissions,
    });
    if (insErr) {
      console.error("[platform-users.updateUserRole] insert error", insErr);
      return { ok: false, error: insErr.message };
    }
    return { ok: true };
  });

// =============================================================
// DEACTIVATE / REACTIVATE
// =============================================================
export const setUserBanned = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string().uuid(), banned: z.boolean() }))
  .handler(async ({ context, data }): Promise<{ ok: boolean; error?: string }> => {
    const { userId } = context as { userId: string };
    const guard = await ensureAdmin(userId);
    if (!guard.ok) return { ok: false, error: guard.error };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.banned ? "876600h" : "none",
    });
    if (error) {
      console.error("[platform-users.setUserBanned] error", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  });

// =============================================================
// RESEND INVITE / REVOKE PENDING
// =============================================================
export const resendInvite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ email: z.string().email() }))
  .handler(async ({ context, data }): Promise<{ ok: boolean; error?: string }> => {
    const { userId } = context as { userId: string };
    const guard = await ensureAdmin(userId);
    if (!guard.ok) return { ok: false, error: guard.error };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email);
    if (error) {
      console.error("[platform-users.resendInvite] error", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  });

export const revokeUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ userId: z.string().uuid() }))
  .handler(async ({ context, data }): Promise<{ ok: boolean; error?: string }> => {
    const { userId } = context as { userId: string };
    const guard = await ensureAdmin(userId);
    if (!guard.ok) return { ok: false, error: guard.error };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Best effort cleanup — auth admin delete cascades via FK in most setups, but
    // rows in public.* tables don't necessarily have ON DELETE CASCADE.
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    await supabaseAdmin.from("profiles").delete().eq("id", data.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) {
      console.error("[platform-users.revokeUser] error", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  });
