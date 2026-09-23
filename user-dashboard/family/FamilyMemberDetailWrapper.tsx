"use client";

import { useState } from "react";

import Link from "next/link";
import UploadStudyModal from "@/components/modals/UploadStudyModal";
import FamilyMemberDetail from "./FamilyMemberDetail";
import type { FamilyMember, Study } from "@/types";

interface FamilyMemberDetailWrapperProps {
  member: FamilyMember;
  familyMembers: FamilyMember[];
  studies: Study[];
  studyCount: number;
  lastStudyDate: string | null;
}

export default function FamilyMemberDetailWrapper({
  member,
  familyMembers,
  studies,
  studyCount,
  lastStudyDate = null
}: FamilyMemberDetailWrapperProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <>
      {/* Header Actions */}
      <div className="d-flex gap-2 align-items-center mb-4">
        <Link href="/app/family" className="btn btn-outline-saluteca rounded-pill d-flex align-items-center">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="me-1"
            style={{ display: "inline" }}
          >
            <path
              d="M12.6667 8H3.33337"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8.00004 12.6667L3.33337 8.00004L8.00004 3.33337"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Volver
        </Link>
        <button
          type="button"
          className="btn btn-primary-saluteca rounded-pill d-flex align-items-center"
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
        </button>
      </div>

      <FamilyMemberDetail
        member={member}
        studies={studies}
        studyCount={studyCount}
        lastStudyDate={lastStudyDate}
        familyMembers={familyMembers}
        onUploadClick={() => setShowUploadModal(true)}
      />

      {/* Modal de carga global */}
      <UploadStudyModal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        familyMembers={familyMembers}
        familyMemberId={member.id}
      />
    </>
  );
}
