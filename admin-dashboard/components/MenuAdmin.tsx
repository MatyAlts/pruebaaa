"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import styles from "./MenuAdmin.module.css";
import { logout as logoutAction } from "../server-actions/auth";

const MenuAdmin = ({ showBasic }: { showBasic: (show: boolean) => void }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const handleClose = () => setShow(false);
  const toggleShow = () => setShow((s) => !s);
  const showBasicRef = useRef(showBasic);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setShow(false);
      } else {
        setShow(true);
      }
      setLoaded(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // On mobile, sidebar doesn't push content — it overlays
    if (isMobile) {
      showBasicRef.current(false);
    } else {
      showBasicRef.current(show);
    }
  }, [show, isMobile]);

  const logout = async () => {
    await logoutAction();
  };

  const navItems = [
    {
      label: "Usuarios",
      href: "/adm/usuarios",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  if (!loaded) return null;

  return (
    <>
      {/* Mobile hamburger button */}
      {!show && isMobile && (
        <button
          onClick={toggleShow}
          className="btn position-fixed"
          style={{
            top: "12px",
            left: "12px",
            zIndex: 1050,
            background: "var(--saluteca-ocean)",
            color: "white",
            border: "none",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* Mobile overlay backdrop */}
      {show && isMobile && (
        <div
          onClick={handleClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.4)",
            zIndex: 1040,
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className={styles.menuAdminContainer}
        style={{
          width: isMobile ? "280px" : "260px",
          left: show ? 0 : isMobile ? "-280px" : "-260px",
        }}
      >
        {/* Header */}
        <div className={`${styles.menuAdminHeader} d-flex justify-content-between align-items-center`}>
          <div className="d-flex align-items-center gap-2">
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, var(--saluteca-ocean-light) 0%, var(--saluteca-ocean) 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text-primary)" }}>
              Admin Panel
            </span>
          </div>
          {isMobile && (
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
              aria-label="Close"
              style={{ fontSize: "0.75rem" }}
            />
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-grow-1 p-3" style={{ overflowY: "auto" }}>
          <div className="d-flex flex-column gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="text-decoration-none"
                onClick={() => { if (isMobile) handleClose(); }}
              >
                <div
                  className="d-flex align-items-center gap-3 px-3 py-2"
                  style={{
                    borderRadius: "var(--radius-sm)",
                    fontWeight: pathname === item.href ? 600 : 500,
                    fontSize: "0.875rem",
                    color: pathname === item.href ? "white" : "var(--text-secondary)",
                    background: pathname === item.href
                      ? "linear-gradient(135deg, var(--saluteca-ocean-light) 0%, var(--saluteca-ocean) 100%)"
                      : "transparent",
                    boxShadow: pathname === item.href ? "var(--shadow-brand)" : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-3" style={{ borderTop: "0.5px solid var(--border-subtle)" }}>
          <button
            onClick={logout}
            className="d-flex align-items-center gap-3 px-3 py-2 w-100"
            style={{
              background: "transparent",
              border: "none",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
              color: "var(--text-secondary)",
              fontWeight: 500,
              fontSize: "0.875rem",
              transition: "all 0.2s ease",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default MenuAdmin;
