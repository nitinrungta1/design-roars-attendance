import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare } from "lucide-react";
import { PageHeader, PageBody, EmptyState } from "@/components/admin/primitives";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/_authenticated/admin/support/chat")({
  head: () => seo({ title: "Live chat | Admin", description: "Live chat queues and operator console.", kind: "product", path: "/admin/support/chat", noindex: true }),
  component: ChatPage,
});

function ChatPage() {
  return (
    <>
      <PageHeader eyebrow="Customer Support" title="Live Chat" description="Real-time chat console for support agents." breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Live chat" }]} />
      <PageBody>
        <EmptyState
          icon={MessageSquare}
          title="Chat console coming online"
          description="Operator workspace, canned replies, agent presence and routing land in the next release. Tickets and KB are already live."
        />
      </PageBody>
    </>
  );
}
