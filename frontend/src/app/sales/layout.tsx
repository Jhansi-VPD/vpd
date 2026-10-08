"use client";
import SalesLayout from "../../portals/sales-crm/layout/SalesLayout";
import { RoleRoute } from "../../auth/role-route";

export default function SalesLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <RoleRoute allowedRoles={["sales", "marketing"]}>
      <SalesLayout>{children}</SalesLayout>
    </RoleRoute>
  );
}
