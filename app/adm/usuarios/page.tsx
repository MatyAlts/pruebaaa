import LoginPanel from "@/admin-dashboard/components/LoginPanel";
import { verifyAuth } from "@/admin-dashboard/server-actions/auth";
import { getUsers } from "@/admin-dashboard/server-actions/get-users";
import UsersTableWrapper from "@/admin-dashboard/components/UsersTableWrapper";

// Configuración: usuarios por página
const USERS_PER_PAGE = 20;

interface AdminUsuariosProps {
  searchParams: Promise<{ page?: string }>;
}

const AdminUsuarios = async ({ searchParams }: AdminUsuariosProps) => {
  // Verificar autenticación
  const isAuthenticated = await verifyAuth();

  if (!isAuthenticated) {
    return <LoginPanel />;
  }

  // Obtener parámetros de búsqueda
  const params = await searchParams;
  const page = Number(params.page) || 1;

  // Obtener usuarios desde el servidor
  const usersData = await getUsers(page, USERS_PER_PAGE);

  return (
    <UsersTableWrapper initialData={usersData} usersPerPage={USERS_PER_PAGE} />
  );
};

export default AdminUsuarios;