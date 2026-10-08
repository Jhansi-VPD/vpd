"use client";
import SalesLayout from "../../portals/sales-crm/layout/SalesLayout";

export default function SalesLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <SalesLayout>{children}</SalesLayout>;
}
