"use client";
import AdminLayout from "../../portals/admin/layout/AdminLayout";
import { RoleRoute } from "../../auth/role-route";

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <RoleRoute allowedRoles={["admin", "finance"]}>
      <AdminLayout>{children}</AdminLayout>
    </RoleRoute>
  );
}
