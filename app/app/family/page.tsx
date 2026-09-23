import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/src/lib/auth/config";
import AppShell from "@/components/layout/AppShell";
import FamilyDashboard from "@/user-dashboard/family/FamilyDashboard";
import FamilyHeader from "@/user-dashboard/family/FamilyHeader";
import { getFamilyMembers } from "@/user-dashboard/server-actions/get-family-members";

export default async function FamilyPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Obtener los familiares del usuario desde la base de datos
  const familyMembers = await getFamilyMembers();

  return (
    <AppShell
      title="Grupo Familiar"
      action={<FamilyHeader />}
    >
      <FamilyDashboard familyMembers={familyMembers} />
    </AppShell>
  );
}
