"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  action?: React.ReactNode;
}

export default function AppShell({ children, title, action }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <div
        className="flex-grow-1 app-shell-content"
        style={{
          transition: "margin-left 0.3s ease",
          backgroundColor: "#F8F9FA",
          width: "100%",
        }}
      >
        <Topbar title={title} action={action} onMenuClick={toggleSidebar} />

        <main className="p-3 p-md-4">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
            display: "none",
          }}
        />
      )}
    </div>
  );
}
