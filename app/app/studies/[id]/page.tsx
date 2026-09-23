import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/src/lib/auth/config";
import { getStudyById } from "@/src/features/studies/api";
import { getFamilyMembers } from "@/src/features/family/api";
import AppShell from "@/components/layout/AppShell";
import { Button } from "react-bootstrap";
import StudyDetailClient from "@/user-dashboard/study/StudyDetailClient";

export default async function StudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const { id } = await params;
  const study = await getStudyById(id);
  const familyMembers = await getFamilyMembers();

  if (!study) {
    return (
      <AppShell title="Estudio no encontrado">
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 36.6667C29.2048 36.6667 36.6667 29.2048 36.6667 20C36.6667 10.7953 29.2048 3.33337 20 3.33337C10.7953 3.33337 3.33337 10.7953 3.33337 20C3.33337 29.2048 10.7953 36.6667 20 36.6667Z"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 13.3334V20.0001"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="20" cy="26.6667" r="1.5" fill="var(--saluteca-gray)" />
            </svg>
          </div>
          <h2 className="empty-state-title">Estudio no encontrado</h2>
          <p className="empty-state-description">
            El estudio que buscás no existe o fue eliminado
          </p>
          <Button
            className="btn-primary-saluteca"
            href="/app/studies"
            as="a"
          >
            Volver a Estudios
          </Button>
        </div>
      </AppShell>
    );
  }

  const familyMember = study.familyMemberId
    ? familyMembers.find(fm => fm.id === study.familyMemberId) || null
    : null;

  return <StudyDetailClient study={study} familyMember={familyMember} />;
}
