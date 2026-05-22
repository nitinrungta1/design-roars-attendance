import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import {
  listSeoOverrides, upsertSeoOverride, deleteSeoOverride,
  listSeoServices, type OverrideKind, type OverrideRow,
} from "@/lib/seo-admin.functions";
import { CITIES } from "@/lib/seo/cities";
import { seo } from "@/lib/seo";
import { SeoTabs } from "./_authenticated.admin.cms.seo.services";

export const Route = createFileRoute("/_authenticated/admin/cms/seo/overrides")({
  head: () => seo({ title: "SEO Overrides | Admin", description: "Per-page SEO overrides.", kind: "product", path: "/admin/cms/seo/overrides", noindex: true }),
  component: OverridesPage,
});

function OverridesPage() {
  const [kind, setKind] = useState<OverrideKind>("city");
  return (
    <>
      <PageHeader
        eyebrow="Content / SEO"
        title="Page overrides"
        description="Hand-tune meta, hero copy, and FAQs for specific city / industry / city+industry pages."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "SEO", to: "/admin/cms/seo" }, { label: "Overrides" }]}
      />
      <PageBody>
        <SeoTabs current="overrides" />
        <Tabs value={kind} onValueChange={(v) => setKind(v as OverrideKind)}>
          <TabsList>
            <TabsTrigger value="city">Service × City</TabsTrigger>
            <TabsTrigger value="industry">Service × Industry</TabsTrigger>
            <TabsTrigger value="industry-city">Service × Industry × City</TabsTrigger>
          </TabsList>
          <TabsContent value={kind} className="mt-4">
            <OverrideList kind={kind} />
          </TabsContent>
        </Tabs>
      </PageBody>
    </>
  );
}

type Draft = Partial<OverrideRow> & { _faqsJson?: string; _testimonialsJson?: string; _nearbyJson?: string };

function emptyDraft(): Draft {
  return {
    service_id: "", metaTitle: "", metaDescription: "", h1: "", heroIntro: "", ctaText: "",
    body_html: "", status: "draft",
    _faqsJson: "[]", _testimonialsJson: "[]", _nearbyJson: "[]",
  };
}

function OverrideList({ kind }: { kind: OverrideKind }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "seo-overrides", kind], queryFn: () => listSeoOverrides({ data: { kind } }) });
  const services = useQuery({ queryKey: ["admin", "seo-services"], queryFn: () => listSeoServices() });
  const rows = data?.rows ?? [];
  const svcOptions = services.data?.services ?? [];
  const [draft, setDraft] = useState<Draft | null>(null);

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const faqs = d._faqsJson ? JSON.parse(d._faqsJson) : null;
      const testimonials = d._testimonialsJson ? JSON.parse(d._testimonialsJson) : null;
      const nearby = d._nearbyJson ? JSON.parse(d._nearbyJson) : null;
      return upsertSeoOverride({ data: {
        kind, id: d.id, service_id: d.service_id!,
        city_slug: d.city_slug || undefined, industry_slug: d.industry_slug || undefined,
        metaTitle: d.metaTitle || null, metaDescription: d.metaDescription || null,
        h1: d.h1 || null, heroIntro: d.heroIntro || null, ctaText: d.ctaText || null,
        body_html: d.body_html || null,
        faqs: faqs && faqs.length ? faqs : null,
        testimonials: testimonials && testimonials.length ? testimonials : null,
        nearby_slugs: kind === "city" || kind === "industry-city" ? (nearby && nearby.length ? nearby : null) : null,
        status: d.status ?? "draft",
      }});
    },
    onSuccess: (res) => {
      if (res.ok) { toast.success("Saved"); setDraft(null); qc.invalidateQueries({ queryKey: ["admin", "seo-overrides", kind] }); }
      else toast.error(res.error ?? "Save failed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteSeoOverride({ data: { kind, id } }),
    onSuccess: (res) => {
      if (res.ok) { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "seo-overrides", kind] }); }
      else toast.error(res.error ?? "Delete failed");
    },
  });

  return (
    <>
      <div className="mb-3 flex justify-end">
        <Button size="sm" onClick={() => setDraft(emptyDraft())}><Plus className="mr-1 h-4 w-4" /> New override</Button>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState title="No overrides" description="Add hand-crafted copy for specific combinations." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Service</th>
                {kind !== "industry" && <th className="px-4 py-3">City</th>}
                {kind !== "city" && <th className="px-4 py-3">Industry</th>}
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const svc = svcOptions.find((s) => s.id === r.service_id);
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-4 py-3">{svc?.name ?? r.service_id.slice(0, 8)}</td>
                    {kind !== "industry" && <td className="px-4 py-3 font-mono text-xs">{r.city_slug}</td>}
                    {kind !== "city" && <td className="px-4 py-3 font-mono text-xs">{r.industry_slug}</td>}
                    <td className="px-4 py-3 max-w-xs truncate">{r.metaTitle ?? <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-3 text-xs">{r.status}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => setDraft({
                        ...r,
                        _faqsJson: JSON.stringify(r.faqs ?? [], null, 2),
                        _testimonialsJson: JSON.stringify(r.testimonials ?? [], null, 2),
                        _nearbyJson: JSON.stringify(r.nearby_slugs ?? [], null, 2),
                      })}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete?")) del.mutate(r.id); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{draft?.id ? "Edit override" : "New override"}</DialogTitle></DialogHeader>
          {draft && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Service">
                <Select value={draft.service_id ?? ""} onValueChange={(v) => setDraft({ ...draft, service_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Pick service" /></SelectTrigger>
                  <SelectContent>{svcOptions.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={draft.status ?? "draft"} onValueChange={(v) => setDraft({ ...draft, status: v as "draft" | "published" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              {kind !== "industry" && (
                <Field label="City">
                  <Select value={draft.city_slug ?? ""} onValueChange={(v) => setDraft({ ...draft, city_slug: v })}>
                    <SelectTrigger><SelectValue placeholder="Pick city" /></SelectTrigger>
                    <SelectContent>{CITIES.map((c) => <SelectItem key={c.slug} value={c.slug}>{c.city}, {c.state}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              )}
              {kind !== "city" && (
                <Field label="Industry slug"><Input value={draft.industry_slug ?? ""} onChange={(e) => setDraft({ ...draft, industry_slug: e.target.value })} placeholder="restaurants" /></Field>
              )}
              <Field label="Meta title" full><Input value={draft.metaTitle ?? ""} onChange={(e) => setDraft({ ...draft, metaTitle: e.target.value })} /></Field>
              <Field label="Meta description" full><Textarea rows={2} value={draft.metaDescription ?? ""} onChange={(e) => setDraft({ ...draft, metaDescription: e.target.value })} /></Field>
              <Field label="H1" full><Input value={draft.h1 ?? ""} onChange={(e) => setDraft({ ...draft, h1: e.target.value })} /></Field>
              <Field label="Hero intro" full><Textarea rows={3} value={draft.heroIntro ?? ""} onChange={(e) => setDraft({ ...draft, heroIntro: e.target.value })} /></Field>
              <Field label="CTA text" full><Input value={draft.ctaText ?? ""} onChange={(e) => setDraft({ ...draft, ctaText: e.target.value })} /></Field>
              <Field label="Body HTML" full><Textarea rows={6} className="font-mono text-xs" value={draft.body_html ?? ""} onChange={(e) => setDraft({ ...draft, body_html: e.target.value })} /></Field>
              <Field label="FAQs (JSON array of {q,a})" full><Textarea rows={4} className="font-mono text-xs" value={draft._faqsJson ?? ""} onChange={(e) => setDraft({ ...draft, _faqsJson: e.target.value })} /></Field>
              <Field label="Testimonials (JSON)" full><Textarea rows={3} className="font-mono text-xs" value={draft._testimonialsJson ?? ""} onChange={(e) => setDraft({ ...draft, _testimonialsJson: e.target.value })} /></Field>
              {(kind === "city" || kind === "industry-city") && (
                <Field label="Nearby city slugs (JSON string array)" full><Textarea rows={3} className="font-mono text-xs" value={draft._nearbyJson ?? ""} onChange={(e) => setDraft({ ...draft, _nearbyJson: e.target.value })} /></Field>
              )}
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
