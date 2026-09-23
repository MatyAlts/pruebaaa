"use client";

import { useState } from "react";
import { Button } from "react-bootstrap";
import UploadStudyModal from "@/components/modals/UploadStudyModal";
import { FamilyMember } from "@/types";

interface HomeHeaderProps {
  familyMembers: FamilyMember[];
}

export default function HomeHeader({ familyMembers }: HomeHeaderProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <>
      <Button
        className="btn-primary-saluteca"
        onClick={() => setShowUploadModal(true)}
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
        Subir Estudio
      </Button>

      <UploadStudyModal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        familyMembers={familyMembers}
      />
    </>
  );
}
