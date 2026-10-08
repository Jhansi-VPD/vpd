"use client";

import { useParams } from "next/navigation";
import UserDetail from "../../../../portals/admin/pages/UserDetail/UserDetail";

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";

  return <UserDetail userId={id} />;
}
