import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/account/subscriptions")({
  beforeLoad: () => {
    throw redirect({ to: "/account" });
  },
  component: () => null,
});
