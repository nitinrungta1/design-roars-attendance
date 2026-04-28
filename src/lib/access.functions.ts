import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { requirePermission } from "@/integrations/supabase/permission-middleware";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const APP_ROLES: AppRole[] = [
  "super_admin",
  "admin",
  "hr",
  "manager",
  "employee",
  "sales",
  "support",
  "finance",
  "developer",
  "viewer",
];

// ============================================================
// Permissions for the current user
// ============================================================

export const getMyPermissions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ permissions: string[] }> => {
    const { supabase, userId } = context;
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const roles = (rolesData ?? []).map((r) => r.role);
    if (roles.length === 0) return { permissions: [] };
    const { data: rp } = await supabase
      .from("role_permissions")
      .select("permission_key, role")
      .in("role", roles);
    const set = new Set<string>();
    for (const r of rp ?? []) set.add(r.permission_key);
    return { permissions: [...set] };
  });

// ============================================================
// Platform users
// ============================================================

export interface PlatformUserRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  roles: AppRole[];
  primary_company: { id: string; name: string } | null;
  joined_at: string | null;
  email_confirmed_at: string | null;
}

export const listPlatformUsers = createServerFn({ method: "POST" })
  .middleware([requirePermission("access.users.read")])
  .handler(
    async ({
      context,
    }): Promise<{ users: PlatformUserRow[]; error?: string; canCreate: boolean }> => {
      const { supabase, userId } = context;
      // Determine if caller can also create users (write permission)
      const { data: writeOk } = await supabase.rpc("has_permission", {
        _user_id: userId,
        _key: "access.users.write",
      });
      const { data: myRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const isSuper = (myRoles ?? []).some((r) => r.role === "super_admin");
      const canCreate = isSuper || writeOk === true;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [authUsers, profilesRes, rolesRes, membersRes, companiesRes] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ perPage: 1000 }),
      supabaseAdmin.from("profiles").select("id, full_name, avatar_url, created_at"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
      supabaseAdmin
        .from("company_members")
        .select("user_id, company_id, is_owner, joined_at")
        .order("is_owner", { ascending: false })
        .order("joined_at", { ascending: true }),
      supabaseAdmin.from("companies").select("id, name"),
    ]);

    const profiles = profilesRes.data ?? [];
    const roles = rolesRes.data ?? [];
    const members = membersRes.data ?? [];
    const companies = companiesRes.data ?? [];
    const emailById = new Map<string, string>();
    const joinedById = new Map<string, string>();
    const confirmedById = new Map<string, string | null>();
    for (const u of authUsers.data?.users ?? []) {
      if (u.email) emailById.set(u.id, u.email);
      if (u.created_at) joinedById.set(u.id, u.created_at);
      confirmedById.set(u.id, u.email_confirmed_at ?? null);
    }

    const companiesById = new Map((companies ?? []).map((c) => [c.id, c.name]));
    const rolesByUser = new Map<string, AppRole[]>();
    for (const r of roles ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    }
    const primaryByUser = new Map<string, { id: string; name: string; joined_at: string }>();
    for (const m of members ?? []) {
      if (!primaryByUser.has(m.user_id)) {
        primaryByUser.set(m.user_id, {
          id: m.company_id,
          name: companiesById.get(m.company_id) ?? "—",
          joined_at: m.joined_at as string,
        });
      }
    }

      const ids = Array.from(
        new Set([
          ...profiles.map((p) => p.id),
          ...(authUsers.data?.users ?? []).map((u) => u.id),
        ]),
      );
      const users: PlatformUserRow[] = ids.map((id) => {
        const profile = profiles.find((p) => p.id === id) ?? null;
        const primary = primaryByUser.get(id) ?? null;
        return {
          user_id: id,
          email: emailById.get(id) ?? null,
          full_name: profile?.full_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
          roles: rolesByUser.get(id) ?? [],
          primary_company: primary ? { id: primary.id, name: primary.name } : null,
          joined_at:
            primary?.joined_at ??
            (profile?.created_at as string | undefined) ??
            joinedById.get(id) ??
            null,
          email_confirmed_at: confirmedById.get(id) ?? null,
        };
      });
      users.sort((a, b) => {
        const da = a.joined_at ? new Date(a.joined_at).getTime() : 0;
        const db = b.joined_at ? new Date(b.joined_at).getTime() : 0;
        return da - db;
      });
      return { users, canCreate };
    },
  );

