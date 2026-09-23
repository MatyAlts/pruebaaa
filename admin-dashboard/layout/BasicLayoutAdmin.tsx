"use client";
import React, { useEffect, useState, useCallback } from "react";
import MenuAdmin from "../components/MenuAdmin";

interface BasicLayoutAdminProps {
  children: React.ReactNode;
  comision?: boolean;
  data?: {
    tipo?: string;
  };
}

const BasicLayoutAdmin = ({
  children,
  comision = false,
  data = {},
}: BasicLayoutAdminProps) => {
  const [show, setShow] = useState(true);

  const handleShowBasic = useCallback((showValue: boolean) => {
    setShow(showValue);
  }, []);

  const logout = async () => {
    try {
      const resp = await fetch(`/api/comision/panel/logout`);
      if (resp.status === 200) {
        window.location.href = "/";
      }
    } catch {
      // Error handling could be added here if needed
    }
  };

  useEffect(() => {
    if (data.tipo === "comision") {
      logout();
    }
  }, [data]);

  if (comision) return <>{children}</>;

  return (
    <div style={{ background: "var(--surface-inset)", minHeight: "100vh" }}>
      <MenuAdmin showBasic={handleShowBasic} />
      <main
        style={{
          marginLeft: show ? "260px" : "0",
          padding: "1.5rem",
          paddingTop: show ? "1.5rem" : "4rem",
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
};

export default BasicLayoutAdmin;
