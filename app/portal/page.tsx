import type { Metadata } from "next";
import { PortalClient } from "@/components/portal-client";

export const metadata: Metadata = {
  title: "Client Portal",
  description: "Secure client portal and project status dashboard.",
};

export default function PortalPage() {
  return <PortalClient />;
}
