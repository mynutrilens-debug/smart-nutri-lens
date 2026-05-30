import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BottomNav } from "@/components/mobile/BottomNav";

export const Route = createFileRoute("/_app")({
  component: AppShell,
});

function AppShell() {
  return (
    <div className="app-shell">
      <Outlet />
      <BottomNav />
    </div>
  );
}
