import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ============================================================
// Leads (CRM pipeline)
// ============================================================

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "demo_booked",
  "trial",
  "negotiation",
  "won",
  "lost",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string | null;
  source: string | null;
  status: LeadStatus;
  plan_interest: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export const listLeads = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ leads: LeadRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("leads")
      .select(
        "id, name, email, company, phone, message, source, status, plan_interest, assigned_to, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("listLeads error", error);
      return { leads: [] };
    }
    return {
      leads: (data ?? []).map((l) => ({
        id: l.id,
        name: l.name,
        email: l.email,
        company: l.company,
        phone: l.phone,
        message: l.message,
        source: l.source,
        status: (l.status as LeadStatus) ?? "new",
        plan_interest: l.plan_interest,
        assigned_to: l.assigned_to,
        created_at: l.created_at as string,
        updated_at: l.updated_at as string,
      })),
    };
  });

const UpdateLeadSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(LEAD_STATUSES).optional(),
  notes: z.string().max(5000).optional(),
  plan_interest: z.string().max(50).optional(),
});

export const updateLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateLeadSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const patch: {
      status?: LeadStatus;
      notes?: string;
      plan_interest?: string;
    } = {};
    if (data.status) patch.status = data.status;
    if (typeof data.notes === "string") patch.notes = data.notes;
    if (typeof data.plan_interest === "string") patch.plan_interest = data.plan_interest;
    const { error } = await supabase.from("leads").update(patch).eq("id", data.id);
    if (error) {
      console.error("updateLead error", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

export const listDemoRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("demo_requests")
      .select(
        "id, name, email, company, team_size, preferred_time, message, source, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("listDemoRequests error", error);
      return { demos: [] };
    }
    return { demos: data ?? [] };
  });

// ============================================================
// Contacts
// ============================================================

export const CONTACT_STAGES = [
  "subscriber",
  "lead",
  "mql",
  "sql",
  "customer",
  "evangelist",
  "other",
] as const;
export type ContactStage = (typeof CONTACT_STAGES)[number];

export interface ContactRow {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  company_name: string | null;
  company_id: string | null;
  stage: ContactStage;
  created_at: string;
}

export const listContacts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ contacts: ContactRow[] }> => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("contacts")
      .select(
        "id, full_name, email, phone, title, company_name, company_id, stage, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error("listContacts error", error);
      return { contacts: [] };
    }
    return {
      contacts: (data ?? []).map((c) => ({
        id: c.id,
        full_name: c.full_name,
        email: c.email,
        phone: c.phone,
        title: c.title,
        company_name: c.company_name,
        company_id: c.company_id,
        stage: (c.stage as ContactStage) ?? "lead",
        created_at: c.created_at as string,
      })),
    };
  });

const CreateContactSchema = z.object({
  full_name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(320).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  title: z.string().trim().max(120).optional().or(z.literal("")),
  company_name: z.string().trim().max(200).optional().or(z.literal("")),
  stage: z.enum(CONTACT_STAGES).default("lead"),
});

export const createContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateContactSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("contacts").insert({
      full_name: data.full_name,
      email: data.email || null,
      phone: data.phone || null,
      title: data.title || null,
      company_name: data.company_name || null,
      stage: data.stage,
    });
    if (error) {
      console.error("createContact error", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

const DeleteContactSchema = z.object({ id: z.string().uuid() });

export const deleteContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => DeleteContactSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase.from("contacts").delete().eq("id", data.id);
    if (error) {
      console.error("deleteContact error", error);
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });
