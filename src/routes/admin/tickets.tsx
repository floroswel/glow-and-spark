import { createFileRoute, redirect } from "@tanstack/react-router";

// Consolidated: /admin/tickets → /admin/complaints (real DB-backed support tickets)
export const Route = createFileRoute("/admin/tickets")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/complaints" });
  },
});
