import { createFileRoute, redirect } from "@tanstack/react-router";

// Consolidated: /wishlist → /account/favorites (single source of truth)
export const Route = createFileRoute("/wishlist")({
  beforeLoad: () => {
    throw redirect({ to: "/account/favorites" });
  },
});
