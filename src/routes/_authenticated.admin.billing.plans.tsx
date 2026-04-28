import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CreditCard, Pencil, Plus, Trash2, X, AlertTriangle } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  listPlans,
  updatePlan,
  createPlan,
  deletePlan,
  SUPPORTED_CURRENCIES,
  BILLING_MODELS,
  PLAN_TIERS,
  type PlanRow,
  type SupportedCurrency,
  type BillingModel,
  type PlanTier,
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

interface DialogState {
  mode: "edit" | "create";
  plan: PlanRow | null;
}

function PlansPage() {
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<PlanRow | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: () => listPlans(),
    retry: 1,
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

  const deleteMut = useMutation({
    mutationFn: (id: string) => deletePlan({ data: { id } }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success("Plan deleted");
        qc.invalidateQueries({ queryKey: ["admin", "plans"] });
        setConfirmDelete(null);
      } else toast.error(res.error);
    },
  });

  const plans = data?.plans ?? [];
  const totals = {
    all: plans.length,
    active: plans.filter((p) => p.is_active).length,
    public: plans.filter((p) => p.is_public).length,
  };

  const errorMessage = error instanceof Error ? error.message : null;
  const isPermissionError =
    errorMessage?.toLowerCase().includes("permission") ?? false;

  return (
    <>
      <PageHeader
        eyebrow="Sales & Billing"
        title="Plans"
        description="Per-user pricing, features, badges and CTAs shown on the public pricing page."
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Plans" }]}
        actions={
          !errorMessage ? (
            <Button onClick={() => setDialog({ mode: "create", plan: null })}>
              <Plus className="mr-2 h-4 w-4" />
              New plan
            </Button>
          ) : null
        }
      />
      <PageBody className="space-y-6">
        {errorMessage ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-destructive">
                  {isPermissionError ? "Access denied" : "Could not load plans"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {errorMessage}
                </p>
                {!isPermissionError && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => refetch()}
                  >
                    Retry
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <StatCard label="Total plans" value={totals.all} />
              <StatCard label="Active" value={totals.active} tone="success" />
              <StatCard label="Public" value={totals.public} />
            </div>

            <DataTable
              headers={[
                "Plan",
                "Tier",
                "Model",
                "Per user / mo",
                "Per user / yr",
                "Save",
                "Base fee /mo",
                "Min seats",
                "Currency",
                "Trial",
                "Active",
                "Public",
                "",
              ]}
              empty={
                !isLoading && plans.length === 0 ? (
                  <EmptyState
                    icon={CreditCard}
                    title="No plans yet"
                    description="Click 'New plan' to create your first pricing tier."
                  />
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
                  <Td>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium capitalize">
                      {p.billing_model.replace("_", " ")}
                    </span>
                  </Td>
                  <Td mono>{fmtMoney(p.price_per_user_monthly, p.currency)}</Td>
                  <Td mono>{fmtMoney(p.price_per_user_yearly, p.currency)}</Td>
                  <Td>
                    {p.yearly_discount_pct > 0 ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {p.yearly_discount_pct}%
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </Td>
                  <Td mono>{fmtMoney(p.price_monthly, p.currency)}</Td>
                  <Td>{p.min_seats}</Td>
                  <Td mono>{p.currency}</Td>
                  <Td>{p.trial_days}d</Td>
                  <Td>
                    <Switch
                      checked={p.is_active}
                      onCheckedChange={(v) =>
                        toggleMut.mutate({ id: p.id, is_active: v })
                      }
                    />
                  </Td>
                  <Td>
                    <Switch
                      checked={p.is_public}
                      onCheckedChange={(v) =>
                        toggleMut.mutate({ id: p.id, is_public: v })
                      }
                    />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDialog({ mode: "edit", plan: p })}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDelete(p)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
              {isLoading && (
                <tr>
                  <td
                    colSpan={13}
                    className="px-4 py-6 text-center text-sm text-muted-foreground"
                  >
                    Loading…
                  </td>
                </tr>
              )}
            </DataTable>
          </>
        )}
      </PageBody>

      <Dialog open={!!dialog} onOpenChange={(o) => !o && setDialog(null)}>
        {dialog && (
          <PlanDialog
            mode={dialog.mode}
            plan={dialog.plan}
            onClose={() => setDialog(null)}
          />
        )}
      </Dialog>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {confirmDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the plan from the catalog. Existing
              subscriptions referring to it will lose their plan link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDelete && deleteMut.mutate(confirmDelete.id)}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Deleting…" : "Delete plan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PlanDialog({
  mode,
  plan,
  onClose,
}: {
  mode: "edit" | "create";
  plan: PlanRow | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isCreate = mode === "create";

  const [code, setCode] = useState(plan?.code ?? "");
  const [name, setName] = useState(plan?.name ?? "");
  const [tier, setTier] = useState<PlanTier>(plan?.tier ?? "starter");
  const [tagline, setTagline] = useState(plan?.tagline ?? "");
  const [description, setDescription] = useState(plan?.description ?? "");
  const [currency, setCurrency] = useState<SupportedCurrency>(
    (SUPPORTED_CURRENCIES as readonly string[]).includes(plan?.currency ?? "INR")
      ? ((plan?.currency ?? "INR") as SupportedCurrency)
      : "INR",
  );
  const [billingModel, setBillingModel] = useState<BillingModel>(
    plan?.billing_model ?? "per_user",
  );
  const [perUserMonthly, setPerUserMonthly] = useState<number>(
    plan?.price_per_user_monthly ?? 0,
  );
  const [perUserYearly, setPerUserYearly] = useState<number>(
    plan?.price_per_user_yearly ?? 0,
  );
  const [baseMonthly, setBaseMonthly] = useState<number>(plan?.price_monthly ?? 0);
  const [baseYearly, setBaseYearly] = useState<number>(plan?.price_yearly ?? 0);
  const [minSeats, setMinSeats] = useState<number>(plan?.min_seats ?? 1);
  const [includedSeats, setIncludedSeats] = useState<number>(
    plan?.included_seats ?? 0,
  );
  const [discountPct, setDiscountPct] = useState<number>(
    plan?.yearly_discount_pct ?? 20,
  );
  const [yearlyMode, setYearlyMode] = useState<"discount" | "manual">(
    "discount",
  );
  const [trialDays, setTrialDays] = useState(plan?.trial_days ?? 14);
  const [employeeLimit, setEmployeeLimit] = useState<number | "">(
    plan?.employee_limit ?? "",
  );
  const [popular, setPopular] = useState(plan?.popular ?? false);
  const [ctaLabel, setCtaLabel] = useState(plan?.cta_label ?? "");
  const [features, setFeatures] = useState<string[]>(plan?.features ?? []);
  const [newFeature, setNewFeature] = useState("");
  const [previewSeats, setPreviewSeats] = useState<number>(10);

  const showPerUser = billingModel === "per_user" || billingModel === "hybrid";
  const showBase = billingModel === "flat" || billingModel === "hybrid";

  const previewYearlyPerUser = useMemo(() => {
    if (yearlyMode === "manual") return perUserYearly;
    return Math.round(perUserMonthly * 12 * (1 - discountPct / 100));
  }, [yearlyMode, perUserMonthly, perUserYearly, discountPct]);

  const previewYearlyBase = useMemo(() => {
    if (yearlyMode === "manual") return baseYearly;
    return Math.round(baseMonthly * 12 * (1 - discountPct / 100));
  }, [yearlyMode, baseMonthly, baseYearly, discountPct]);

  const previewTotalMonthly = useMemo(() => {
    const seats = Math.max(previewSeats, minSeats);
    const billable = Math.max(seats - includedSeats, 0);
    return baseMonthly + billable * perUserMonthly;
  }, [previewSeats, minSeats, includedSeats, baseMonthly, perUserMonthly]);

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
      const finalPerUserYearly =
        yearlyMode === "discount"
          ? Math.round(perUserMonthly * 12 * (1 - discountPct / 100))
          : perUserYearly;
      const finalBaseYearly =
        yearlyMode === "discount"
          ? Math.round(baseMonthly * 12 * (1 - discountPct / 100))
          : baseYearly;

      const payload = {
        name,
        tagline,
        description,
        currency,
        billing_model: billingModel,
        price_monthly: baseMonthly,
        price_yearly: finalBaseYearly,
        price_per_user_monthly: perUserMonthly,
        price_per_user_yearly: finalPerUserYearly,
        min_seats: minSeats,
        included_seats: includedSeats,
        trial_days: trialDays,
        employee_limit: employeeLimit === "" ? null : Number(employeeLimit),
        popular,
        cta_label: ctaLabel,
        features: features.map((f) => f.trim()).filter(Boolean),
      };

      if (isCreate) {
        return createPlan({ data: { ...payload, code, tier } });
      }
      if (!plan) throw new Error("No plan to update");
      return updatePlan({ data: { ...payload, id: plan.id } });
    },
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(isCreate ? "Plan created" : "Plan updated");
        qc.invalidateQueries({ queryKey: ["admin", "plans"] });
        onClose();
      } else toast.error(res.error);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Save failed"),
  });

  return (
    <DialogContent className="max-w-3xl">
      <DialogHeader>
        <DialogTitle>
          {isCreate ? "New plan" : `Edit ${plan?.name}`}
        </DialogTitle>
        <DialogDescription>
          Configure pricing, included seats, features and CTAs. Per-user pricing
          is the default; switch to flat or hybrid below.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {isCreate && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Code (URL-safe identifier)</Label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="growth"
              />
            </div>
            <div>
              <Label>Tier</Label>
              <Select value={tier} onValueChange={(v) => setTier(v as PlanTier)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLAN_TIERS.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Currency</Label>
            <Select
              value={currency}
              onValueChange={(v) => setCurrency(v as SupportedCurrency)}
            >
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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm font-semibold">Pricing model</div>
            <div className="flex items-center gap-2 text-xs">
              {BILLING_MODELS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setBillingModel(m)}
                  className={`rounded-md px-2 py-1 capitalize ${billingModel === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {m.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 text-xs">
            <button
              type="button"
              onClick={() => setYearlyMode("discount")}
              className={`rounded-md px-2 py-1 ${yearlyMode === "discount" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              Yearly via discount %
            </button>
            <button
              type="button"
              onClick={() => setYearlyMode("manual")}
              className={`rounded-md px-2 py-1 ${yearlyMode === "manual" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              Manual yearly
            </button>
          </div>

          {showPerUser && (
            <div className="rounded-md border border-border bg-background/40 p-3 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Per-user pricing
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label>{currency} / user / month</Label>
                  <Input
                    type="number"
                    value={perUserMonthly}
                    onChange={(e) => setPerUserMonthly(Number(e.target.value))}
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
                      <Input
                        value={fmtMoney(previewYearlyPerUser, currency)}
                        readOnly
                      />
                    </div>
                  </>
                ) : (
                  <div className="sm:col-span-2">
                    <Label>{currency} / user / year</Label>
                    <Input
                      type="number"
                      value={perUserYearly}
                      onChange={(e) => setPerUserYearly(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {showBase && (
            <div className="rounded-md border border-border bg-background/40 p-3 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {billingModel === "hybrid" ? "Base fee" : "Flat price"}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label>{currency} / month</Label>
                  <Input
                    type="number"
                    value={baseMonthly}
                    onChange={(e) => setBaseMonthly(Number(e.target.value))}
                  />
                </div>
                {yearlyMode === "discount" ? (
                  <div>
                    <Label>Yearly preview</Label>
                    <Input
                      value={fmtMoney(previewYearlyBase, currency)}
                      readOnly
                    />
                  </div>
                ) : (
                  <div className="sm:col-span-2">
                    <Label>{currency} / year</Label>
                    <Input
                      type="number"
                      value={baseYearly}
                      onChange={(e) => setBaseYearly(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label>Min seats</Label>
              <Input
                type="number"
                min={1}
                value={minSeats}
                onChange={(e) => setMinSeats(Number(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label>Included seats (covered by base fee)</Label>
              <Input
                type="number"
                min={0}
                value={includedSeats}
                onChange={(e) => setIncludedSeats(Number(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label>Preview seats</Label>
              <Input
                type="number"
                min={1}
                value={previewSeats}
                onChange={(e) => setPreviewSeats(Number(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="rounded-md bg-primary/10 px-3 py-2 text-sm">
            <span className="text-muted-foreground">Estimated monthly bill at {Math.max(previewSeats, minSeats)} seats: </span>
            <span className="font-semibold text-primary">
              {fmtMoney(previewTotalMonthly, currency)}
            </span>
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
        <Button
          onClick={() => mut.mutate()}
          disabled={
            mut.isPending ||
            !name.trim() ||
            (isCreate && !code.trim())
          }
        >
          {mut.isPending
            ? "Saving…"
            : isCreate
              ? "Create plan"
              : "Save changes"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
