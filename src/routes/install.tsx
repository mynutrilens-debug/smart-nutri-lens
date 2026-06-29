import { createFileRoute } from "@tanstack/react-router";
import { InstallGate } from "@/components/InstallGate";

export const Route = createFileRoute("/install")({
  component: () => <InstallGate to="/login" />,
});
