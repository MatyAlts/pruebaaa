import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/src/lib/auth/config";
import AppShell from "@/components/layout/AppShell";
import { getFamilyMemberByUuid, getFamilyMembers } from "@/src/features/family/api";
import { getStudiesByFamilyMember, getStudyCountByFamilyMember, getLastStudyDateByFamilyMember } from "@/src/features/studies/api";
import FamilyMemberDetailWrapper from "@/user-dashboard/family/FamilyMemberDetailWrapper";

export default async function FamilyMemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Verificar sesión
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Obtener el UUID del familiar (el parámetro 'id' en la URL es en realidad el UUID)
  const { id: uuid } = await params;
  const member = await getFamilyMemberByUuid(uuid);

  if (!member) {
    return (
      <AppShell title="Familiar no encontrado">
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
              />
              <path
                d="M20 13.3333V20"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="20" cy="26.6667" r="1.5" fill="var(--saluteca-gray)" />
            </svg>
          </div>
          <h2 className="empty-state-title">Familiar no encontrado</h2>
          <p className="empty-state-description">
            El familiar que buscás no existe
          </p>
          <Link href="/app/family" className="btn btn-primary-saluteca">
            Volver a Grupo Familiar
          </Link>
        </div>
      </AppShell>
    );
  }

  // Obtener datos del familiar
  const [familyMembers, studies, studyCount, lastStudyDate] = await Promise.all([
    getFamilyMembers(),
    getStudiesByFamilyMember(member.id),
    getStudyCountByFamilyMember(member.id),
    getLastStudyDateByFamilyMember(member.id),
  ]);



  return (
    <AppShell title={member.name}>
      <FamilyMemberDetailWrapper
        member={member}
        familyMembers={familyMembers}
        studies={studies}

        studyCount={studyCount}
        lastStudyDate={lastStudyDate ?? null}
      />
    </AppShell>
  );
}
