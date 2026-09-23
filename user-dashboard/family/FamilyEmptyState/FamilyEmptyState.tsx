"use client";

import { Button } from "react-bootstrap";

interface FamilyEmptyStateProps {
  onAddClick: () => void;
}

export default function FamilyEmptyState({ onAddClick }: FamilyEmptyStateProps) {
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
            d="M23.3333 10C23.3333 13.6819 20.3486 16.6667 16.6667 16.6667C12.9848 16.6667 10 13.6819 10 10C10 6.31811 12.9848 3.33334 16.6667 3.33334C20.3486 3.33334 23.3333 6.31811 23.3333 10Z"
            stroke="var(--saluteca-gray)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M3.33337 33.3333C3.33337 26.7029 8.70301 21.3333 15.3334 21.3333H18C24.6304 21.3333 30 26.7029 30 33.3333"
            stroke="var(--saluteca-gray)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M30 15V25"
            stroke="var(--saluteca-gray)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M25 20H35"
            stroke="var(--saluteca-gray)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="empty-state-title">No hay familiares</h2>
      <p className="empty-state-description">
        Agregá a tus familiares para gestionar sus estudios médicos
      </p>
      <Button
        className="btn-primary-saluteca"
        onClick={onAddClick}
      >
        Agregar primer familiar
      </Button>
    </div>
  );
}
