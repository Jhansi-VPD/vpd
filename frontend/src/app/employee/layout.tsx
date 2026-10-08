"use client";
import EmployeeLayout from "../../portals/employee/layout/EmployeeLayout";
import { RoleRoute } from "../../auth/role-route";

export default function EmployeeLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <RoleRoute allowedRoles={["employee"]}>
      <EmployeeLayout>{children}</EmployeeLayout>
    </RoleRoute>
  );
}
