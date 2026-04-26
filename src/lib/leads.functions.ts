import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const emailRe = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;

const LeadSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().regex(emailRe).max(320),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(5000).optional().or(z.literal("")),
  source: z.string().trim().max(100).optional(),
});

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => LeadSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("leads").insert({
      name: data.name,
      email: data.email,
      company: data.company || null,
      phone: data.phone || null,
      message: data.message || null,
      source: data.source ?? "contact",
    });
    if (error) {
      console.error("submitLead error", error);
      return { ok: false as const, error: "Failed to submit. Please try again." };
    }
    return { ok: true as const };
  });

const SubscriberSchema = z.object({
  email: z.string().trim().toLowerCase().regex(emailRe).max(320),
  source: z.string().trim().max(100).optional(),
});

export const subscribe = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SubscriberSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("subscribers").insert({
      email: data.email,
      source: data.source ?? "newsletter",
    });
    if (error && !error.message.includes("duplicate")) {
      console.error("subscribe error", error);
      return { ok: false as const, error: "Failed to subscribe." };
    }
    return { ok: true as const };
  });

const DemoSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().regex(emailRe).max(320),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  team_size: z.string().trim().max(50).optional(),
  preferred_time: z.string().trim().max(100).optional().or(z.literal("")),
  message: z.string().trim().max(5000).optional().or(z.literal("")),
  source: z.string().trim().max(100).optional(),
});

export const requestDemo = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => DemoSchema.parse(input))
  .handler(async ({ data }) => {
    const { error } = await supabase.from("demo_requests").insert({
      name: data.name,
      email: data.email,
      company: data.company || null,
      team_size: data.team_size || null,
      preferred_time: data.preferred_time || null,
      message: data.message || null,
      source: data.source ?? "demo",
    });
    if (error) {
      console.error("requestDemo error", error);
      return { ok: false as const, error: "Failed to submit. Please try again." };
    }
    return { ok: true as const };
  });
