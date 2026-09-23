"use client";

import { Button } from "react-bootstrap";
import StudyRow from "@/user-dashboard/home/StudyRow";
import type { Study } from "@/types";

interface FamilyStudiesListProps {
  studies: Study[];
  memberName: string;
  hasFilters: boolean;
  onView: (study: Study) => void;
  onShare: (study: Study) => void;
  onUpload: () => void;
  onEdit: (study: Study) => void;
}

export default function FamilyStudiesList({
  studies,
  memberName,
  hasFilters,
  onView,
  onShare,
  onUpload,
  onEdit,
}: FamilyStudiesListProps) {
  if (studies.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M26 4H12C10.9391 4 9.92172 4.42143 9.17157 5.17157C8.42143 5.92172 8 6.93913 8 8V32C8 33.0609 8.42143 34.0783 9.17157 34.8284C9.92172 35.5786 10.9391 36 12 36H28C29.0609 36 30.0783 35.5786 30.8284 34.8284C31.5786 34.0783 32 33.0609 32 32V14L26 4Z"
              stroke="var(--saluteca-gray)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M26 4V14H32"
              stroke="var(--saluteca-gray)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="empty-state-title">
          {!hasFilters ? "No hay estudios aún" : "No se encontraron resultados"}
        </h2>
        <p className="empty-state-description">
          {!hasFilters
            ? `Subí el primer estudio de ${memberName.split(" ")[0]}`
            : "Intentá con otros filtros de búsqueda"}
        </p>
        {!hasFilters && (
          <Button className="btn-primary-saluteca" onClick={onUpload}>
            Subir estudio
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="d-flex flex-column gap-1">
      {studies.map((study) => (
        <StudyRow
          key={study.id}
          study={study}
          onView={onView}
          onShare={onShare}
          onEdit={onEdit}
          hideOwner
        />
      ))}
    </div>
  );
}
