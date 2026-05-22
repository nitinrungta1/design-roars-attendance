import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { PageHeader, PageBody } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getSeoSettings, patchSeoSettings } from "@/lib/cms.functions";
import { seo } from "@/lib/seo";
import { SeoTabs } from "./_authenticated.admin.cms.seo.services";

export const Route = createFileRoute("/_authenticated/admin/cms/seo")({
  head: () => seo({ title: "SEO | Admin", description: "Global SEO config & sitemap.", kind: "product", path: "/admin/cms/seo", noindex: true }),
  component: SeoPage,
});

function SeoPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "seo"], queryFn: () => getSeoSettings() });
  const [titleTpl, setTitleTpl] = useState("");
  const [desc, setDesc] = useState("");
  const [og, setOg] = useState("");
  const [robots, setRobots] = useState("");
  const [sitemap, setSitemap] = useState(true);

  useEffect(() => {
    if (data?.settings) {
      setTitleTpl(data.settings.title_template ?? "");
      setDesc(data.settings.default_description ?? "");
      setOg(data.settings.default_og_image ?? "");
      setRobots(data.settings.robots_txt ?? "");
      setSitemap(data.settings.sitemap_enabled);
    }
  }, [data]);

  const mut = useMutation({
    mutationFn: () => patchSeoSettings({ data: {
      title_template: titleTpl,
      default_description: desc || null,
      default_og_image: og || null,
      robots_txt: robots || null,
      sitemap_enabled: sitemap,
    }}),
    onSuccess: (res) => {
      if (res.ok) { toast.success("SEO settings saved"); qc.invalidateQueries({ queryKey: ["admin", "seo"] }); }
      else toast.error(res.error);
    },
  });

  return (
    <>
      <PageHeader eyebrow="Content" title="SEO" description="Global title template, default description, robots & sitemap." breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "SEO" }]} />
      <PageBody className="max-w-3xl space-y-4">
        <SeoTabs current="settings" />
        <div>
          <Label>Title template</Label>
          <Input value={titleTpl} onChange={(e) => setTitleTpl(e.target.value)} placeholder="%s | Oqlio" />
          <p className="mt-1 text-xs text-muted-foreground">Use %s to interpolate the page title.</p>
        </div>
        <div>
          <Label>Default description</Label>
          <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
        </div>
        <div>
          <Label>Default OG image URL</Label>
          <Input value={og} onChange={(e) => setOg(e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <Label>robots.txt overrides</Label>
          <Textarea value={robots} onChange={(e) => setRobots(e.target.value)} rows={5} className="font-mono text-xs" />
        </div>
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <Label htmlFor="sitemap">Sitemap enabled</Label>
          <Switch id="sitemap" checked={sitemap} onCheckedChange={setSitemap} />
        </div>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
          {mut.isPending ? "Saving…" : "Save changes"}
        </Button>
      </PageBody>
    </>
  );
}
