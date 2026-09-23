"use client";

import { useState } from "react";
import { Pagination, Spinner } from "react-bootstrap";
import { User, UsersResponse, getUsers } from "../server-actions/get-users";
import { useRouter } from "next/navigation";

interface UsersTableProps {
  initialData: UsersResponse;
  usersPerPage?: number;
}

const thStyle: React.CSSProperties = {
  padding: "0.75rem 1rem",
  fontWeight: 600,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--text-secondary)",
};

const UsersTable = ({ initialData, usersPerPage = 20 }: UsersTableProps) => {
  const [data, setData] = useState<UsersResponse>(initialData);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePageChange = async (pageNumber: number) => {
    setLoading(true);
    try {
      const newData = await getUsers(pageNumber, usersPerPage);
      setData(newData);
      router.push(`/adm/usuarios?page=${pageNumber}`, { scroll: false });
    } catch (error) {
      console.error("Error al cambiar página:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderPaginationItems = () => {
    const items = [];
    const { page, totalPages } = data;

    if (page > 1) {
      items.push(<Pagination.First key="first" onClick={() => handlePageChange(1)} />);
      items.push(<Pagination.Prev key="prev" onClick={() => handlePageChange(page - 1)} />);
    }

    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item key={i} active={i === page} onClick={() => handlePageChange(i)} disabled={loading}>
          {i}
        </Pagination.Item>
      );
    }

    if (page < totalPages) {
      items.push(<Pagination.Next key="next" onClick={() => handlePageChange(page + 1)} />);
      items.push(<Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} />);
    }

    return items;
  };

  return (
    <div>
      {/* KPI Card */}
      <div className="bg-white rounded-3 p-3 border mb-4 d-flex align-items-center gap-3">
        <div
          className="d-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: "var(--saluteca-sky-faint)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" stroke="var(--saluteca-ocean)" strokeWidth="1.5" />
            <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="var(--saluteca-ocean)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <div>
          <div className="text-muted" style={{ fontSize: "0.8125rem" }}>Usuarios registrados</div>
          <div className="fw-semibold" style={{ fontSize: "1.25rem" }}>{data.total}</div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="bg-white rounded-3 border d-none d-md-block" style={{ overflow: "hidden" }}>
        <div className="table-responsive">
          <table className="table table-hover mb-0" style={{ fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--surface-inset)", borderBottom: "1px solid var(--border-default)" }}>
                <th style={{ ...thStyle, width: "70px" }}>ID</th>
                <th style={thStyle}>Nombre</th>
                <th style={thStyle}>Email</th>
                <th style={{ ...thStyle, width: "100px", textAlign: "center" }}>Estudios</th>
                <th style={{ ...thStyle, width: "120px", textAlign: "center" }}>Compartidos</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-5">
                    <Spinner animation="border" size="sm" style={{ color: "var(--saluteca-ocean)" }} />
                    <div className="text-muted mt-2" style={{ fontSize: "0.8125rem" }}>Cargando...</div>
                  </td>
                </tr>
              ) : data.users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                data.users.map((user: User) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontSize: "0.8125rem" }}>{user.id}</td>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 500 }}>{user.name}</td>
                    <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)" }}>{user.email}</td>
                    <td style={{ textAlign: "center", padding: "0.75rem 1rem" }}>
                      <Badge value={user.totalEstudios} variant="blue" />
                    </td>
                    <td style={{ textAlign: "center", padding: "0.75rem 1rem" }}>
                      <Badge value={user.totalCompartidos} variant="teal" />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <TableFooter data={data} renderPaginationItems={renderPaginationItems} />
      </div>

      {/* Mobile Cards */}
      <div className="d-md-none">
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" size="sm" style={{ color: "var(--saluteca-ocean)" }} />
          </div>
        ) : data.users.length === 0 ? (
          <div className="bg-white rounded-3 border p-4 text-center text-muted">
            No hay usuarios registrados
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {data.users.map((user: User) => (
              <div key={user.id} className="bg-white rounded-3 border p-3">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <div className="fw-semibold" style={{ fontSize: "0.9375rem" }}>{user.name}</div>
                    <div className="text-muted" style={{ fontSize: "0.8125rem" }}>{user.email}</div>
                  </div>
                  <span className="text-muted" style={{ fontSize: "0.75rem" }}>#{user.id}</span>
                </div>
                <div className="d-flex gap-3 mt-2">
                  <div className="d-flex align-items-center gap-1">
                    <Badge value={user.totalEstudios} variant="blue" />
                    <span className="text-muted" style={{ fontSize: "0.75rem" }}>estudios</span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <Badge value={user.totalCompartidos} variant="teal" />
                    <span className="text-muted" style={{ fontSize: "0.75rem" }}>compartidos</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-3 border mt-2">
          <TableFooter data={data} renderPaginationItems={renderPaginationItems} />
        </div>
      </div>
    </div>
  );
};

// Reusable badge component
function Badge({ value, variant }: { value: number; variant: "blue" | "teal" }) {
  const colors = variant === "blue"
    ? { bg: "var(--saluteca-sky-faint)", color: "var(--saluteca-ocean)" }
    : { bg: "var(--saluteca-teal-faint)", color: "var(--saluteca-teal)" };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "28px",
        padding: "2px 8px",
        borderRadius: "var(--radius-sm)",
        backgroundColor: colors.bg,
        color: colors.color,
        fontWeight: 600,
        fontSize: "0.8125rem",
      }}
    >
      {value}
    </span>
  );
}

// Reusable table footer
function TableFooter({ data, renderPaginationItems }: { data: UsersResponse; renderPaginationItems: () => React.ReactNode[] }) {
  return (
    <>
      {data.totalPages > 1 && (
        <div className="d-flex justify-content-center py-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
          <Pagination size="sm">{renderPaginationItems()}</Pagination>
        </div>
      )}
      <div
        className="text-muted text-center py-2"
        style={{ fontSize: "0.75rem", borderTop: "1px solid var(--border-subtle)" }}
      >
        Mostrando{" "}
        {data.users.length > 0
          ? `${(data.page - 1) * data.perPage + 1} - ${Math.min(data.page * data.perPage, data.total)}`
          : "0"}{" "}
        de {data.total} usuarios
      </div>
    </>
  );
}

export default UsersTable;
