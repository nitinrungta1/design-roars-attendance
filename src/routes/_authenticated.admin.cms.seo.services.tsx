import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { listSeoServices, upsertSeoService, deleteSeoService } from "@/lib/seo-admin.functions";
import type { SeoService } from "@/lib/seo/types";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/cms/seo/services")({
  head: () => seo({ title: "SEO Services | Admin", description: "Programmatic SEO services.", kind: "product", path: "/admin/cms/seo/services", noindex: true }),
  component: ServicesPage,
});

type Draft = Partial<SeoService> & { _faqsJson?: string; _testimonialsJson?: string };

const EMPTY: Draft = {
  slug: "", name: "", noun: "", tagline: "",
  default_meta_title_tpl: "", default_meta_description_tpl: "",
  default_h1_tpl: "", default_hero_intro_tpl: "", default_cta_text_tpl: "",
  default_faqs: [], default_testimonials: [], status: "draft",
  _faqsJson: "[]", _testimonialsJson: "[]",
};

function ServicesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "seo-services"], queryFn: () => listSeoServices() });
  const rows = data?.services ?? [];
  const [draft, setDraft] = useState<Draft | null>(null);

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const faqs = JSON.parse(d._faqsJson || "[]");
      const testimonials = JSON.parse(d._testimonialsJson || "[]");
      return upsertSeoService({ data: {
        id: d.id, slug: d.slug!, name: d.name!, noun: d.noun!,
        tagline: d.tagline || null,
        default_meta_title_tpl: d.default_meta_title_tpl || null,
        default_meta_description_tpl: d.default_meta_description_tpl || null,
        default_h1_tpl: d.default_h1_tpl || null,
        default_hero_intro_tpl: d.default_hero_intro_tpl || null,
        default_cta_text_tpl: d.default_cta_text_tpl || null,
        default_faqs: faqs, default_testimonials: testimonials,
        status: d.status ?? "draft",
      }});
    },
    onSuccess: (res) => {
      if ("ok" in res && res.ok) { toast.success("Saved"); setDraft(null); qc.invalidateQueries({ queryKey: ["admin", "seo-services"] }); }
      else toast.error("error" in res ? res.error : "Save failed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteSeoService({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "seo-services"] }); }
      else toast.error(res.error ?? "Delete failed");
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Content / SEO"
        title="Services"
        description="Programmatic SEO service templates (attendance, GPS, etc.)."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "SEO", to: "/admin/cms/seo" }, { label: "Services" }]}
        actions={<Button onClick={() => setDraft({ ...EMPTY })}><Plus className="mr-1 h-4 w-4" /> New service</Button>}
      />
      <PageBody>
        <SeoTabs current="services" />
        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState title="No services yet" description="Create your first SEO service template." />
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.slug}</td>
                    <td className="px-4 py-3 text-xs">{r.status}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setDraft({ ...r, _faqsJson: JSON.stringify(r.default_faqs ?? [], null, 2), _testimonialsJson: JSON.stringify(r.default_testimonials ?? [], null, 2) })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm(`Delete ${r.slug}?`)) del.mutate(r.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageBody>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{draft?.id ? "Edit service" : "New service"}</DialogTitle></DialogHeader>
          {draft && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Slug"><Input value={draft.slug ?? ""} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="attendance-management-software" /></Field>
              <Field label="Name"><Input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <Field label="Noun"><Input value={draft.noun ?? ""} onChange={(e) => setDraft({ ...draft, noun: e.target.value })} placeholder="attendance software" /></Field>
              <Field label="Status">
                <Select value={draft.status ?? "draft"} onValueChange={(v) => setDraft({ ...draft, status: v as "draft" | "published" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Tagline" full><Input value={draft.tagline ?? ""} onChange={(e) => setDraft({ ...draft, tagline: e.target.value })} /></Field>
              <Field label="Meta title template" full><Input value={draft.default_meta_title_tpl ?? ""} onChange={(e) => setDraft({ ...draft, default_meta_title_tpl: e.target.value })} placeholder="Best {service} in {city} (2026)" /></Field>
              <Field label="Meta description template" full><Textarea rows={2} value={draft.default_meta_description_tpl ?? ""} onChange={(e) => setDraft({ ...draft, default_meta_description_tpl: e.target.value })} /></Field>
              <Field label="H1 template" full><Input value={draft.default_h1_tpl ?? ""} onChange={(e) => setDraft({ ...draft, default_h1_tpl: e.target.value })} /></Field>
              <Field label="Hero intro template" full><Textarea rows={3} value={draft.default_hero_intro_tpl ?? ""} onChange={(e) => setDraft({ ...draft, default_hero_intro_tpl: e.target.value })} /></Field>
              <Field label="CTA text template" full><Input value={draft.default_cta_text_tpl ?? ""} onChange={(e) => setDraft({ ...draft, default_cta_text_tpl: e.target.value })} /></Field>
              <Field label="Default FAQs (JSON array of {q,a})" full><Textarea rows={5} className="font-mono text-xs" value={draft._faqsJson ?? ""} onChange={(e) => setDraft({ ...draft, _faqsJson: e.target.value })} /></Field>
              <Field label="Default testimonials (JSON array of {quote,name,role})" full><Textarea rows={4} className="font-mono text-xs" value={draft._testimonialsJson ?? ""} onChange={(e) => setDraft({ ...draft, _testimonialsJson: e.target.value })} /></Field>
              <p className="sm:col-span-2 text-xs text-muted-foreground">Template variables: <code>{`{service}`}</code>, <code>{`{city}`}</code>, <code>{`{state}`}</code>, <code>{`{industry}`}</code></p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>Cancel</Button>
            <Button onClick={() => draft && save.mutate(draft)} disabled={save.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

export function SeoTabs({ current }: { current: "settings" | "services" | "industries" | "overrides" }) {
  const tabs = [
    { id: "settings", to: "/admin/cms/seo", label: "Settings" },
    { id: "services", to: "/admin/cms/seo/services", label: "Services" },
    { id: "industries", to: "/admin/cms/seo/industries", label: "Industries" },
    { id: "overrides", to: "/admin/cms/seo/overrides", label: "Page overrides" },
  ] as const;
  return (
    <div className="mb-4 flex flex-wrap gap-1 rounded-xl border border-border bg-card/30 p-1 text-sm">
      {tabs.map((t) => (
        <Link key={t.id} to={t.to} className={`rounded-lg px-3 py-1.5 ${current === t.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{t.label}</Link>
      ))}
    </div>
  );
}
