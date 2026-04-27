import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/analytics/settings")({
  head: () => seo({ title: "Tracking Settings", description: "Configure analytics tracking.", kind: "product", path: "/admin/analytics/settings", noindex: true }),
  component: SettingsPage,
});

type Settings = {
  meta_pixel_id: string | null;
  ga4_id: string | null;
  gtm_id: string | null;
  clarity_id: string | null;
  cookie_consent_required: boolean;
  retention_days: number;
};

function SettingsPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("analytics_settings").select("*").eq("id", 1).maybeSingle();
      if (data) setS(data as unknown as Settings);
      else setS({ meta_pixel_id: "", ga4_id: "", gtm_id: "", clarity_id: "", cookie_consent_required: false, retention_days: 365 });
    })();
  }, []);

  if (!s) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("analytics_settings").update({
      meta_pixel_id: s.meta_pixel_id || null,
      ga4_id: s.ga4_id || null,
      gtm_id: s.gtm_id || null,
      clarity_id: s.clarity_id || null,
      cookie_consent_required: s.cookie_consent_required,
      retention_days: s.retention_days,
    }).eq("id", 1);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Tracking settings saved");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Optional tracking pixels</h2>
          <p className="mt-1 text-sm text-muted-foreground">First-party tracking always works. Add IDs below to also fire events to these third-party tools.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="meta">Meta Pixel ID</Label>
          <Input id="meta" placeholder="123456789012345" value={s.meta_pixel_id ?? ""} onChange={(e) => setS({ ...s, meta_pixel_id: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ga4">Google Analytics 4 ID</Label>
          <Input id="ga4" placeholder="G-XXXXXXXXXX" value={s.ga4_id ?? ""} onChange={(e) => setS({ ...s, ga4_id: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="gtm">Google Tag Manager ID</Label>
          <Input id="gtm" placeholder="GTM-XXXXXXX" value={s.gtm_id ?? ""} onChange={(e) => setS({ ...s, gtm_id: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clarity">Microsoft Clarity ID</Label>
          <Input id="clarity" placeholder="abc123def4" value={s.clarity_id ?? ""} onChange={(e) => setS({ ...s, clarity_id: e.target.value })} />
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold">Privacy</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label>Require cookie consent</Label>
            <p className="text-xs text-muted-foreground mt-1">When on, third-party pixels only load after consent.</p>
          </div>
          <Switch checked={s.cookie_consent_required} onCheckedChange={(v) => setS({ ...s, cookie_consent_required: v })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ret">Retention (days)</Label>
          <Input id="ret" type="number" min={30} max={3650} value={s.retention_days} onChange={(e) => setS({ ...s, retention_days: Number(e.target.value) || 365 })} />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button>
      </div>
    </div>
  );
}
