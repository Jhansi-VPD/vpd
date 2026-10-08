"use client";
import DeliveryLayout from "../../portals/project-manager/layout/DeliveryLayout";

export default function DeliveryLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <DeliveryLayout>{children}</DeliveryLayout>;
}