export const assignRole = createServerFn({ method: "POST" })
  .middleware([requirePermission("access.users.write")])
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      role: z.enum([
        "super_admin",
        "admin",
        "hr",
        "manager",
        "employee",
        "sales",
        "support",
        "finance",
        "developer",
        "viewer",
      ]),
    }),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean; error?: string }> => {
    const { supabase } = context;
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error && !error.message.includes("duplicate")) {
      return { ok: false, error: error.message };
    }
    await supabase.rpc("log_audit", {
      _action: "role.assigned",
      _entity_type: "user_role",
      _entity_id: data.userId,
      _diff: { role: data.role },
    });
    return { ok: true };
  });

export const revokeRole = createServerFn({ method: "POST" })
  .middleware([requirePermission("access.users.write")])
  .inputValidator(
    z.object({
      userId: z.string().uuid(),
      role: z.enum([
        "super_admin",
        "admin",
        "hr",
        "manager",
        "employee",
        "sales",
        "support",
        "finance",
        "developer",
        "viewer",
      ]),
    }),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean; error?: string }> => {
    const { supabase } = context;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId)
      .eq("role", data.role);
    if (error) return { ok: false, error: error.message };
    await supabase.rpc("log_audit", {
      _action: "role.revoked",
      _entity_type: "user_role",
      _entity_id: data.userId,
      _diff: { role: data.role },
    });
    return { ok: true };
  });

// ============================================================
// Roles & permissions matrix
// ============================================================

export interface RoleSummaryRow {
  role: AppRole;
  member_count: number;
  permission_count: number;
}

export const listRolesWithCounts = createServerFn({ method: "POST" })
  .middleware([requirePermission("access.roles.write")])
  .handler(async ({ context }): Promise<{ roles: RoleSummaryRow[] }> => {
    const { supabase } = context;
    const [{ data: ur }, { data: rp }] = await Promise.all([
      supabase.from("user_roles").select("role"),
      supabase.from("role_permissions").select("role"),
    ]);
    const memberCount = new Map<AppRole, number>();
    const permCount = new Map<AppRole, number>();
    for (const r of ur ?? []) memberCount.set(r.role, (memberCount.get(r.role) ?? 0) + 1);
    for (const r of rp ?? []) permCount.set(r.role, (permCount.get(r.role) ?? 0) + 1);
    return {
      roles: APP_ROLES.map((role) => ({
        role,
        member_count: memberCount.get(role) ?? 0,
        permission_count: permCount.get(role) ?? 0,
      })),
    };
  });

export interface PermissionRow {
  key: string;
  module: string;
  action: string;
  label: string;
  description: string | null;
  sort_order: number;
}

export interface PermissionMatrix {
  permissions: PermissionRow[];
  roles: AppRole[];
  grants: Record<string, string[]>; // role -> permission keys
}

export const listPermissionMatrix = createServerFn({ method: "POST" })
  .middleware([requirePermission("access.roles.write")])
  .handler(async ({ context }): Promise<PermissionMatrix> => {
    const { supabase } = context;
    const [{ data: perms }, { data: rp }] = await Promise.all([
      supabase
        .from("permissions")
        .select("key, module, action, label, description, sort_order")
        .order("sort_order", { ascending: true }),
      supabase.from("role_permissions").select("role, permission_key"),
    ]);
    const grants: Record<string, string[]> = {};
    for (const role of APP_ROLES) grants[role] = [];
    for (const r of rp ?? []) {
      if (grants[r.role]) grants[r.role].push(r.permission_key);
    }
    return {
      permissions: (perms ?? []).map((p) => ({
        key: p.key,
        module: p.module,
        action: p.action,
        label: p.label,
        description: p.description,
        sort_order: p.sort_order,
      })),
      roles: APP_ROLES,
      grants,
    };
  });

