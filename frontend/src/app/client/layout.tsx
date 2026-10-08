"use client";
import ClientLayout from "../../portals/client/layout/ClientLayout";
import { RoleRoute } from "../../auth/role-route";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <RoleRoute allowedRoles={["client"]}>
      <ClientLayout>{children}</ClientLayout>
    </RoleRoute>
  );
}
