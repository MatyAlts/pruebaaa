import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/src/lib/auth/config";
import { getUser } from "@/user-dashboard/server-actions/get-user";
import { getSharedLinks } from "@/src/features/sharing/api";
import SettingsPageClient from "@/user-dashboard/settings/SettingsPageClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Obtener datos del usuario y enlaces compartidos
  const [user, sharedLinks] = await Promise.all([
    getUser(),
    getSharedLinks(),
  ]);

  if (!user) {
    redirect("/");
  }

  return <SettingsPageClient user={user} sharedLinks={sharedLinks} />;
}
