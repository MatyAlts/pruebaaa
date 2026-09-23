"use client";

import { useState } from "react";
import { Button } from "react-bootstrap";
import AddFamilyMemberModal from "@/components/modals/AddFamilyMemberModal";

export default function FamilyHeader() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <>
      <Button
        className="btn-primary-saluteca"
        onClick={() => setShowAddModal(true)}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="me-2"
          style={{ display: "inline" }}
        >
          <path
            d="M8 3.33337V12.6667"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.33337 8H12.6667"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Agregar Familiar
      </Button>

      <AddFamilyMemberModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
      />
    </>
  );
}
