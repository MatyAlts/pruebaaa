"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Spinner, Form } from "react-bootstrap";
import { Study, FamilyMember } from "@/types";
import { formatDate } from "@/lib/formatters";
import toast from "react-hot-toast";
import ImageMagnifier from "@/components/ui/ImageMagnifier";

interface ViewStudyModalProps {
  show: boolean;
  onHide: () => void;
  study: Study;
  familyMembers?: FamilyMember[];
}

export default function ViewStudyModal({
  show,
  onHide,
  study,
  familyMembers = [],
}: ViewStudyModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Si no hay archivos, dejamos un array vacío
  const files = study.files || [];
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  
  const activeFile = files[activeFileIndex];

  const familyMember = study.familyMemberId
    ? familyMembers.find(fm => fm.id === study.familyMemberId)
    : null;

  // React hook to fetch the file for inline previewing without triggering download
  useEffect(() => {
    let activeUrl = "";

    if (show && study.uuid && activeFile) {
      setLoadingPreview(true);
      const urlParams = activeFile.id ? `?fileId=${activeFile.id}` : "";
      fetch(`/api/download-study/${study.uuid}${urlParams}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load");
          return res.blob();
        })
        .then((blob) => {
          let properBlob = blob;
          if (blob.type === "application/octet-stream" || !blob.type) {
            if (activeFile.fileName.toLowerCase().endsWith(".pdf")) {
              properBlob = new Blob([blob], { type: "application/pdf" });
            } else if (activeFile.fileName.toLowerCase().endsWith(".jpg") || activeFile.fileName.toLowerCase().endsWith(".jpeg")) {
              properBlob = new Blob([blob], { type: "image/jpeg" });
            } else if (activeFile.fileName.toLowerCase().endsWith(".png")) {
              properBlob = new Blob([blob], { type: "image/png" });
            }
          }
          activeUrl = window.URL.createObjectURL(properBlob);
          setPreviewUrl(activeUrl);
        })
        .catch((err) => console.error("Error loading preview:", err))
        .finally(() => setLoadingPreview(false));
    }

    return () => {
      if (activeUrl) {
        window.URL.revokeObjectURL(activeUrl);
      }
      setPreviewUrl(null);
    };
  }, [show, study.uuid, activeFile]);

  // Reset index when study changes
  useEffect(() => {
    setActiveFileIndex(0);
  }, [study.id, show]);

  const handleDownload = async () => {
    if (!activeFile) return;
    setDownloading(true);

    try {
      const urlParams = activeFile.id ? `?fileId=${activeFile.id}` : "";
      const response = await fetch(`/api/download-study/${study.uuid}${urlParams}`);

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || "Error al descargar el archivo.");
        setDownloading(false);
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = activeFile.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Archivo descargado exitosamente");
    } catch (error) {
      console.error("Error al descargar archivo:", error);
      toast.error("Error inesperado al descargar el archivo. Por favor, intentá nuevamente.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-semibold">
          {study.title || "Estudio médico"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-4">
        {/* Header Grid: Date and For Whom */}
        <div className="row mb-4 pb-3 border-bottom">
          <div className="col-sm-6 mb-3 mb-sm-0">
            <div className="text-muted mb-1" style={{ fontSize: "0.8125rem" }}>Fecha del estudio</div>
            <div className="fw-medium">
              {formatDate(study.date)}
            </div>
          </div>
          <div className="col-sm-6">
            <div className="text-muted mb-1" style={{ fontSize: "0.8125rem" }}>Paciente</div>
            {familyMember ? (
              <div className="d-flex align-items-center gap-2">
                <div
                  className="bg-secondary-saluteca d-flex align-items-center justify-content-center text-white fw-semibold"
                  style={{ width: "24px", height: "24px", borderRadius: "50%", fontSize: "0.7rem" }}
                >
                  {familyMember.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <span className="fw-medium">{familyMember.name}</span>
              </div>
            ) : (
              <span className="fw-medium">Para mí</span>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="row g-4 mb-4">
          {study.institution && (
            <div className="col-12 col-md-6">
              <div className="text-muted mb-1" style={{ fontSize: "0.8125rem" }}>Institución</div>
              <div className="fw-medium p-2 bg-light rounded" style={{ fontSize: "0.9375rem" }}>
                {study.institution}
              </div>
            </div>
          )}
          {study.medico && (
            <div className="col-12 col-md-6">
              <div className="text-muted mb-1" style={{ fontSize: "0.8125rem" }}>Médico</div>
              <div className="fw-medium p-2 bg-light rounded" style={{ fontSize: "0.9375rem" }}>
                {study.medico}
              </div>
            </div>
          )}
        </div>

        {study.conclusion && (
          <div className="mb-4">
            <div className="text-muted mb-1" style={{ fontSize: "0.8125rem" }}>Observaciones / Informe</div>
            <div className="p-3 bg-light rounded border" style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}>
              {study.conclusion}
            </div>
          </div>
        )}

        {study.description && (
          <div className="mb-4">
            <div className="text-muted mb-1" style={{ fontSize: "0.8125rem" }}>Notas adicionales</div>
            <p className="mb-0 text-dark" style={{ fontSize: "0.9375rem", lineHeight: 1.6 }}>
              {study.description}
            </p>
          </div>
        )}

        {/* File Preview */}
        {files.length > 0 && activeFile && (
          <div className="mb-3">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-2 gap-2">
              <div className="fw-semibold text-muted" style={{ fontSize: "0.875rem" }}>
                Visualización del Documento ({activeFileIndex + 1} de {files.length})
              </div>
              
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

              <button
                type="button"
                className="btn btn-outline-saluteca btn-sm d-flex align-items-center gap-2"
                onClick={handleDownload}
                disabled={downloading}
              >
                {downloading ? (
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 15L12 3M12 15L8 11M12 15L16 11M2 17L2 20C2 20.5523 2.44772 21 3 21L21 21C21.5523 21 22 20.5523 22 20L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                Descargar original
              </button>
            </div>

            <div
              className="w-100 border rounded overflow-hidden position-relative d-flex justify-content-center align-items-center"
              style={{ minHeight: "200px", maxHeight: "600px", backgroundColor: "var(--surface-canvas)" }}
            >
              {loadingPreview ? (
                <div className="text-center text-muted p-5">
                  <Spinner animation="border" className="mb-3" style={{ color: "var(--saluteca-ocean)" }} />
                  <div>Cargando vista previa...</div>
                </div>
              ) : previewUrl ? (
                activeFile.fileName.toLowerCase().endsWith(".pdf") || activeFile.mimeType?.includes("pdf") ? (
                  <iframe
                    src={previewUrl}
                    className="w-100 border-0"
                    style={{ height: "600px" }}
                    title="PDF Preview"
                  />
                ) : (
                  <ImageMagnifier
                    src={previewUrl}
                    alt="Vista previa del estudio"
                    zoomLevel={2.5}
                    lensSize={120}
                    style={{ width: "100%", maxHeight: "600px" }}
                  />
                )
              ) : (
                <div className="text-center text-muted p-5">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mb-3 opacity-50">
                    <path d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div>No se pudo cargar la vista previa. Por favor, descargá el archivo.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Uploaded info */}
        <div className="text-muted" style={{ fontSize: "0.8125rem" }}>
          Subido el {formatDate(study.createdAt)}
        </div>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <button type="button" className="btn btn-secondary-saluteca" onClick={onHide}>
          Cerrar
        </button>
      </Modal.Footer>
    </Modal>
  );
}
