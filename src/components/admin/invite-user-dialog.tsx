import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteUser, PLATFORM_ROLES, type PlatformRole } from "@/lib/platform-users.functions";

export function InviteUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<PlatformRole>("employee");
  const [actionLink, setActionLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const reset = () => {
    setFullName("");
    setEmail("");
    setRole("employee");
    setActionLink(null);
    setEmailSent(false);
  };

  const invite = useMutation({
    mutationFn: () => inviteUser({ data: { email: email.trim(), full_name: fullName.trim(), role } }),
    onSuccess: (res) => {
      if (res.ok) {
        qc.invalidateQueries({ queryKey: ["admin", "platform-users"] });
        if (res.email_sent) toast.success(`Invite sent to ${email}`);
        else toast.success("Invite created — share the link below");
        if (res.action_link) {
          setActionLink(res.action_link);
          setEmailSent(!!res.email_sent);
        } else {
          onOpenChange(false);
          reset();
        }
      } else {
        toast.error("Failed to send invite", { description: res.error });
      }
    },
    onError: (e: Error) => toast.error("Failed to send invite", { description: e.message }),
  });

  const canSubmit = fullName.trim().length > 0 && /\S+@\S+\.\S+/.test(email);

  const copyLink = async () => {
    if (!actionLink) return;
    try {
      await navigator.clipboard.writeText(actionLink);
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy — select and copy manually");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            An invite email will be sent if email delivery is configured. The user sets their own password when they accept.
          </DialogDescription>
        </DialogHeader>

        {!actionLink ? (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="full-name">Full name</Label>
              <Input id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as PlatformRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLATFORM_ROLES.map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">{r.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
              {emailSent
                ? <>Email was sent to <b>{email}</b>. If it doesn't arrive, share this link:</>
                : <>Email could not be sent. Share this invite link with <b>{email}</b> manually:</>}
            </div>
            <div className="flex items-center gap-2">
              <Input readOnly value={actionLink} onFocus={(e) => e.currentTarget.select()} />
              <Button type="button" variant="outline" size="icon" onClick={copyLink} aria-label="Copy invite link">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          {!actionLink ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={() => invite.mutate()} disabled={!canSubmit || invite.isPending} className="gap-1.5">
                <Mail className="h-4 w-4" />
                {invite.isPending ? "Sending…" : "Send invite"}
              </Button>
            </>
          ) : (
            <Button onClick={() => { onOpenChange(false); reset(); }}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
