"use client";
import DeliveryLayout from "../../portals/project-manager/layout/DeliveryLayout";
import { RoleRoute } from "../../auth/role-route";

export default function DeliveryLayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <RoleRoute allowedRoles={["project_manager"]}>
      <DeliveryLayout>{children}</DeliveryLayout>
    </RoleRoute>
  );
}
