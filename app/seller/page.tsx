import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  createAdminSessionToken,
  getAdminPassword,
} from "../lib/admin-auth";
import { AdminLogin } from "../admin/AdminLogin";
import { SellerCenter } from "./SellerCenter";

export const dynamic = "force-dynamic";

export default async function SellerPage() {
  const configured = Boolean(await getAdminPassword());
  const expected = configured ? await createAdminSessionToken() : "";
  const current = (await cookies()).get(ADMIN_COOKIE)?.value ?? "";

  if (!configured || current !== expected) {
    return <AdminLogin configured={configured} />;
  }

  return <SellerCenter />;
}
