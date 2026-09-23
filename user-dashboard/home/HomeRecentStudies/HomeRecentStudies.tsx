"use client";

import { Study, FamilyMember } from "@/types";
import StudyRow from "../StudyRow";
import Link from "next/link";

interface HomeRecentStudiesProps {
  studies: Study[];
  familyMembers: FamilyMember[];
  onEdit: (study: Study) => void;
  onView: (study: Study) => void;
  onShare: (study: Study) => void;
}

export default function HomeRecentStudies({
  studies,
  familyMembers,
  onEdit,
  onView,
  onShare,
}: HomeRecentStudiesProps) {
  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h2 className="h5 mb-0 fw-semibold">Estudios recientes</h2>
        <Link
          href="/app/studies"
          className="text-primary-saluteca text-decoration-none fw-medium"
          style={{ fontSize: "1rem" }}
        >
          Ver todos →
        </Link>
      </div>

      <div className="d-flex flex-column gap-1">
        {studies.map((study) => (
          <StudyRow
            key={study.id}
            study={study}
            familyMembers={familyMembers}
            onEdit={onEdit}
            onView={onView}
            onShare={onShare}
          />
        ))}
      </div>
    </>
  );
}
