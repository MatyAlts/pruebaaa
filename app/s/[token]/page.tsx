import SharedStudyView from "@/user-dashboard/study/SharedStudyView";
import { getSharedStudy } from "./actions";
import SharedStudyErrorState from "@/user-dashboard/study/SharedStudyErrorState";

export default async function SharedStudyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Obtener el estudio compartido desde la base de datos
  const { study, error } = await getSharedStudy(token);

  // Manejar errores
  if (error) {
    return <SharedStudyErrorState type={error} />;
  }

  // Esto no debería pasar, pero por seguridad TypeScript
  if (!study) {
    return <SharedStudyErrorState type="notFound" />;
  }

  return <SharedStudyView study={study} linkUuid={token} />;
}
