"use client";

import BasicLayoutAdmin from "../layout/BasicLayoutAdmin";
import UsersTable from "./UsersTable";
import { UsersResponse } from "../server-actions/get-users";

interface UsersTableWrapperProps {
  initialData: UsersResponse;
  usersPerPage?: number;
}

const UsersTableWrapper = ({
  initialData,
  usersPerPage = 20,
}: UsersTableWrapperProps) => {
  return (
    <BasicLayoutAdmin>
      <div className="container-fluid py-4">
        <div className="mb-4">
          <h1 className="fw-semibold mb-1" style={{ fontSize: "1.5rem", color: "var(--text-primary)" }}>
            Gestión de Usuarios
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }}>
            Administra los usuarios registrados en la plataforma
          </p>
        </div>
        <UsersTable initialData={initialData} usersPerPage={usersPerPage} />
      </div>
    </BasicLayoutAdmin>
  );
};

export default UsersTableWrapper;