export const togglePermission = createServerFn({ method: "POST" })
  .middleware([requirePermission("access.roles.write")])
  .inputValidator(
    z.object({
      role: z.enum([
        "super_admin",
        "admin",
        "hr",
        "manager",
        "employee",
        "sales",
        "support",
        "finance",
        "developer",
        "viewer",
      ]),
      permissionKey: z.string().min(1).max(120),
      granted: z.boolean(),
    }),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean; error?: string }> => {
    const { supabase } = context;
    if (data.granted) {
      const { error } = await supabase
        .from("role_permissions")
        .insert({ role: data.role, permission_key: data.permissionKey });
      if (error && !error.message.includes("duplicate")) {
        return { ok: false, error: error.message };
      }
    } else {
      const { error } = await supabase
        .from("role_permissions")
        .delete()
        .eq("role", data.role)
        .eq("permission_key", data.permissionKey);
      if (error) return { ok: false, error: error.message };
    }
    await supabase.rpc("log_audit", {
      _action: data.granted ? "permission.granted" : "permission.revoked",
      _entity_type: "role_permission",
      _entity_id: `${data.role}:${data.permissionKey}`,
      _diff: { role: data.role, permission_key: data.permissionKey },
    });
    return { ok: true };
  });

// ============================================================
// Teams
// ============================================================

export interface TeamRow {
  id: string;
  company_id: string;
  company_name: string;
  name: string;
  slug: string;
  color: string;
  description: string | null;
  lead_user_id: string | null;
  lead_name: string | null;
  member_count: number;
  created_at: string;
}

export const listTeams = createServerFn({ method: "POST" })
  .middleware([requirePermission("access.teams.write")])
  .handler(async ({ context }): Promise<{ teams: TeamRow[] }> => {
    const { supabase } = context;
    const [{ data: teams }, { data: members }, { data: companies }, { data: profiles }] =
      await Promise.all([
        supabase
          .from("teams")
          .select("id, company_id, name, slug, color, description, lead_user_id, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("team_members").select("team_id"),
        supabase.from("companies").select("id, name"),
        supabase.from("profiles").select("id, full_name"),
      ]);
    const companyName = new Map((companies ?? []).map((c) => [c.id, c.name]));
    const profileName = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    const memberCount = new Map<string, number>();
    for (const m of members ?? []) {
      memberCount.set(m.team_id, (memberCount.get(m.team_id) ?? 0) + 1);
    }
    return {
      teams: (teams ?? []).map((t) => ({
        id: t.id,
        company_id: t.company_id,
        company_name: companyName.get(t.company_id) ?? "—",
        name: t.name,
        slug: t.slug,
        color: t.color ?? "#6366f1",
        description: t.description,
        lead_user_id: t.lead_user_id,
        lead_name: t.lead_user_id ? profileName.get(t.lead_user_id) ?? null : null,
        member_count: memberCount.get(t.id) ?? 0,
        created_at: t.created_at as string,
      })),
    };
  });

export const createTeam = createServerFn({ method: "POST" })
  .middleware([requirePermission("access.teams.write")])
  .inputValidator(
    z.object({
      companyId: z.string().uuid(),
      name: z.string().min(1).max(80),
      description: z.string().max(500).optional(),
      color: z.string().max(20).optional(),
    }),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean; id?: string; error?: string }> => {
    const { supabase, userId } = context;
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 60);
    const { data: row, error } = await supabase
      .from("teams")
      .insert({
        company_id: data.companyId,
        name: data.name,
        slug,
        description: data.description ?? null,
        color: data.color ?? "#6366f1",
        created_by: userId,
      })
      .select("id")
      .single();
    if (error || !row) return { ok: false, error: error?.message };
    await supabase.rpc("log_audit", {
      _action: "team.created",
      _entity_type: "team",
      _entity_id: row.id,
      _diff: { name: data.name, company_id: data.companyId },
      _company_id: data.companyId,
    });
    return { ok: true, id: row.id };
  });

