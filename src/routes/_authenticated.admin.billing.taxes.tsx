import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Percent, Plus } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, StatCard } from "@/components/admin/data-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { listTaxRates, createTaxRate, toggleTaxRate } from "@/lib/billing.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/billing/taxes")({
  head: () =>
    seo({
      title: "Taxes | Admin",
      description: "Tax rules and rates.",
      kind: "product",
      path: "/admin/billing/taxes",
      noindex: true,
    }),
  component: TaxesPage,
});

function TaxesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "tax-rates"],
    queryFn: () => listTaxRates(),
  });

  const toggleMut = useMutation({
    mutationFn: (vars: { id: string; is_active: boolean }) => toggleTaxRate({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) qc.invalidateQueries({ queryKey: ["admin", "tax-rates"] });
      else toast.error(res.error);
    },
  });

  const rates = data?.taxRates ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Sales & Billing"
        title="Taxes"
        description="GST, VAT, sales tax — applied automatically at invoice time."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Taxes" }]}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New tax rate
              </Button>
            </DialogTrigger>
            <CreateTaxDialog onClose={() => setOpen(false)} />
          </Dialog>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Tax rates" value={rates.length} />
          <StatCard label="Active" value={rates.filter((r) => r.is_active).length} tone="success" />
          <StatCard label="Countries covered" value={new Set(rates.map((r) => r.country).filter(Boolean)).size} />
        </div>

        <DataTable
          headers={["Name", "Rate", "Country", "Region", "Inclusive", "Active"]}
          empty={
            !isLoading && rates.length === 0 ? (
              <EmptyState
                icon={Percent}
                title="No tax rates"
                description="Add your first tax rule (e.g. India GST 18%)."
              />
            ) : null
          }
        >
          {rates.map((r) => (
            <Tr key={r.id}>
              <Td className="font-medium">{r.name}</Td>
              <Td mono>{r.rate}%</Td>
              <Td>{r.country ?? "—"}</Td>
              <Td>{r.region ?? "—"}</Td>
              <Td>{r.inclusive ? "Yes" : "No"}</Td>
              <Td>
                <Switch
                  checked={r.is_active}
                  onCheckedChange={(v) => toggleMut.mutate({ id: r.id, is_active: v })}
                />
              </Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>
    </>
  );
}

function CreateTaxDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [rate, setRate] = useState(0);
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [inclusive, setInclusive] = useState(false);

  const mut = useMutation({
    mutationFn: () =>
      createTaxRate({
        data: { name, rate, country, region, inclusive },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Tax rate added");
        qc.invalidateQueries({ queryKey: ["admin", "tax-rates"] });
        onClose();
      } else toast.error(res.error);
    },
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New tax rate</DialogTitle>
        <DialogDescription>Define a tax rule applied to matching invoices.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="GST 18%" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Rate (%)</Label>
            <Input type="number" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
          </div>
          <div className="flex items-center justify-between rounded-md border border-border px-3">
            <Label htmlFor="incl">Inclusive</Label>
            <Switch id="incl" checked={inclusive} onCheckedChange={setInclusive} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Country (ISO-2)</Label>
            <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="IN" maxLength={2} />
          </div>
          <div>
            <Label>Region</Label>
            <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="KA" />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!name || mut.isPending} onClick={() => mut.mutate()}>
          {mut.isPending ? "Saving…" : "Add"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
