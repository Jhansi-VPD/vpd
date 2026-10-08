"use client";
import AdminLayout from "../../portals/admin/layout/AdminLayout";

export default function AdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
