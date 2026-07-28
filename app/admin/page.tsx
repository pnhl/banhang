import { getAdminPassword } from "../lib/admin-auth";
import { AdminDashboard } from "./AdminDashboard";
import { AdminLogin } from "./AdminLogin";
import {
  getCurrentAppUser,
  hasLegacyAdminSession,
} from "../lib/platform-server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentAppUser();
  if (user?.status === "active" && user.role === "admin") {
    return <AdminDashboard />;
  }
  if (await hasLegacyAdminSession()) {
    return <AdminDashboard />;
  }
  const configured = Boolean(await getAdminPassword());
  return <AdminLogin configured={configured} />;
}
