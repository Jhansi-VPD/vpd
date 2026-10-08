"use client";
import ClientLayout from "../../portals/client/layout/ClientLayout";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <ClientLayout>{children}</ClientLayout>;
}
