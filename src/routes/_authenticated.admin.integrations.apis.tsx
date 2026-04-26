import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Key, Plus, Copy } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard, fmtRelative } from "@/components/admin/data-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { listApiKeys, createApiKey, revokeApiKey } from "@/lib/integrations.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/integrations/apis")({
  head: () => seo({ title: "API keys | Admin", description: "Issue & revoke API keys.", kind: "product", path: "/admin/integrations/apis", noindex: true }),
  component: ApisPage,
});

function ApisPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const { data, isLoading } = useQuery({ queryKey: ["admin", "api-keys"], queryFn: () => listApiKeys() });
  const create = useMutation({
    mutationFn: () => createApiKey({ data: { label, scopes: ["read"] } }),
    onSuccess: (res) => {
      if (res.ok) { setToken(res.token); qc.invalidateQueries({ queryKey: ["admin", "api-keys"] }); }
      else toast.error(res.error);
    },
  });
  const revoke = useMutation({
    mutationFn: (id: string) => revokeApiKey({ data: { id } }),
    onSuccess: (res) => { if (res.ok) qc.invalidateQueries({ queryKey: ["admin", "api-keys"] }); else toast.error(res.error); },
  });
  const rows = data?.keys ?? [];

  return (
    <>
      <PageHeader eyebrow="Integrations" title="API Keys" description="Issue tokens for external integrations and revoke compromised ones."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "APIs" }]}
        actions={
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setLabel(""); setToken(null); } }}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> New key</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create API key</DialogTitle>
                <DialogDescription>Tokens are shown once — store them securely.</DialogDescription>
              </DialogHeader>
              {!token ? (
                <div className="space-y-3">
                  <div><Label>Label</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Zapier integration" /></div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Token (copy now — it won't be shown again)</Label>
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 p-2">
                    <code className="flex-1 truncate font-mono text-xs">{token}</code>
                    <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(token); toast.success("Copied"); }}><Copy className="h-3 w-3" /></Button>
                  </div>
                </div>
              )}
              <DialogFooter>
                {!token ? (
                  <>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button disabled={!label || create.isPending} onClick={() => create.mutate()}>{create.isPending ? "Creating…" : "Create"}</Button>
                  </>
                ) : (
                  <Button onClick={() => setOpen(false)}>Done</Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        } />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Total" value={rows.length} />
          <StatCard label="Active" value={rows.filter((k) => k.is_active).length} tone="success" />
          <StatCard label="Revoked" value={rows.filter((k) => !k.is_active).length} />
        </div>
        <DataTable headers={["Label", "Prefix", "Scopes", "Last used", "Created", ""]}
          empty={!isLoading && rows.length === 0 ? <EmptyState icon={Key} title="No API keys yet" description="Issue your first token to integrate Punchly with external systems." /> : null}>
          {rows.map((k) => (
            <Tr key={k.id}>
              <Td className="font-medium">{k.label}</Td>
              <Td mono>{k.prefix}…</Td>
              <Td className="text-xs text-muted-foreground">{k.scopes.join(", ") || "—"}</Td>
              <Td className="text-muted-foreground">{k.last_used_at ? fmtRelative(k.last_used_at) : "—"}</Td>
              <Td className="text-muted-foreground">{fmtRelative(k.created_at)}</Td>
              <Td>{k.is_active && <Button size="sm" variant="ghost" onClick={() => revoke.mutate(k.id)}>Revoke</Button>}</Td>
            </Tr>
          ))}
          {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</td></tr>}
        </DataTable>
      </PageBody>
    </>
  );
}
