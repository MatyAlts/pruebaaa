"use client";

import { Button } from "react-bootstrap";

interface HomeEmptyStateProps {
  onUploadClick: () => void;
}

export default function HomeEmptyState({ onUploadClick }: HomeEmptyStateProps) {
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
          <path
            d="M20 18V28"
            stroke="var(--saluteca-gray)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M15 23H25"
            stroke="var(--saluteca-gray)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="empty-state-title">Aún no hay estudios</h2>
      <p className="empty-state-description">
        Comienza subiendo tu primer estudio médico para mantener todo organizado
      </p>
      <Button className="btn-primary-saluteca" onClick={onUploadClick}>
        Subir tu primer estudio
      </Button>
    </div>
  );
}
