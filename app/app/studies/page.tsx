import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/src/lib/auth/config";
import { getFamilyMembers } from "@/src/features/family/api";
import { getStudies } from "@/src/features/studies/api";
import StudiesPageClient from "@/user-dashboard/study/StudiesPageClient";

export default async function StudiesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Obtener todos los estudios y familiares del usuario
  const studies = await getStudies();
  const familyMembers = await getFamilyMembers();

  return <StudiesPageClient studies={studies} familyMembers={familyMembers} />;
}
