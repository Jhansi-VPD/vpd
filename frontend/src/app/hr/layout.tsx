"use client";
import HRLayout from "../../portals/hr/layout/HRLayout";
import { RoleRoute } from "../../auth/role-route";

export default function HRLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <RoleRoute allowedRoles={["hr"]}>
      <HRLayout>{children}</HRLayout>
    </RoleRoute>
  );
}
