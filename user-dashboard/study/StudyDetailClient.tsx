"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/layout/AppShell";
import { Button, Spinner, Form } from "react-bootstrap";
import { formatDate } from "@/lib/formatters";
import ShareModal from "@/components/modals/ShareModal";
import type { Study, FamilyMember } from "@/types";

interface StudyDetailClientProps {
  study: Study;
  familyMember: FamilyMember | null;
}

export default function StudyDetailClient({ study, familyMember }: StudyDetailClientProps) {
  const router = useRouter();
  const [showShareModal, setShowShareModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const files = study.files || [];
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const activeFile = files[activeFileIndex];

  const handleDownload = async (fileToDownload = activeFile) => {
    if (!study || !fileToDownload) return;

    try {
      setIsDownloading(true);

      const urlParams = fileToDownload.id ? `?fileId=${fileToDownload.id}` : "";
      const downloadUrl = `/api/download-study/${study.uuid}${urlParams}`;

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al descargar el archivo");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileToDownload.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "Error al descargar el estudio");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    // Para simplificar, descargamos uno por uno
    for (const file of files) {
      await handleDownload(file);
    }
  };

  return (
    <AppShell
      title={study.title || "Estudio médico"}
      action={
        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-saluteca"
            onClick={() => setShowShareModal(true)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-2" style={{ display: "inline" }}>
              <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 9L10 11" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 7L10 5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            Compartir
          </button>
          <Button
            className="btn-primary-saluteca"
            onClick={() => handleDownload(activeFile)}
            disabled={isDownloading || !activeFile}
          >
            {isDownloading ? (
              <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />Descargando</>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-2" style={{ display: "inline" }}>
                  <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M11.3333 5.33333L8 2L4.66667 5.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 2V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Descargar
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="mb-4">
        <Button variant="link" className="text-decoration-none text-primary-saluteca p-0" onClick={() => router.back()}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-1" style={{ display: "inline" }}>
            <path d="M12.6667 8H3.33337" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M8.00004 12.6667L3.33337 8.00004L8.00004 3.33337" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Volver
        </Button>
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <div className="card card-saluteca mb-4">
            <div className="card-body">
              <div className="d-flex align-items-start justify-content-between mb-3">
                <span className="text-muted-saluteca" style={{ fontSize: "0.875rem" }}>
                  {formatDate(study.date)}
                </span>
              </div>

              <h1 className="h4 fw-semibold mb-3">
                {study.title || "Estudio médico"}
              </h1>

              {familyMember && (
                <div className="d-flex align-items-center gap-2 mb-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="5" r="2.5" stroke="var(--saluteca-gray)" strokeWidth="1.5" />
                    <path d="M2 14C2 11.2386 4.23858 9 7 9H9C11.7614 9 14 11.2386 14 14" stroke="var(--saluteca-gray)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <span className="text-muted-saluteca">
                    Estudio de {familyMember.name}
                  </span>
                </div>
              )}

              {study.description && (
                <div>
                  <h2 className="h6 fw-semibold mb-2">Descripción</h2>
                  <p className="text-muted mb-0">{study.description}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card card-saluteca">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h6 fw-semibold mb-0">Vista previa del archivo</h2>
                {files.length > 1 && (
                  <Form.Select 
                    size="sm" 
                    className="w-auto border-saluteca"
                    value={activeFileIndex}
                    onChange={(e) => setActiveFileIndex(Number(e.target.value))}
                  >
                    {files.map((f, idx) => (
                      <option key={idx} value={idx}>{f.fileName}</option>
                    ))}
                  </Form.Select>
                )}
              </div>

              {activeFile ? (
                <div className="bg-light rounded d-flex align-items-center justify-content-center" style={{ minHeight: "400px" }}>
                  {activeFile.fileName.endsWith(".pdf") ? (
                    <div className="text-center">
                      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
                        <path d="M40 8H16C14.9391 8 13.9217 8.42143 13.1716 9.17157C12.4214 9.92172 12 10.9391 12 12V52C12 53.0609 12.4214 54.0783 13.1716 54.8284C13.9217 55.5786 14.9391 56 16 56H48C49.0609 56 50.0783 55.5786 50.8284 54.8284C51.5786 54.0783 52 53.0609 52 52V20L40 8Z" stroke="var(--saluteca-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M40 8V20H52" stroke="var(--saluteca-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <text x="32" y="38" textAnchor="middle" fill="var(--saluteca-primary)" fontSize="12" fontWeight="600">PDF</text>
                      </svg>
                      <p className="text-muted mb-3">Archivo PDF</p>
                      <Button className="btn-primary-saluteca" onClick={() => handleDownload(activeFile)} disabled={isDownloading}>
                        {isDownloading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />Descargando</> : "Descargar PDF"}
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
                        <path d="M8 48L24 32L36 44L56 24" stroke="var(--saluteca-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="50" cy="18" r="4" fill="var(--saluteca-teal)" />
                      </svg>
                      <p className="text-muted mb-0">Archivo de imagen</p>
                      <Button className="btn-primary-saluteca mt-3" onClick={() => handleDownload(activeFile)} disabled={isDownloading}>
                        {isDownloading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />Descargando</> : "Descargar Imagen"}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-light rounded d-flex align-items-center justify-content-center p-4 text-muted">
                  No hay archivos disponibles.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card card-saluteca mb-4">
            <div className="card-body">
              <h2 className="h6 fw-semibold mb-3">Acciones</h2>
              <div className="d-grid gap-2">
                <button type="button" className="btn btn-outline-saluteca" onClick={() => setShowShareModal(true)}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-2" style={{ display: "inline" }}>
                    <circle cx="12" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="4" cy="8" r="2" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6 9L10 11" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M6 7L10 5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  Compartir estudio
                </button>
                <button type="button" className="btn btn-outline-saluteca" onClick={handleDownloadAll} disabled={isDownloading || files.length === 0}>
                  {isDownloading ? (
                    <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />Descargando</>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-2" style={{ display: "inline" }}>
                        <path d="M14 10V12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M11.3333 5.33333L8 2L4.66667 5.33333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 2V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {files.length > 1 ? "Descargar todos" : "Descargar archivo"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="card card-saluteca">
            <div className="card-body">
              <h2 className="h6 fw-semibold mb-3">Detalles</h2>
              <div className="d-flex flex-column gap-3" style={{ fontSize: "0.875rem" }}>
                <div>
                  <div className="text-muted-saluteca mb-1">Fecha</div>
                  <div className="fw-medium">{formatDate(study.date)}</div>
                </div>
                {familyMember && (
                  <div>
                    <div className="text-muted-saluteca mb-1">Paciente</div>
                    <div className="fw-medium">{familyMember.name}</div>
                  </div>
                )}
                {files.length > 0 && (
                  <div>
                    <div className="text-muted-saluteca mb-1">Archivos</div>
                    <div className="fw-medium">
                      {files.length} adjuntos
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <ShareModal
        show={showShareModal}
        onHide={() => setShowShareModal(false)}
        study={study}
      />
    </AppShell>
  );
}
