import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitKbFeedback } from "@/lib/public-help.functions";

export function FeedbackWidget({ slug }: { slug: string }) {
  const submit = useServerFn(submitKbFeedback);
  const [stage, setStage] = useState<"ask" | "comment" | "done">("ask");
  const [helpful, setHelpful] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async (h: boolean, c?: string) => {
    setLoading(true);
    try {
      await submit({ data: { slug, helpful: h, comment: c } });
      setStage("done");
      toast.success(h ? "Thanks for the feedback!" : "Thanks — we'll improve this article.");
    } catch {
      toast.error("Could not record your feedback");
    } finally {
      setLoading(false);
    }
  };

  if (stage === "done") {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-sm font-semibold">Thanks for letting us know.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Still stuck?{" "}
          <Link to="/contact" className="text-primary underline">
            Open a ticket
          </Link>
          .
        </p>
      </div>
    );
  }

  if (stage === "comment" && helpful === false) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-sm font-semibold">What was missing?</p>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="A short note helps us improve this article…"
          className="mt-3"
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => send(false)} disabled={loading}>
            Skip
          </Button>
          <Button size="sm" onClick={() => send(false, comment)} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send feedback
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <p className="text-sm font-semibold">Was this article helpful?</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => {
            setHelpful(true);
            void send(true);
          }}
        >
          <ThumbsUp className="mr-2 h-4 w-4" /> Yes
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() => {
            setHelpful(false);
            setStage("comment");
          }}
        >
          <ThumbsDown className="mr-2 h-4 w-4" /> No
        </Button>
        <Link to="/contact" className="ml-auto self-center text-sm text-primary underline">
          Still need help? Contact us →
        </Link>
      </div>
    </div>
  );
}
