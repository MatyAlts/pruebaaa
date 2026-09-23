"use client";

import { useState } from "react";
import { Button, Card, Spinner, Form } from "react-bootstrap";
import { Study } from "@/types";
import { formatDate, formatFileSize } from "@/lib/formatters";

interface SharedStudyCardProps {
  study: Study;
  linkUuid: string;
}

export default function SharedStudyCard({
  study,
  linkUuid,
}: SharedStudyCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  
  const files = study.files || [];
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const activeFile = files[activeFileIndex];

  const previewUrl = activeFile?.id 
    ? `/api/preview-shared-study/${linkUuid}?fileId=${activeFile.id}` 
    : `/api/preview-shared-study/${linkUuid}`;
    
  const isImage = activeFile?.mimeType.startsWith("image/");
  const isPdf = activeFile?.mimeType === "application/pdf";

  const handleDownload = async () => {
    if (!activeFile) return;
    
    try {
      setIsDownloading(true);
      setError(null);

      const urlParams = activeFile.id ? `?fileId=${activeFile.id}` : "";
      const downloadUrl = `/api/download-shared-study/${linkUuid}${urlParams}`;

      const response = await fetch(downloadUrl);

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.errorType === "expired") {
          window.location.reload();
          return;
        }
        throw new Error(errorData.error || "Error al descargar el archivo");
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
    } catch (error) {
      console.error("Error:", error);
      setError(error instanceof Error ? error.message : "Error al descargar el estudio");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Card className="mb-4">
      <Card.Body className="p-4">
        {error && (
          <div className="mb-3 position-relative" style={{ background: "linear-gradient(135deg, var(--saluteca-danger-wash) 0%, #fecaca 100%)", border: "1px solid #fca5a5", borderRadius: "12px", padding: "16px 48px 16px 16px", animation: "slideDown 0.3s ease-out" }}>
            <div className="d-flex align-items-start gap-3">
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--saluteca-danger)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--saluteca-danger-text)", marginBottom: "4px" }}>
                  Error al descargar
                </div>
                <div style={{ fontSize: "0.875rem", color: "var(--saluteca-danger-text)", lineHeight: "1.5" }}>
                  {error}
                </div>
              </div>
            </div>
            <button onClick={() => setError(null)} style={{ position: "absolute", top: "16px", right: "16px", background: "transparent", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px" }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4L4 12M4 4L12 12" stroke="var(--saluteca-danger-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}

        <div className="d-flex align-items-start justify-content-between mb-3">
          <span className="text-muted" style={{ fontSize: "0.875rem" }}>
            {formatDate(study.date)}
          </span>
        </div>

        <h1 className="h4 fw-semibold mb-3">
          {study.title || "Estudio médico"}
        </h1>

        {study.description && (
          <p className="text-muted mb-4">{study.description}</p>
        )}

        <div className="bg-light rounded p-3 mb-4">
          <div className="row g-3">
            <div className="col-sm-6">
              <div className="text-muted" style={{ fontSize: "0.875rem" }}>Archivos</div>
              <div className="fw-medium">{files.length} adjuntos</div>
            </div>
            <div className="col-sm-6">
              <div className="text-muted" style={{ fontSize: "0.875rem" }}>Tamaño total</div>
              <div className="fw-medium">{formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}</div>
            </div>
          </div>
        </div>

        {/* Vista previa del archivo */}
        {activeFile && (
          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h6 fw-semibold mb-0">Vista previa</h2>
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
            <div
              className="bg-light rounded d-flex align-items-center justify-content-center overflow-hidden"
              style={{
                minHeight: isImage ? "200px" : "500px",
                maxHeight: isPdf ? "700px" : "600px",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
            >
              {isImage && !imageError ? (
                <img
                  src={previewUrl}
                  alt={study.title || "Estudio médico"}
                  onError={() => setImageError(true)}
                  style={{ maxWidth: "100%", maxHeight: "600px", objectFit: "contain", display: "block" }}
                />
              ) : isPdf ? (
                <iframe
                  src={previewUrl}
                  title={study.title || "Estudio médico"}
                  style={{ width: "100%", height: "700px", border: "none" }}
                />
              ) : (
                <div className="text-center p-5">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-3">
                    <path d="M40 8H16C14.9391 8 13.9217 8.42143 13.1716 9.17157C12.4214 9.92172 12 10.9391 12 12V52C12 53.0609 12.4214 54.0783 13.1716 54.8284C13.9217 55.5786 14.9391 56 16 56H48C49.0609 56 50.0783 55.5786 50.8284 54.8284C51.5786 54.0783 52 53.0609 52 52V20L40 8Z" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M40 8V20H52" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-muted mb-2">{activeFile.mimeType.split("/")[1]?.toUpperCase() || "ARCHIVO"}</p>
                  <p className="text-muted small mb-0">Descargá el archivo para visualizarlo</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="d-flex gap-2">
          <Button
            className="btn-primary-saluteca flex-grow-1"
            onClick={handleDownload}
            disabled={isDownloading || !activeFile}
          >
            {isDownloading ? (
              <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />Descargando</>
            ) : (
              <><svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="me-2" style={{ display: "inline" }}>
                  <path d="M2.66663 11.3333V12.6667C2.66663 13.0203 2.80711 13.3594 3.05716 13.6095C3.30721 13.8595 3.64634 14 3.99996 14H12C12.3536 14 12.6927 13.8595 12.9428 13.6095C13.1928 13.3594 13.3333 13.0203 13.3333 12.6667V11.3333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M4.66663 6.66667L7.99996 10L11.3333 6.66667" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8 10V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>Descargar archivo</>
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
