import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/subscriptions")({
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
  component: () => null,
});
