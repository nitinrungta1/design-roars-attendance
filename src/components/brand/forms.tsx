import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { submitLead, subscribe, requestDemo } from "@/lib/leads.functions";
import { submitSupportTicket } from "@/lib/public-help.functions";
import { DeflectionSuggestions } from "@/components/help/deflection-suggestions";

export function ContactForm({ source = "contact" }: { source?: string }) {
  const fn = useServerFn(submitLead);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const res = await fn({
        data: {
          name: String(fd.get("name") || ""),
          email: String(fd.get("email") || ""),
          company: String(fd.get("company") || ""),
          phone: String(fd.get("phone") || ""),
          message: String(fd.get("message") || ""),
          source,
        },
      });
      if (res.ok) {
        setDone(true);
        toast.success("Thanks! We'll be in touch within one business day.");
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(res.error ?? "Something went wrong");
      }
    } catch {
      toast.error("Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-success" />
        <p className="font-semibold">Message received</p>
        <p className="text-sm text-muted-foreground">We'll reach out shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" required maxLength={200} placeholder="Jane Doe" />
        </div>
        <div>
          <Label htmlFor="email">Work email</Label>
          <Input id="email" name="email" type="email" required maxLength={320} placeholder="jane@company.com" />
        </div>
        <div>
          <Label htmlFor="company">Company</Label>
          <Input id="company" name="company" maxLength={200} placeholder="Acme Inc." />
        </div>
        <div>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" name="phone" maxLength={40} placeholder="+1 555 123 4567" />
        </div>
      </div>
      <div>
        <Label htmlFor="message">How can we help?</Label>
        <Textarea id="message" name="message" maxLength={5000} rows={4} placeholder="Tell us about your team and use case…" />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-gradient-brand text-primary-foreground hover:opacity-90">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Send message
      </Button>
    </form>
  );
}

export function DemoForm() {
  const fn = useServerFn(requestDemo);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const res = await fn({
        data: {
          name: String(fd.get("name") || ""),
          email: String(fd.get("email") || ""),
          company: String(fd.get("company") || ""),
          team_size: String(fd.get("team_size") || ""),
          preferred_time: String(fd.get("preferred_time") || ""),
          message: String(fd.get("message") || ""),
          source: "demo",
        },
      });
      if (res.ok) {
        setDone(true);
        toast.success("Demo request received. Check your inbox shortly.");
      } else {
        toast.error(res.error ?? "Something went wrong");
      }
    } catch {
      toast.error("Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-success" />
        <h3 className="text-xl font-semibold">You're on the list</h3>
        <p className="mt-1 text-muted-foreground">
          A product specialist will email you within one business day with available times.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="d-name">Full name</Label>
          <Input id="d-name" name="name" required maxLength={200} />
        </div>
        <div>
          <Label htmlFor="d-email">Work email</Label>
          <Input id="d-email" name="email" type="email" required maxLength={320} />
        </div>
        <div>
          <Label htmlFor="d-company">Company</Label>
          <Input id="d-company" name="company" maxLength={200} />
        </div>
        <div>
          <Label htmlFor="d-team">Team size</Label>
          <select
            id="d-team"
            name="team_size"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Select…</option>
            <option>1–10</option>
            <option>11–50</option>
            <option>51–200</option>
            <option>201–1000</option>
            <option>1000+</option>
          </select>
        </div>
      </div>
      <div>
        <Label htmlFor="d-time">Preferred time (optional)</Label>
        <Input id="d-time" name="preferred_time" placeholder="e.g. Weekday afternoons IST" />
      </div>
      <div>
        <Label htmlFor="d-msg">What would you like to see?</Label>
        <Textarea id="d-msg" name="message" rows={3} placeholder="GPS check-in, kiosk mode, payroll integration…" />
      </div>
      <Button type="submit" disabled={loading} size="lg" className="w-full bg-gradient-brand text-primary-foreground hover:opacity-90">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Request my demo
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Free, 30-minute walkthrough. No credit card required.
      </p>
    </form>
  );
}

export function NewsletterForm() {
  const fn = useServerFn(subscribe);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const res = await fn({
        data: { email: String(fd.get("email") || ""), source: "footer" },
      });
      if (res.ok) {
        toast.success("Subscribed! Look out for our weekly digest.");
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(res.error ?? "Something went wrong");
      }
    } catch {
      toast.error("Please enter a valid email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md gap-2">
      <Input name="email" type="email" required placeholder="you@company.com" maxLength={320} />
      <Button type="submit" disabled={loading} className="bg-gradient-brand text-primary-foreground">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe"}
      </Button>
    </form>
  );
}

export function TicketForm() {
  const fn = useServerFn(submitSupportTicket);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ id: string } | null>(null);
  const [subject, setSubject] = useState("");
  const [suggested, setSuggested] = useState<string[]>([]);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      const res = await fn({
        data: {
          subject: String(fd.get("subject") || ""),
          body: String(fd.get("body") || ""),
          requester_email: String(fd.get("email") || ""),
          requester_name: String(fd.get("name") || ""),
          priority: (String(fd.get("priority") || "normal") as "low" | "normal" | "high" | "urgent"),
          suggested_articles: suggested.length ? suggested : undefined,
        },
      });
      if (res.ok) {
        setDone({ id: res.id });
        toast.success("Ticket created. We'll respond shortly.");
      } else {
        toast.error(res.error ?? "Could not create ticket");
      }
    } catch {
      toast.error("Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
        <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-success" />
        <p className="font-semibold">Ticket #{done.id.slice(0, 8)} created</p>
        <p className="mt-1 text-sm text-muted-foreground">
          A copy was emailed to you. Our support team will reply within SLA.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="t-name">Your name</Label>
          <Input id="t-name" name="name" maxLength={200} placeholder="Jane Doe" />
        </div>
        <div>
          <Label htmlFor="t-email">Email</Label>
          <Input id="t-email" name="email" type="email" required maxLength={320} placeholder="jane@company.com" />
        </div>
      </div>
      <div>
        <Label htmlFor="t-subject">Subject</Label>
        <Input
          id="t-subject"
          name="subject"
          required
          maxLength={300}
          placeholder="Brief summary of the issue"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <DeflectionSuggestions
        query={subject}
        onSelect={(slug) => setSuggested((s) => (s.includes(slug) ? s : [...s, slug]))}
      />

      <div>
        <Label htmlFor="t-priority">Priority</Label>
        <select
          id="t-priority"
          name="priority"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          defaultValue="normal"
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
      <div>
        <Label htmlFor="t-body">How can we help?</Label>
        <Textarea id="t-body" name="body" required maxLength={20000} rows={6} placeholder="Steps to reproduce, what you expected, what happened…" />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-gradient-brand text-primary-foreground hover:opacity-90">
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Open ticket
      </Button>
    </form>
  );
}
