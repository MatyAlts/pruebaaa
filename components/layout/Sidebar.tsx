"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { signOut } from "next-auth/react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Cerrar sidebar en mobile cuando cambia la ruta
  useEffect(() => {
    if (onClose) {
      onClose();
    }
  }, [pathname]);

  const isActive = (path: string) => {
    if (path === "/app") {
      return pathname === "/app";
    }
    return pathname === path || pathname?.startsWith(path + "/");
  };

  const navItems = [
    {
      label: "Inicio",
      href: "/app",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 10L10 3L17 10V17C17 17.5304 16.7893 18.0391 16.4142 18.4142C16.0391 18.7893 15.5304 19 15 19H5C4.46957 19 3.96086 18.7893 3.58579 18.4142C3.21071 18.0391 3 17.5304 3 17V10Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "Estudios",
      href: "/app/studies",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V16C4 16.5304 4.21071 17.0391 4.58579 17.4142C4.96086 17.7893 5.46957 18 6 18H14C14.5304 18 15.0391 17.7893 15.4142 17.4142C15.7893 17.0391 16 16.5304 16 16V7L13 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M13 2V7H16"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "Grupo Familiar",
      href: "/app/family",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M14 6C14 7.65685 12.6569 9 11 9C9.34315 9 8 7.65685 8 6C8 4.34315 9.34315 3 11 3C12.6569 3 14 4.34315 14 6Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5 17C5 14.7909 6.79086 13 9 13H13C15.2091 13 17 14.7909 17 17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 9C6 10.1046 5.10457 11 4 11C2.89543 11 2 10.1046 2 9C2 7.89543 2.89543 7 4 7C5.10457 7 6 7.89543 6 9Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3 17C3 15.3431 4.34315 14 6 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "Configuración",
      href: "/app/settings",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 12C11.1046 12 12 11.1046 12 10C12 8.89543 11.1046 8 10 8C8.89543 8 8 8.89543 8 10C8 11.1046 8.89543 12 10 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16.3199 12C16.2188 12.3016 16.2095 12.6253 16.2929 12.9321C16.3763 13.2388 16.5491 13.5151 16.7899 13.726L16.8399 13.776C17.0315 13.9676 17.1834 14.1943 17.2873 14.4433C17.3912 14.6923 17.4451 14.9589 17.4451 15.228C17.4451 15.4971 17.3912 15.7637 17.2873 16.0127C17.1834 16.2617 17.0315 16.4884 16.8399 16.68C16.6484 16.8715 16.4217 17.0234 16.1727 17.1273C15.9237 17.2312 15.6571 17.2851 15.3879 17.2851C15.1188 17.2851 14.8522 17.2312 14.6032 17.1273C14.3542 17.0234 14.1275 16.8715 13.9359 16.68L13.8859 16.63C13.675 16.3892 13.3988 16.2164 13.092 16.133C12.7852 16.0496 12.4615 16.0589 12.1599 16.16C11.8637 16.2561 11.6008 16.4346 11.4018 16.6752C11.2028 16.9159 11.0757 17.2088 11.0349 17.52V17.72C11.0349 18.2652 10.8184 18.7878 10.4339 19.1728C10.0489 19.5573 9.52631 19.7738 8.98115 19.7738C8.43598 19.7738 7.91342 19.5573 7.52842 19.1728C7.14342 18.7878 6.92688 18.2652 6.92688 17.72V17.64C6.88014 17.3184 6.74139 17.0177 6.52564 16.7743C6.30989 16.5308 6.02611 16.3551 5.70988 16.268C5.40826 16.1846 5.08463 16.1939 4.78785 16.2951C4.49107 16.3964 4.22988 16.5857 4.03488 16.84L3.98488 16.89C3.79332 17.0815 3.56662 17.2334 3.31762 17.3373C3.06862 17.4412 2.80202 17.4951 2.53288 17.4951C2.26375 17.4951 1.99715 17.4412 1.74815 17.3373C1.49915 17.2334 1.27245 17.0815 1.08088 16.89C0.889344 16.6984 0.737419 16.4717 0.633516 16.2227C0.529613 15.9737 0.475708 15.7071 0.475708 15.438C0.475708 15.1689 0.529613 14.9023 0.633516 14.6533C0.737419 14.4043 0.889344 14.1776 1.08088 13.986L1.13088 13.936C1.37176 13.7251 1.54451 13.4489 1.62793 13.1421C1.71135 12.8353 1.70204 12.5116 1.60088 12.21C1.50481 11.9138 1.3263 11.6509 1.08565 11.4519C0.845004 11.2529 0.552101 11.1258 0.240883 11.085H0.0408828C-0.504276 11.085 -1.02684 10.8684 -1.41184 10.4839C-1.79684 10.0989 -2.01337 9.57631 -2.01337 9.03115C-2.01337 8.48598 -1.79684 7.96342 -1.41184 7.57842C-1.02684 7.19342 -0.504276 6.97688 0.0408828 6.97688H0.120883C0.442543 6.93014 0.743209 6.79139 0.986676 6.57564C1.23014 6.35989 1.4059 6.07611 1.49288 5.75988C1.5936 5.45826 1.58431 5.13463 1.48301 4.83785C1.38171 4.54107 1.19242 4.27988 0.938883 4.08488L0.888883 4.03488C0.697344 3.84332 0.545419 3.61662 0.441516 3.36762C0.337613 3.11862 0.283708 2.85202 0.283708 2.58288C0.283708 2.31375 0.337613 2.04715 0.441516 1.79815C0.545419 1.54915 0.697344 1.32245 0.888883 1.13088C1.08045 0.939344 1.30715 0.787419 1.55615 0.683516C1.80515 0.579613 2.07175 0.525708 2.34088 0.525708C2.61002 0.525708 2.87662 0.579613 3.12562 0.683516C3.37462 0.787419 3.60132 0.939344 3.79288 1.13088L3.84288 1.18088C4.05377 1.42176 4.32994 1.59451 4.63672 1.67793C4.94351 1.76135 5.26714 1.75204 5.56888 1.65088H5.60088C5.89711 1.55481 6.16005 1.3763 6.35903 1.13565C6.55801 0.895004 6.68512 0.602101 6.72588 0.290883V0.0908828C6.72588 -0.454276 6.94242 -0.976839 7.32742 -1.36184C7.71242 -1.74684 8.23498 -1.96337 8.78015 -1.96337C9.32531 -1.96337 9.84788 -1.74684 10.2329 -1.36184C10.6179 -0.976839 10.8344 -0.454276 10.8344 0.0908828V0.170883C10.8752 0.48210 11.0023 0.775004 11.2013 1.01565C11.4003 1.2563 11.6632 1.43481 11.9594 1.53088C12.261 1.6316 12.5847 1.62231 12.8814 1.52101C13.1782 1.41971 13.4394 1.23042 13.6344 0.976883L13.6844 0.926883C13.876 0.735344 14.1027 0.583419 14.3517 0.479516C14.6007 0.375613 14.8673 0.321708 15.1364 0.321708C15.4056 0.321708 15.6722 0.375613 15.9212 0.479516C16.1702 0.583419 16.3969 0.735344 16.5884 0.926883C16.78 1.11845 16.9319 1.34515 17.0358 1.59415C17.1397 1.84315 17.1936 2.10975 17.1936 2.37888C17.1936 2.64802 17.1397 2.91462 17.0358 3.16362C16.9319 3.41262 16.78 3.63932 16.5884 3.83088V3.88088C16.3475 4.09177 16.1748 4.36794 16.0913 4.67472C16.0079 4.98151 16.0172 5.30514 16.1184 5.60688V5.63888C16.2145 5.93511 16.393 6.19805 16.6336 6.39703C16.8743 6.59601 17.1672 6.72312 17.4784 6.76388H17.6784C18.2236 6.76388 18.7462 6.98042 19.1312 7.36542C19.5162 7.75042 19.7327 8.27298 19.7327 8.81815C19.7327 9.36331 19.5162 9.88588 19.1312 10.2709C18.7462 10.6559 18.2236 10.8724 17.6784 10.8724H17.5984C17.2872 10.9132 16.9943 11.0403 16.7536 11.2393C16.513 11.4383 16.3345 11.7012 16.2384 11.9974"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      <aside
        className={`sidebar d-flex flex-column ${isOpen ? "sidebar-open" : "sidebar-closed"}`}
        style={{
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 1000,
          overflow: "hidden",
          background: "var(--surface-0)",
          borderRight: "0.5px solid var(--border-default)",
        }}
      >
        {/* Logo */}
        <div
          className="p-4 d-flex align-items-center justify-content-between"
          style={{ borderBottom: "0.5px solid var(--border-subtle)" }}
        >
          <Link
            href="/"
            className="text-decoration-none d-flex align-items-center gap-2 gap-md-3"
          >
            <img
              src="/images/Logo_Saluteca_AzulNew.png"
              alt="Mi Saluteca"
              className="d-block"
              style={{ width: "32px", height: "32px", objectFit: "contain" }}
            />
            <img
              src="/images/Recurso 21Logo_Mi Saluteca_AzulNew.png"
              alt="Mi Saluteca"
              className="d-block"
              style={{ height: "22px", objectFit: "contain" }}
            />
          </Link>

          {/* Close button for mobile */}
          <button
            className="btn btn-link d-md-none text-dark sidebar-close-btn"
            onClick={onClose}
            aria-label="Cerrar menú"
            style={{ padding: 0, marginRight: "-8px" }}
            suppressHydrationWarning
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="flex-grow-1 p-3"
          style={{ overflowY: "auto", minHeight: 0 }}
        >
          <ul className="list-unstyled mb-0">
            {navItems.map((item) => (
              <li key={item.href} className="mb-2">
                <Link
                  href={item.href}
                  className={`d-flex align-items-center gap-3 px-3 py-3 text-decoration-none ${
                    isActive(item.href)
                      ? "text-white"
                      : "text-dark sidebar-link"
                  }`}
                  style={{
                    transition:
                      "all var(--duration-normal) var(--ease-default)",
                    fontWeight: isActive(item.href) ? 600 : 500,
                    fontSize: "var(--text-sm)",
                    borderRadius: "var(--radius-md)",
                    background: isActive(item.href)
                      ? "linear-gradient(135deg, var(--saluteca-ocean-light) 0%, var(--saluteca-ocean) 100%)"
                      : "transparent",
                    boxShadow: isActive(item.href)
                      ? "var(--shadow-brand)"
                      : "none",
                  }}
                >
                  <span
                    className={
                      isActive(item.href) ? "text-white" : "text-muted-saluteca"
                    }
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sign out */}
        <div
          className="p-3"
          style={{ borderTop: "0.5px solid var(--border-subtle)" }}
        >
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="d-flex align-items-center gap-3 px-3 py-3 w-100 sidebar-link"
            style={{
              transition: "all var(--duration-normal) var(--ease-default)",
              fontWeight: 500,
              fontSize: "var(--text-sm)",
              borderRadius: "var(--radius-md)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
            suppressHydrationWarning
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 17L21 12L16 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M21 12H9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
