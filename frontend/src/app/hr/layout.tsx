"use client";
import HRLayout from "../../portals/hr/layout/HRLayout";

export default function HRLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <HRLayout>{children}</HRLayout>;
}
