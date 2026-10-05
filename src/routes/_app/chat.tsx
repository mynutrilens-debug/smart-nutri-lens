import { createFileRoute } from "@tanstack/react-router";
import { ChatPanel } from "@/components/mobile/ChatPanel";
import { routeHead } from "@/lib/route-head";

export const Route = createFileRoute("/_app/chat")({
  head: () => routeHead("NutriBot Coach — MyNutriLens", "Chat with your MyNutriLens nutrition coach for personalized food and fitness guidance."),
  component: ChatPage,
});

function ChatPage() {
  return (
    <div className="h-[100dvh]">
      <ChatPanel />
    </div>
  );
}
