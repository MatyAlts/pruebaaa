"use client";

interface TopbarProps {
  title: string;
  action?: React.ReactNode;
  onMenuClick?: () => void;
}

export default function Topbar({ title, action, onMenuClick }: TopbarProps) {
  return (
    <header
      className="bg-white border-bottom d-flex align-items-center justify-content-between px-3 px-md-4 py-3"
      style={{
        height: "64px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div className="d-flex align-items-center gap-3">
        {/* Hamburger menu for mobile */}
        <button
          className="btn btn-link d-md-none p-0 text-dark"
          onClick={onMenuClick}
          aria-label="Abrir menú"
          style={{ fontSize: "1.5rem", lineHeight: 1 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <h1 className="h5 h4-md mb-0 fw-semibold text-dark">{title}</h1>
      </div>

      {action && <div className="d-flex align-items-center">{action}</div>}
    </header>
  );
}
