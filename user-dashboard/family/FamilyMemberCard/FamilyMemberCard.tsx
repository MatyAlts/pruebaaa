"use client";

import Link from "next/link";
import { Card } from "react-bootstrap";
import { formatDate } from "@/lib/formatters";
import { RELATION_LABELS, FamilyMember } from "@/types";
import styles from "./FamilyMemberCard.module.css";
import FamilyMemberActions from "../FamilyMemberActions";

interface FamilyMemberCardProps {
  member: FamilyMember;
}

export default function FamilyMemberCard({ member }: FamilyMemberCardProps) {
  const studyCount = member.studyCount ?? 0;
  const lastStudyDate = member.lastStudyDate;

  return (
    <Card className={`${styles.cardSaluteca} h-100`}>
      <Card.Body className="d-flex flex-column">
        <div className="d-flex align-items-start gap-3 mb-3">
          <div
            className="bg-secondary-saluteca d-flex align-items-center justify-content-center text-white fw-semibold flex-shrink-0"
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              fontSize: "1.25rem",
            }}
          >
            {member.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>

          <div className="flex-grow-1" style={{ minWidth: 0 }}>
            <h3 className="h6 fw-semibold mb-1">{member.name}</h3>
            <p className="text-muted-saluteca mb-0" style={{ fontSize: "0.875rem" }}>
              {RELATION_LABELS[member.relation]}
              {member.age && ` • ${member.age} años`}
            </p>
          </div>

          <FamilyMemberActions member={member} />
        </div>

        {member.notes && (
          <p
            className="text-muted mb-3"
            style={{
              fontSize: "0.875rem",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {member.notes}
          </p>
        )}

        {studyCount > 0 ? (
          <>
            <div
              className="d-flex gap-3 mb-3 pb-3"
              style={{ borderBottom: "1px solid var(--border-default)" }}
            >
              <div>
                <div className="text-muted-saluteca" style={{ fontSize: "0.75rem" }}>
                  Estudios
                </div>
                <div className="fw-semibold" style={{ fontSize: "1.25rem" }}>
                  {studyCount}
                </div>
              </div>
              <div>
                <div className="text-muted-saluteca" style={{ fontSize: "0.75rem" }}>
                  Último
                </div>
                <div className="fw-medium" style={{ fontSize: "0.875rem" }}>
                  {lastStudyDate ? formatDate(lastStudyDate) : "—"}
                </div>
              </div>
            </div>

            <Link
              href={`/app/family/${member.uuid}`}
              className="btn btn-primary-saluteca w-100 mt-auto"
              style={{ fontSize: "0.875rem" }}
              prefetch={false}
            >
              Ver estudios
            </Link>
          </>
        ) : (
          <>
            <div
              className="text-center py-2 mb-3"
              style={{ borderBottom: "1px solid var(--border-default)" }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mb-2"
                style={{ opacity: 0.3 }}
              >
                <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 2V8H20" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-muted" style={{ fontSize: "0.8125rem" }}>
                Aún no tiene estudios cargados
              </div>
            </div>

            <Link
              href={`/app/family/${member.uuid}`}
              className="btn btn-primary-saluteca w-100 mt-auto d-flex align-items-center justify-content-center gap-2"
              style={{ fontSize: "0.875rem" }}
              prefetch={false}
            >
              {/* <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 3.33337V12.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3.33337 8H12.6667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg> */}
              Cargar primer estudio
            </Link>
          </>
        )}
      </Card.Body>
    </Card>
  );
}
