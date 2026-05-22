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

import { listSeoIndustries, upsertSeoIndustry, deleteSeoIndustry } from "@/lib/seo-admin.functions";
import type { SeoIndustry } from "@/lib/seo/types";
import { seo } from "@/lib/seo";
import { SeoTabs } from "./_authenticated.admin.cms.seo.services";

export const Route = createFileRoute("/_authenticated/admin/cms/seo/industries")({
  head: () => seo({ title: "SEO Industries | Admin", description: "Programmatic SEO industries.", kind: "product", path: "/admin/cms/seo/industries", noindex: true }),
  component: IndustriesPage,
});

type Draft = Partial<SeoIndustry> & { _faqsJson?: string; _painJson?: string; _useJson?: string };

const EMPTY: Draft = {
  slug: "", name: "", noun: "", hero_blurb: "",
  pain_points: [], use_cases: [], default_faqs: [], status: "draft",
  _faqsJson: "[]", _painJson: "[]", _useJson: "[]",
};

function IndustriesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "seo-industries"], queryFn: () => listSeoIndustries() });
  const rows = data?.industries ?? [];
  const [draft, setDraft] = useState<Draft | null>(null);

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const faqs = JSON.parse(d._faqsJson || "[]");
      const pain = JSON.parse(d._painJson || "[]");
      const uses = JSON.parse(d._useJson || "[]");
      return upsertSeoIndustry({ data: {
        id: d.id, slug: d.slug!, name: d.name!, noun: d.noun!,
        hero_blurb: d.hero_blurb || null,
        pain_points: pain, use_cases: uses, default_faqs: faqs,
        status: d.status ?? "draft",
      }});
    },
    onSuccess: (res) => {
      if ("ok" in res && res.ok) { toast.success("Saved"); setDraft(null); qc.invalidateQueries({ queryKey: ["admin", "seo-industries"] }); }
      else toast.error("error" in res ? res.error : "Save failed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteSeoIndustry({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "seo-industries"] }); }
      else toast.error(res.error ?? "Delete failed");
    },
  });

  return (
    <>
      <PageHeader
        eyebrow="Content / SEO"
        title="Industries"
        description="Vertical/industry templates (restaurants, hospitals, construction…)."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "SEO", to: "/admin/cms/seo" }, { label: "Industries" }]}
        actions={<Button onClick={() => setDraft({ ...EMPTY })}><Plus className="mr-1 h-4 w-4" /> New industry</Button>}
      />
      <PageBody>
        <SeoTabs current="industries" />
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <EmptyState title="No industries yet" />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
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
                      <Button size="sm" variant="ghost" onClick={() => setDraft({ ...r, _faqsJson: JSON.stringify(r.default_faqs ?? [], null, 2), _painJson: JSON.stringify(r.pain_points ?? [], null, 2), _useJson: JSON.stringify(r.use_cases ?? [], null, 2) })}>
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
          <DialogHeader><DialogTitle>{draft?.id ? "Edit industry" : "New industry"}</DialogTitle></DialogHeader>
          {draft && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Slug"><Input value={draft.slug ?? ""} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} placeholder="restaurants" /></Field>
              <Field label="Name"><Input value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Restaurants" /></Field>
              <Field label="Noun"><Input value={draft.noun ?? ""} onChange={(e) => setDraft({ ...draft, noun: e.target.value })} placeholder="restaurant teams" /></Field>
              <Field label="Status">
                <Select value={draft.status ?? "draft"} onValueChange={(v) => setDraft({ ...draft, status: v as "draft" | "published" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Hero blurb" full><Textarea rows={3} value={draft.hero_blurb ?? ""} onChange={(e) => setDraft({ ...draft, hero_blurb: e.target.value })} /></Field>
              <Field label="Pain points (JSON string array)" full><Textarea rows={5} className="font-mono text-xs" value={draft._painJson ?? ""} onChange={(e) => setDraft({ ...draft, _painJson: e.target.value })} /></Field>
              <Field label="Use cases (JSON string array)" full><Textarea rows={5} className="font-mono text-xs" value={draft._useJson ?? ""} onChange={(e) => setDraft({ ...draft, _useJson: e.target.value })} /></Field>
              <Field label="Default FAQs (JSON array of {q,a})" full><Textarea rows={5} className="font-mono text-xs" value={draft._faqsJson ?? ""} onChange={(e) => setDraft({ ...draft, _faqsJson: e.target.value })} /></Field>
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
