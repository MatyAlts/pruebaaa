"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Button, Form, InputGroup } from "react-bootstrap";
import ShareModal from "@/components/modals/ShareModal";
import UploadStudyModal from "@/components/modals/UploadStudyModal";
import ViewStudyModal from "@/components/modals/ViewStudyModal";
import EditStudyModal from "@/components/modals/EditStudyModal";
import StudyRow from "@/user-dashboard/home/StudyRow";
import type { Study, FamilyMember } from "@/types";
import { parseDateFromDB } from "@/lib/formatters";
import moment from "moment";

interface StudiesPageClientProps {
  studies: Study[];
  familyMembers: FamilyMember[];
}

export default function StudiesPageClient({
  studies,
  familyMembers,
}: StudiesPageClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFamilyMember, setSelectedFamilyMember] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [medicoQuery, setMedicoQuery] = useState("");
  const [institutionQuery, setInstitutionQuery] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [shareStudy, setShareStudy] = useState<Study | null>(null);

  // Generate years array (from 2020 to current year + 1)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2019 + 1 },
    (_, i) => 2020 + i,
  );

  const months = [
    { value: "01", label: "Enero" },
    { value: "02", label: "Febrero" },
    { value: "03", label: "Marzo" },
    { value: "04", label: "Abril" },
    { value: "05", label: "Mayo" },
    { value: "06", label: "Junio" },
    { value: "07", label: "Julio" },
    { value: "08", label: "Agosto" },
    { value: "09", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  // Filter studies
  const filteredStudies = studies.filter((study) => {
    const matchesSearch =
      searchQuery === "" ||
      study.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFamilyMember =
      selectedFamilyMember === "" ||
      (selectedFamilyMember === "me" && !study.familyMemberId) ||
      study.familyMemberId === selectedFamilyMember;

    const matchesMedico =
      medicoQuery === "" ||
      study.medico?.toLowerCase().includes(medicoQuery.toLowerCase());

    const matchesInstitution =
      institutionQuery === "" ||
      study.institution?.toLowerCase().includes(institutionQuery.toLowerCase());

    const matchesDate =
      (!selectedMonth && !selectedYear) ||
      (() => {
        const studyDate = parseDateFromDB(study.date);
        const monthMatch =
          !selectedMonth ||
          studyDate.getMonth() + 1 === parseInt(selectedMonth);
        const yearMatch =
          !selectedYear || studyDate.getFullYear() === parseInt(selectedYear);
        return monthMatch && yearMatch;
      })();

    return (
      matchesSearch &&
      matchesFamilyMember &&
      matchesMedico &&
      matchesInstitution &&
      matchesDate
    );
  });

  // Sort by date (newest first)
  const sortedStudies = [...filteredStudies].sort((a, b) =>
    moment(b.date).diff(moment(a.date)),
  );

  return (
    <AppShell
      title="Estudios"
      action={
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
      }
    >
      {/* Search and Filters */}
      <div className="bg-white rounded-3 p-3 mb-4 border">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <InputGroup>
              <InputGroup.Text className="bg-white border-end-0">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="7.33333"
                    cy="7.33333"
                    r="4.66667"
                    stroke="var(--saluteca-gray)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14 14L10.6667 10.6667"
                    stroke="var(--saluteca-gray)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </InputGroup.Text>
              <Form.Control
                type="text"
                placeholder="Buscar estudios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-start-0"
                style={{ boxShadow: "none" }}
              />
            </InputGroup>
          </div>

          <div className="col-12 col-md-4">
            <Form.Control
              type="text"
              placeholder="Buscar por médico..."
              value={medicoQuery}
              onChange={(e) => setMedicoQuery(e.target.value)}
              style={{ boxShadow: "none" }}
            />
          </div>

          <div className="col-12 col-md-4">
            <Form.Control
              type="text"
              placeholder="Buscar por institución..."
              value={institutionQuery}
              onChange={(e) => setInstitutionQuery(e.target.value)}
              style={{ boxShadow: "none" }}
            />
          </div>

          <div className="col-12 col-md-4">
            <Form.Select
              value={selectedFamilyMember}
              onChange={(e) => setSelectedFamilyMember(e.target.value)}
              style={{ fontSize: "0.9rem" }}
            >
              <option value="">Todos (Mis estudios y familiares)</option>
              <option value="me">Mis estudios</option>
              {familyMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </Form.Select>
          </div>

          <div className="col-12 col-md-4 date-filter-month">
            <Form.Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ fontSize: "0.9rem" }}
            >
              <option value="">Mes</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </Form.Select>
          </div>

          <div className="col-12 col-md-4 date-filter-year">
            <Form.Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              style={{ fontSize: "0.9rem" }}
            >
              <option value="">Año</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </Form.Select>
          </div>
        </div>

        {/* Active filters display */}
        {(searchQuery ||
          medicoQuery ||
          institutionQuery ||
          selectedFamilyMember ||
          selectedMonth ||
          selectedYear) && (
            <div className="mt-3 pt-3 border-top">
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className="text-muted" style={{ fontSize: "0.875rem" }}>
                  Filtros activos:
                </span>
                {searchQuery && (
                  <span className="badge bg-light text-dark border">
                    Búsqueda: &quot;{searchQuery}&quot;
                    <button
                      className="btn-close btn-close-sm ms-2"
                      style={{ fontSize: "0.6rem" }}
                      onClick={() => setSearchQuery("")}
                      aria-label="Close"
                    />
                  </span>
                )}
                {medicoQuery && (
                  <span className="badge bg-light text-dark border">
                    Médico: &quot;{medicoQuery}&quot;
                    <button
                      className="btn-close btn-close-sm ms-2"
                      style={{ fontSize: "0.6rem" }}
                      onClick={() => setMedicoQuery("")}
                      aria-label="Close"
                    />
                  </span>
                )}
                {institutionQuery && (
                  <span className="badge bg-light text-dark border">
                    Institución: &quot;{institutionQuery}&quot;
                    <button
                      className="btn-close btn-close-sm ms-2"
                      style={{ fontSize: "0.6rem" }}
                      onClick={() => setInstitutionQuery("")}
                      aria-label="Close"
                    />
                  </span>
                )}
                {selectedFamilyMember && (
                  <span className="badge bg-light text-dark border">
                    {selectedFamilyMember === "me"
                      ? "Mis estudios"
                      : familyMembers.find((m) => m.id === selectedFamilyMember)
                        ?.name}
                    <button
                      className="btn-close btn-close-sm ms-2"
                      style={{ fontSize: "0.6rem" }}
                      onClick={() => setSelectedFamilyMember("")}
                      aria-label="Close"
                    />
                  </span>
                )}
                {(selectedMonth || selectedYear) && (
                  <span className="badge bg-light text-dark border">
                    {selectedMonth &&
                      months.find((m) => m.value === selectedMonth)?.label}
                    {selectedMonth && selectedYear && " "}
                    {selectedYear}
                    <button
                      className="btn-close btn-close-sm ms-2"
                      style={{ fontSize: "0.6rem" }}
                      onClick={() => {
                        setSelectedMonth("");
                        setSelectedYear("");
                      }}
                      aria-label="Close"
                    />
                  </span>
                )}
                <Button
                  variant="link"
                  className="text-danger p-0"
                  style={{ fontSize: "0.875rem" }}
                  onClick={() => {
                    setSearchQuery("");
                    setMedicoQuery("");
                    setInstitutionQuery("");
                    setSelectedFamilyMember("");
                    setSelectedMonth("");
                    setSelectedYear("");
                  }}
                >
                  Limpiar todos
                </Button>
              </div>
            </div>
          )}
      </div>

      {/* Results count */}
      <div className="mb-3">
        <p
          className="text-muted-saluteca mb-0"
          style={{ fontSize: "0.875rem" }}
        >
          {sortedStudies.length === 0
            ? "No se encontraron estudios"
            : sortedStudies.length === 1
              ? "1 estudio encontrado"
              : `${sortedStudies.length} estudios encontrados`}
        </p>
      </div>

      {/* Studies List */}
      {sortedStudies.length === 0 ? (
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
                d="M20 36.6667C29.2048 36.6667 36.6667 29.2048 36.6667 20C36.6667 10.7953 29.2048 3.33337 20 3.33337C10.7953 3.33337 3.33337 10.7953 3.33337 20C3.33337 29.2048 10.7953 36.6667 20 36.6667Z"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 13.3334V20.0001"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="20"
                cy="26.6667"
                r="1.5"
                fill="var(--saluteca-gray)"
              />
            </svg>
          </div>
          <h2 className="empty-state-title">No hay estudios</h2>
          <p className="empty-state-description">
            No se encontraron estudios con los filtros aplicados
          </p>
          <Button
            className="btn-primary-saluteca"
            onClick={() => {
              setSearchQuery("");
              setMedicoQuery("");
              setInstitutionQuery("");
              setSelectedFamilyMember("");
              setSelectedMonth("");
              setSelectedYear("");
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <div className="d-flex flex-column gap-1">
          {sortedStudies.map((study) => (
            <StudyRow
              key={study.id}
              study={study}
              familyMembers={familyMembers}
              onEdit={(study) => {
                setSelectedStudy(study);
                setShowEditModal(true);
              }}
              onView={(study) => {
                setShareStudy(study);
                setShowViewModal(true);
              }}
              onShare={(study) => setShareStudy(study)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <UploadStudyModal
        show={showUploadModal}
        onHide={() => setShowUploadModal(false)}
        familyMembers={familyMembers}
      />

      {selectedStudy && (
        <EditStudyModal
          show={showEditModal}
          onHide={() => setShowEditModal(false)}
          study={selectedStudy}
          familyMembers={familyMembers}
          onDelete={() => {
            // TODO: Implement delete
            setShowEditModal(false);
          }}
          onUpdate={(updatedStudy) => {
            // TODO: Implement update
            setShowEditModal(false);
          }}
        />
      )}

      {shareStudy && (
        <>
          <ViewStudyModal
            show={showViewModal}
            onHide={() => {
              setShowViewModal(false);
              setShareStudy(null);
            }}
            study={shareStudy}
            familyMembers={familyMembers}
          />
          <ShareModal
            show={!!shareStudy && !showViewModal}
            onHide={() => setShareStudy(null)}
            study={shareStudy}
          />
        </>
      )}
    </AppShell>
  );
}
