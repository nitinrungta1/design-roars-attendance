import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Pencil, Plus, X } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { DataTable, Td, Tr, PlanBadge, StatCard } from "@/components/admin/data-shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  listPlans,
  updatePlan,
  SUPPORTED_CURRENCIES,
  type PlanRow,
  type SupportedCurrency,
} from "@/lib/billing.functions";
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
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
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
        description="Manage plan names, pricing, currency, features, badges and CTAs shown on the public pricing page."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Plans" }]}
      />
      <PageBody className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Total plans" value={totals.all} />
          <StatCard label="Active" value={totals.active} tone="success" />
          <StatCard label="Public" value={totals.public} />
        </div>

        <DataTable
          headers={[
            "Plan",
            "Tier",
            "Monthly",
            "Yearly",
            "Save",
            "Currency",
            "Limit",
            "Trial",
            "Active",
            "Public",
            "",
          ]}
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
              <Td>
                {p.yearly_discount_pct > 0 ? (
                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    {p.yearly_discount_pct}%
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </Td>
              <Td mono>{p.currency}</Td>
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
              <td colSpan={11} className="px-4 py-6 text-center text-sm text-muted-foreground">
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
  const [tagline, setTagline] = useState(plan.tagline ?? "");
  const [description, setDescription] = useState(plan.description ?? "");
  const [currency, setCurrency] = useState<SupportedCurrency>(
    (SUPPORTED_CURRENCIES as readonly string[]).includes(plan.currency)
      ? (plan.currency as SupportedCurrency)
      : "INR",
  );
  const [monthly, setMonthly] = useState(plan.price_monthly);
  const [yearly, setYearly] = useState(plan.price_yearly);
  const [discountPct, setDiscountPct] = useState<number>(plan.yearly_discount_pct);
  const [yearlyMode, setYearlyMode] = useState<"discount" | "manual">(
    plan.yearly_discount_pct > 0 && plan.price_yearly === Math.round(plan.price_monthly * 12 * (1 - plan.yearly_discount_pct / 100))
      ? "discount"
      : "manual",
  );
  const [trialDays, setTrialDays] = useState(plan.trial_days);
  const [employeeLimit, setEmployeeLimit] = useState<number | "">(plan.employee_limit ?? "");
  const [popular, setPopular] = useState(plan.popular);
  const [ctaLabel, setCtaLabel] = useState(plan.cta_label ?? "");
  const [features, setFeatures] = useState<string[]>(plan.features);
  const [newFeature, setNewFeature] = useState("");

  // Live preview yearly when in discount mode
  const previewYearly = useMemo(() => {
    if (yearlyMode !== "discount") return yearly;
    return Math.round(monthly * 12 * (1 - discountPct / 100));
  }, [yearlyMode, discountPct, monthly, yearly]);

  function addFeature() {
    const v = newFeature.trim();
    if (!v) return;
    setFeatures((prev) => [...prev, v]);
    setNewFeature("");
  }
  function removeFeature(i: number) {
    setFeatures((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateFeature(i: number, v: string) {
    setFeatures((prev) => prev.map((f, idx) => (idx === i ? v : f)));
  }

  const mut = useMutation({
    mutationFn: () => {
      const finalYearly =
        yearlyMode === "discount"
          ? Math.round(monthly * 12 * (1 - discountPct / 100))
          : yearly;
      return updatePlan({
        data: {
          id: plan.id,
          name,
          tagline,
          description,
          currency,
          price_monthly: monthly,
          price_yearly: finalYearly,
          trial_days: trialDays,
          employee_limit: employeeLimit === "" ? null : Number(employeeLimit),
          popular,
          cta_label: ctaLabel,
          features: features.map((f) => f.trim()).filter(Boolean),
        },
      });
    },
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Plan updated");
        qc.invalidateQueries({ queryKey: ["admin", "plans"] });
        onClose();
      } else toast.error(res.error);
    },
  });

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Edit {plan.name}</DialogTitle>
        <DialogDescription>
          Update plan details, pricing, features, badges, and CTA shown on the public pricing page.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Currency</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as SupportedCurrency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
            rows={2}
          />
        </div>

        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Pricing</div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setYearlyMode("discount")}
                className={`rounded-md px-2 py-1 ${yearlyMode === "discount" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                Discount %
              </button>
              <button
                type="button"
                onClick={() => setYearlyMode("manual")}
                className={`rounded-md px-2 py-1 ${yearlyMode === "manual" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                Manual yearly
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label>Monthly ({currency})</Label>
              <Input
                type="number"
                value={monthly}
                onChange={(e) => setMonthly(Number(e.target.value))}
              />
            </div>
            {yearlyMode === "discount" ? (
              <>
                <div>
                  <Label>Annual discount %</Label>
                  <Input
                    type="number"
                    min={0}
                    max={95}
                    value={discountPct}
                    onChange={(e) => setDiscountPct(Number(e.target.value))}
                  />
                </div>
                <div>
                  <Label>Yearly preview</Label>
                  <Input value={fmtMoney(previewYearly, currency)} readOnly />
                </div>
              </>
            ) : (
              <>
                <div className="sm:col-span-2">
                  <Label>Yearly ({currency})</Label>
                  <Input
                    type="number"
                    value={yearly}
                    onChange={(e) => setYearly(Number(e.target.value))}
                  />
                </div>
              </>
            )}
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

        <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-semibold">Features</Label>
            <span className="text-xs text-muted-foreground">{features.length} listed</span>
          </div>
          <div className="space-y-2">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={f}
                  onChange={(e) => updateFeature(i, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFeature(i)}
                  aria-label="Remove feature"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addFeature();
                }
              }}
              placeholder="Add a feature and press Enter"
            />
            <Button type="button" variant="secondary" size="sm" onClick={addFeature}>
              <Plus className="mr-1 h-4 w-4" /> Add
            </Button>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
          {mut.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
