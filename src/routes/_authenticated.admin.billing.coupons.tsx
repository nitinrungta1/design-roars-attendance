import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tag, Plus } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, fmtDate, StatCard } from "@/components/admin/data-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { listCoupons, createCoupon, toggleCoupon } from "@/lib/billing.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/billing/coupons")({
  head: () =>
    seo({
      title: "Coupons | Admin",
      description: "Discount codes.",
      kind: "product",
      path: "/admin/billing/coupons",
      noindex: true,
    }),
  component: CouponsPage,
});

function CouponsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: () => listCoupons(),
  });

  const toggleMut = useMutation({
    mutationFn: (vars: { id: string; is_active: boolean }) => toggleCoupon({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
      else toast.error(res.error);
    },
  });

  const coupons = data?.coupons ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Sales & Billing"
        title="Coupons"
        description="Discount codes for promos, partner deals, and win-back campaigns."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Coupons" }]}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New coupon
              </Button>
            </DialogTrigger>
            <CreateCouponDialog onClose={() => setOpen(false)} />
          </Dialog>
        }
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Total coupons" value={coupons.length} />
          <StatCard label="Active" value={coupons.filter((c) => c.is_active).length} tone="success" />
          <StatCard
            label="Total redemptions"
            value={coupons.reduce((a, c) => a + c.redeemed_count, 0)}
          />
        </div>

        <DataTable
          headers={["Code", "Discount", "Used", "Limit", "Expires", "Active"]}
          empty={
            !isLoading && coupons.length === 0 ? (
              <EmptyState
                icon={Tag}
                title="No coupons yet"
                description="Create your first promo code."
              />
            ) : null
          }
        >
          {coupons.map((c) => (
            <Tr key={c.id}>
              <Td>
                <div className="font-mono text-sm font-semibold">{c.code}</div>
                {c.description && (
                  <div className="text-xs text-muted-foreground">{c.description}</div>
                )}
              </Td>
              <Td>
                <Badge variant="secondary" className="rounded-full">
                  {c.kind === "percent" ? `${c.value}% off` : `${c.currency ?? "INR"} ${c.value} off`}
                </Badge>
              </Td>
              <Td mono>{c.redeemed_count}</Td>
              <Td mono>{c.max_redemptions ?? "∞"}</Td>
              <Td className="text-muted-foreground">
                {c.expires_at ? fmtDate(c.expires_at) : "Never"}
              </Td>
              <Td>
                <Switch
                  checked={c.is_active}
                  onCheckedChange={(v) => toggleMut.mutate({ id: c.id, is_active: v })}
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

function CreateCouponDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState(10);
  const [maxRedemptions, setMaxRedemptions] = useState<string>("");

  const mut = useMutation({
    mutationFn: () =>
      createCoupon({
        data: {
          code,
          description,
          kind,
          value,
          max_redemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Coupon created");
        qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
        onClose();
      } else toast.error(res.error);
    },
  });

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New coupon</DialogTitle>
        <DialogDescription>Codes apply at checkout or via subscription patches.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Code</Label>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="LAUNCH25"
            className="font-mono"
          />
        </div>
        <div>
          <Label>Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Launch promo"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as "percent" | "fixed")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percent (%)</SelectItem>
                <SelectItem value="fixed">Fixed amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Value</Label>
            <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
          </div>
        </div>
        <div>
          <Label>Max redemptions (optional)</Label>
          <Input
            type="number"
            value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value)}
            placeholder="Unlimited"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!code || mut.isPending} onClick={() => mut.mutate()}>
          {mut.isPending ? "Creating…" : "Create"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
