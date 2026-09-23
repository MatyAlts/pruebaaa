import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/src/lib/auth/config";
import AppShell from "@/components/layout/AppShell";
import HomeDashboard from "@/user-dashboard/home/HomeDashboard";
import HomeHeader from "@/user-dashboard/home/HomeHeader";
import { getRecentStudies, getStudiesStats } from "@/src/features/studies/api";
import { getFamilyMembers } from "@/src/features/family/api";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Obtener estudios recientes, estadísticas y familiares
  const recentStudies = await getRecentStudies();
  const stats = await getStudiesStats();
  const familyMembers = await getFamilyMembers();

  return (
    <AppShell title="Inicio" action={<HomeHeader familyMembers={familyMembers} />}>
      <HomeDashboard recentStudies={recentStudies} stats={stats} familyMembers={familyMembers} />
    </AppShell>
  );
}
