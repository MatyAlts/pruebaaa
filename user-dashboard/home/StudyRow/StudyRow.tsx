"use client";

import { useSession } from "next-auth/react";
import { Study, FamilyMember } from "@/types";
import { formatDate } from "@/lib/formatters";
import styles from "./StudyRow.module.css";

interface StudyRowProps {
  study: Study;
  familyMembers?: FamilyMember[];
  onEdit?: (study: Study) => void;
  onView: (study: Study) => void;
  onShare: (study: Study) => void;
  hideOwner?: boolean;
}

export default function StudyRow({ study, familyMembers, onEdit, onView, onShare, hideOwner = false }: StudyRowProps) {
  const { data: session } = useSession();

  const familyMember = study.familyMemberId && familyMembers
    ? familyMembers.find(fm => fm.id === study.familyMemberId)
    : null;

  const ownerName = familyMember
    ? familyMember.name
    : session?.user?.name ?? null;

  const files = study.files || [];
  const primaryFile = files[0];
  const isPdf = primaryFile?.fileName?.toLowerCase().endsWith(".pdf");

  return (
    <div className={styles.studyRowCard}>
      <div className="d-flex align-items-center gap-3 flex-wrap">
        {/* File type icon */}
        <div
          className="d-none d-md-flex align-items-center justify-content-center flex-shrink-0"
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "var(--radius-sm)",
            backgroundColor: isPdf ? "rgba(220, 38, 38, 0.08)" : "rgba(1, 99, 144, 0.08)",
          }}
        >
          {isPdf ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="var(--saluteca-danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 2V8H20" stroke="var(--saluteca-danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <text x="12" y="17" textAnchor="middle" fill="var(--saluteca-danger)" fontSize="6" fontWeight="700">PDF</text>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="18" height="18" rx="3" stroke="var(--saluteca-ocean)" strokeWidth="1.5" />
              <circle cx="8.5" cy="8.5" r="1.5" fill="var(--saluteca-ocean)" />
              <path d="M21 15L16 10L5 21" stroke="var(--saluteca-ocean)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        {/* Title and description */}
        <div className={`${styles.studyRowContent} flex-grow-1`}>
          <h3 className={styles.studyRowTitle}>
            {study.title || "Estudio médico"}
          </h3>
          {study.description && (
            <p className={styles.studyRowDescription}>{study.description}</p>
          )}
          {files.length > 1 && (
            <div className="d-flex align-items-center gap-1 mt-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="var(--saluteca-gray)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 2V8H20" stroke="var(--saluteca-gray)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 13H8" stroke="var(--saluteca-gray)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 17H8" stroke="var(--saluteca-gray)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 9H8" stroke="var(--saluteca-gray)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-muted-saluteca" style={{ fontSize: "0.825rem" }}>
                {files.length} archivos adjuntos
              </span>
            </div>
          )}
          {!hideOwner && ownerName && (
            <div className="d-flex align-items-center gap-1 mt-1">
              <svg
                width="11"
                height="11"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="7"
                  cy="4.5"
                  r="2.5"
                  stroke="var(--saluteca-gray)"
                  strokeWidth="1.5"
                />
                <path
                  d="M2 12C2 9.79086 3.79086 8 6 8H8C10.2091 8 12 9.79086 12 12"
                  stroke="var(--saluteca-gray)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span
                className="text-muted-saluteca"
                style={{ fontSize: "0.825rem" }}
              >
                {ownerName}
              </span>
            </div>
          )}
        </div>

        {/* Date */}
        <div className={styles.studyRowDate}>
          <span className="text-muted-saluteca" style={{ fontSize: "0.875rem" }}>
            {formatDate(study.date)}
          </span>
        </div>

        {/* Actions */}
        <div className={styles.studyRowActions}>
          {onEdit && (
            <button
              type="button"
              className="btn btn-primary-saluteca btn-sm"
              onClick={() => onEdit(study)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="me-1"
                style={{ display: "inline" }}
              >
                <path
                  d="M6.41667 2.33333H2.33333C2.02391 2.33333 1.72717 2.45625 1.5084 2.67504C1.28962 2.89383 1.16667 3.19058 1.16667 3.5V11.6667C1.16667 11.9761 1.28962 12.2728 1.5084 12.4916C1.72717 12.7104 2.02391 12.8333 2.33333 12.8333H10.5C10.8094 12.8333 11.1062 12.7104 11.325 12.4916C11.5437 12.2728 11.6667 11.9761 11.6667 11.6667V7.58333"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.7917 1.45833C11.0233 1.22672 11.3368 1.09717 11.6633 1.09717C11.9899 1.09717 12.3034 1.22672 12.535 1.45833C12.7666 1.68995 12.8962 2.00346 12.8962 2.33C12.8962 2.65654 12.7666 2.97006 12.535 3.20167L6.99999 8.73667L4.66666 9.33333L5.26332 7L10.7917 1.45833Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={styles.btnText}>Editar</span>
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary-saluteca btn-sm"
            onClick={() => onView(study)}
          >
            <span className={styles.btnText}>Ver</span>
          </button>
          <button
            type="button"
            className="btn btn-primary-saluteca btn-sm"
            onClick={() => onShare(study)}
          >
            <span className={styles.btnText}>Compartir</span>
          </button>
        </div>
      </div>
    </div>
  );
}
