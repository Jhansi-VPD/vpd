"use client";
import EmployeeLayout from "../../portals/employee/layout/EmployeeLayout";
import { RoleRoute } from "../../auth/role-route";

export default function EmployeeLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <RoleRoute allowedRoles={["employee", "admin", "super_admin"]}>
      <EmployeeLayout>{children}</EmployeeLayout>
    </RoleRoute>
  );
}
