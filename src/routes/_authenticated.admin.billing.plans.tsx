import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Pencil } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, PlanBadge, StatCard } from "@/components/admin/data-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { listPlans, updatePlan, type PlanRow } from "@/lib/billing.functions";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/billing/plans")({
  head: () =>
    seo({
      title: "Plans | Admin",
      description: "Punchly plan catalog.",
      kind: "product",
      path: "/admin/billing/plans",
      noindex: true,
    }),
  component: PlansPage,
});

function fmtMoney(amount: number, currency: string) {
  if (amount === 0) return "—";
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(
      amount,
    );
  } catch {
    return `${currency} ${amount}`;
  }
}

function PlansPage() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<PlanRow | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => listPlans(),
  });

  const toggleMut = useMutation({
    mutationFn: (vars: { id: string; is_active?: boolean; is_public?: boolean }) =>
      updatePlan({ data: vars }),
    onSuccess: (res) => {
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ["admin", "plans"] });
      } else toast.error(res.error);
    },
  });

  const plans = data?.plans ?? [];
  const totals = {
    all: plans.length,
    active: plans.filter((p) => p.is_active).length,
    public: plans.filter((p) => p.is_public).length,
  };

  return (
    <>
      <PageHeader
        eyebrow="Sales & Billing"
        title="Plans"
        description="Punchly plan catalog. Toggle availability or edit pricing."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Plans" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Total plans" value={totals.all} />
          <StatCard label="Active" value={totals.active} tone="success" />
          <StatCard label="Public" value={totals.public} />
        </div>

        <DataTable
          headers={["Plan", "Tier", "Monthly", "Yearly", "Limit", "Trial", "Active", "Public", ""]}
          empty={
            !isLoading && plans.length === 0 ? (
              <EmptyState icon={CreditCard} title="No plans" description="Seed plans to get started." />
            ) : null
          }
        >
          {plans.map((p) => (
            <Tr key={p.id}>
              <Td>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.code}</div>
              </Td>
              <Td>
                <PlanBadge plan={p.tier} />
              </Td>
              <Td mono>{fmtMoney(p.price_monthly, p.currency)}</Td>
              <Td mono>{fmtMoney(p.price_yearly, p.currency)}</Td>
              <Td>{p.employee_limit ?? "∞"}</Td>
              <Td>{p.trial_days}d</Td>
              <Td>
                <Switch
                  checked={p.is_active}
                  onCheckedChange={(v) => toggleMut.mutate({ id: p.id, is_active: v })}
                />
              </Td>
              <Td>
                <Switch
                  checked={p.is_public}
                  onCheckedChange={(v) => toggleMut.mutate({ id: p.id, is_public: v })}
                />
              </Td>
              <Td>
                <Button variant="ghost" size="sm" onClick={() => setEditing(p)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </Td>
            </Tr>
          ))}
          {isLoading && (
            <tr>
              <td colSpan={9} className="px-4 py-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          )}
        </DataTable>
      </PageBody>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && <EditPlanDialog plan={editing} onClose={() => setEditing(null)} />}
      </Dialog>
    </>
  );
}

function EditPlanDialog({ plan, onClose }: { plan: PlanRow; onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState(plan.name);
  const [tagline, setTagline] = useState((plan as PlanRow & { tagline?: string }).tagline ?? "");
  const [description, setDescription] = useState(plan.description ?? "");
  const [monthly, setMonthly] = useState(plan.price_monthly);
  const [yearly, setYearly] = useState(plan.price_yearly);
  const [trialDays, setTrialDays] = useState(plan.trial_days);
  const [employeeLimit, setEmployeeLimit] = useState<number | "">(plan.employee_limit ?? "");
  const [popular, setPopular] = useState(
    Boolean((plan as PlanRow & { popular?: boolean }).popular),
  );
  const [ctaLabel, setCtaLabel] = useState(
    (plan as PlanRow & { cta_label?: string | null }).cta_label ?? "",
  );

  const mut = useMutation({
    mutationFn: () =>
      updatePlan({
        data: {
          id: plan.id,
          name,
          tagline,
          description,
          price_monthly: monthly,
          price_yearly: yearly,
          trial_days: trialDays,
          employee_limit: employeeLimit === "" ? null : Number(employeeLimit),
          popular,
          cta_label: ctaLabel,
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Plan updated");
        qc.invalidateQueries({ queryKey: ["admin", "plans"] });
        onClose();
      } else toast.error(res.error);
    },
  });

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit {plan.name}</DialogTitle>
        <DialogDescription>
          Update plan details, pricing, and marketing fields shown on /pricing.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        <div>
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Tagline (shown under plan name)</Label>
          <Input
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            placeholder="For scaling teams with shifts and OT."
          />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Monthly ({plan.currency})</Label>
            <Input
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Yearly ({plan.currency})</Label>
            <Input
              type="number"
              value={yearly}
              onChange={(e) => setYearly(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Trial days</Label>
            <Input
              type="number"
              value={trialDays}
              onChange={(e) => setTrialDays(Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Employee limit (blank = unlimited)</Label>
            <Input
              type="number"
              value={employeeLimit}
              onChange={(e) =>
                setEmployeeLimit(e.target.value === "" ? "" : Number(e.target.value))
              }
            />
          </div>
        </div>
        <div>
          <Label>CTA button label</Label>
          <Input
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            placeholder="Start Free Trial"
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
          <div>
            <div className="text-sm font-medium">Most popular badge</div>
            <div className="text-xs text-muted-foreground">
              Highlights this plan on the pricing page.
            </div>
          </div>
          <Switch checked={popular} onCheckedChange={setPopular} />
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
          {mut.isPending ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