export const deleteTeam = createServerFn({ method: "POST" })
  .middleware([requirePermission("access.teams.write")])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, data }): Promise<{ ok: boolean; error?: string }> => {
    const { supabase } = context;
    const { error } = await supabase.from("teams").delete().eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    await supabase.rpc("log_audit", {
      _action: "team.deleted",
      _entity_type: "team",
      _entity_id: data.id,
    });
    return { ok: true };
  });

export interface TeamMemberRow {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  is_lead: boolean;
  added_at: string;
}

export const listTeamMembers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ teamId: z.string().uuid() }))
  .handler(async ({ context, data }): Promise<{ members: TeamMemberRow[] }> => {
    const { supabase } = context;
    const { data: members } = await supabase
      .from("team_members")
      .select("user_id, is_lead, added_at")
      .eq("team_id", data.teamId);
    if (!members || members.length === 0) return { members: [] };
    const ids = members.map((m) => m.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", ids);
    const pById = new Map((profiles ?? []).map((p) => [p.id, p]));
    return {
      members: members.map((m) => {
        const p = pById.get(m.user_id);
        return {
          user_id: m.user_id,
          full_name: p?.full_name ?? null,
          avatar_url: p?.avatar_url ?? null,
          is_lead: m.is_lead,
          added_at: m.added_at as string,
        };
      }),
    };
  });

export const addTeamMember = createServerFn({ method: "POST" })
  .middleware([requirePermission("access.teams.write")])
  .inputValidator(
    z.object({
      teamId: z.string().uuid(),
      userId: z.string().uuid(),
      isLead: z.boolean().optional(),
    }),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean; error?: string }> => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("team_members").insert({
      team_id: data.teamId,
      user_id: data.userId,
      is_lead: data.isLead ?? false,
      added_by: userId,
    });
    if (error && !error.message.includes("duplicate")) {
      return { ok: false, error: error.message };
    }
    if (data.isLead) {
      await supabase.from("teams").update({ lead_user_id: data.userId }).eq("id", data.teamId);
    }
    await supabase.rpc("log_audit", {
      _action: "team.member_added",
      _entity_type: "team",
      _entity_id: data.teamId,
      _diff: { user_id: data.userId, is_lead: data.isLead ?? false },
    });
    return { ok: true };
  });

export const removeTeamMember = createServerFn({ method: "POST" })
  .middleware([requirePermission("access.teams.write")])
  .inputValidator(
    z.object({ teamId: z.string().uuid(), userId: z.string().uuid() }),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean; error?: string }> => {
    const { supabase } = context;
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", data.teamId)
      .eq("user_id", data.userId);
    if (error) return { ok: false, error: error.message };
    await supabase.rpc("log_audit", {
      _action: "team.member_removed",
      _entity_type: "team",
      _entity_id: data.teamId,
      _diff: { user_id: data.userId },
    });
    return { ok: true };
  });

export const setTeamLead = createServerFn({ method: "POST" })
  .middleware([requirePermission("access.teams.write")])
  .inputValidator(
    z.object({ teamId: z.string().uuid(), userId: z.string().uuid() }),
  )
  .handler(async ({ context, data }): Promise<{ ok: boolean; error?: string }> => {
    const { supabase } = context;
    await supabase
      .from("team_members")
      .update({ is_lead: false })
      .eq("team_id", data.teamId);
    await supabase
      .from("team_members")
      .update({ is_lead: true })
      .eq("team_id", data.teamId)
      .eq("user_id", data.userId);
    const { error } = await supabase
      .from("teams")
      .update({ lead_user_id: data.userId })
      .eq("id", data.teamId);
    if (error) return { ok: false, error: error.message };
    await supabase.rpc("log_audit", {
      _action: "team.lead_set",
      _entity_type: "team",
      _entity_id: data.teamId,
      _diff: { user_id: data.userId },
    });
    return { ok: true };
  });

