import { createFileRoute } from "@tanstack/react-router";
import { ChatPanel } from "@/components/mobile/ChatPanel";

export const Route = createFileRoute("/_app/chat")({ component: ChatPage });

function ChatPage() {
  return (
    <div className="h-[100dvh]">
      <ChatPanel />
    </div>
  );
}
