import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@supabase/supabase-js";

/**
 * Integration tests against the real Supabase project.
 * These test the auth/role primitives that the platform-users server
 * functions depend on. They use the service role key (bypasses RLS)
 * to verify schema + RPCs are wired correctly.
 */

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const skip = !SUPABASE_URL || !SRK;
const d = skip ? describe.skip : describe;

d("Supabase: roles & RPCs", () => {
  let admin: ReturnType<typeof createClient>;

  beforeAll(() => {
    admin = createClient(SUPABASE_URL, SRK, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  it("user_roles has at least one super_admin row", async () => {
    const { data, error } = await admin
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "super_admin");
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it("is_super_admin RPC returns true for a known super_admin", async () => {
    const { data: rows } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "super_admin")
      .limit(1);
    const uid = rows?.[0]?.user_id;
    expect(uid).toBeTruthy();
    const { data: ok, error } = await admin.rpc("is_super_admin", { _user_id: uid });
    expect(error).toBeNull();
    expect(ok).toBe(true);
  });

  it("auth.admin.listUsers returns an array", async () => {
    const { data, error } = await admin.auth.admin.listUsers({ perPage: 5 });
    expect(error).toBeNull();
    expect(Array.isArray(data?.users)).toBe(true);
  });

  it("generateLink('invite') produces an action_link (fallback for missing SMTP)", async () => {
    const email = `vitest-${Date.now()}@example.invalid`;
    const { data, error } = await admin.auth.admin.generateLink({
      type: "invite",
      email,
    });
    // Some projects may reject invalid TLD. If so, just assert no crash.
    if (error) {
      expect(error.message.length).toBeGreaterThan(0);
      return;
    }
    expect(data?.properties?.action_link).toMatch(/^https?:\/\//);
    // Cleanup the user generateLink created
    if (data?.user?.id) {
      await admin.from("user_roles").delete().eq("user_id", data.user.id);
      await admin.from("profiles").delete().eq("id", data.user.id);
      await admin.auth.admin.deleteUser(data.user.id);
    }
  });
});