export const listCompanyMemberCandidates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ companyId: z.string().uuid() }))
  .handler(
    async ({
      context,
      data,
    }): Promise<{
      members: { user_id: string; full_name: string | null; avatar_url: string | null }[];
    }> => {
      const { supabase } = context;
      const { data: cm } = await supabase
        .from("company_members")
        .select("user_id")
        .eq("company_id", data.companyId);
      if (!cm || cm.length === 0) return { members: [] };
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in(
          "id",
          cm.map((m) => m.user_id),
        );
      return {
        members: (profiles ?? []).map((p) => ({
          user_id: p.id,
          full_name: p.full_name,
          avatar_url: p.avatar_url,
        })),
      };
    },
  );

// ============================================================
// Create platform user (admin/HR only)
// ============================================================

export interface CompanyLite {
  id: string;
  name: string;
  slug: string;
}

export const listCompaniesLite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ companies: CompanyLite[] }> => {
    const { supabase } = context;
    const { data } = await supabase
      .from("companies")
      .select("id, name, slug")
      .order("name", { ascending: true });
    return { companies: (data ?? []) as CompanyLite[] };
  });

export const createPlatformUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      email: z.string().email().max(254),
      fullName: z.string().min(1).max(120),
      password: z.string().min(8).max(120).optional(),
      role: z.enum([
        "super_admin",
        "admin",
        "hr",
        "manager",
        "employee",
        "sales",
        "support",
        "finance",
        "developer",
        "viewer",
      ]),
      companyId: z.string().uuid().nullable().optional(),
      sendInvite: z.boolean().optional(),
    }),
  )
  .handler(
    async ({
      context,
      data,
    }): Promise<{ ok: boolean; userId?: string; error?: string }> => {
      const { supabase, userId } = context;
      const { data: myRoles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      const allowed = (myRoles ?? []).some((r) =>
        ["super_admin", "admin", "hr"].includes(r.role),
      );
      if (!allowed) return { ok: false, error: "Not authorized." };

      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

      let newUserId: string | null = null;
      if (data.sendInvite) {
        const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          data.email,
          { data: { full_name: data.fullName } },
        );
        if (error || !invited.user) {
          return { ok: false, error: error?.message ?? "Failed to invite user." };
        }
        newUserId = invited.user.id;
      } else {
        const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
          email: data.email,
          password: data.password ?? undefined,
          email_confirm: true,
          user_metadata: { full_name: data.fullName },
        });
        if (error || !created.user) {
          return { ok: false, error: error?.message ?? "Failed to create user." };
        }
        newUserId = created.user.id;
      }

      // Ensure profile exists/updated
      await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: newUserId,
            full_name: data.fullName,
            company_id: data.companyId ?? null,
          },
          { onConflict: "id" },
        );

      // Replace any auto-assigned default role with the requested role
      await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
      const { error: roleErr } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUserId, role: data.role, granted_by: userId });
      if (roleErr) return { ok: false, error: roleErr.message };

      if (data.companyId) {
        await supabaseAdmin
          .from("company_members")
          .upsert(
            {
              company_id: data.companyId,
              user_id: newUserId,
              role: data.role,
              invited_by: userId,
            },
            { onConflict: "company_id,user_id" },
          );
      }

      await supabase.rpc("log_audit", {
        _action: "user.created",
        _entity_type: "user",
        _entity_id: newUserId,
        _diff: {
          email: data.email,
          role: data.role,
          company_id: data.companyId ?? null,
          via: data.sendInvite ? "invite" : "password",
        },
      });

      return { ok: true, userId: newUserId };
    },
  );
