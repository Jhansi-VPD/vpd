"use client";
import EmployeeLayout from "../../portals/employee/layout/EmployeeLayout";

export default function EmployeeLayoutWrapper({ children }: { children: React.ReactNode }) {
  return <EmployeeLayout>{children}</EmployeeLayout>;
}
