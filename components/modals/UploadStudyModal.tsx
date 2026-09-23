"use client";

import { useState, useRef } from "react";
import { Modal, Button, Form, Spinner, Alert } from "react-bootstrap";
import { FamilyMember } from "@/types";
import { analyzeStudyWithAI } from "@/user-dashboard/server-actions/analyze-study";
import { extractTextFromFile } from "@/lib/ocr-utils";
import { quickValidateFileType } from "@/lib/file-validator";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import moment from "moment";
import { STUDY_FIELD_LIMITS } from "@/config/constants";

interface UploadStudyModalProps {
  show: boolean;
  onHide: () => void;
  familyMembers?: FamilyMember[];
  familyMemberId?: string; // If provided, preselect this family member
}

export default function UploadStudyModal({
  show,
  onHide,
  familyMembers = [],
  familyMemberId,
}: UploadStudyModalProps) {
  const router = useRouter();
  const modalTopRef = useRef<HTMLDivElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(moment().format("DD-MM-YYYY")); // Formato DD-MM-YYYY
  const [institution, setInstitution] = useState("");
  const [doctor, setDoctor] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState<string>(familyMemberId || "self");

  // Función para convertir DD-MM-YYYY a YYYY-MM-DD (para el input)
  const formatDateForInput = (dateStr: string): string => {
    const parsed = moment(dateStr, "DD-MM-YYYY", true);
    return parsed.isValid() ? parsed.format("YYYY-MM-DD") : "";
  };

  // Función para convertir YYYY-MM-DD a DD-MM-YYYY (desde el input)
  const formatDateFromInput = (dateStr: string): string => {
    const parsed = moment(dateStr, "YYYY-MM-DD", true);
    return parsed.isValid() ? parsed.format("DD-MM-YYYY") : "";
  };

  // Estados para el flujo de análisis
  const [ocrText, setOcrText] = useState<string>("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [ocrProgress, setOcrProgress] = useState<string>("");

  // Estado para el modal selector de IA
  const [showAISelector, setShowAISelector] = useState(false);
  const [fileForAI, setFileForAI] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = async (filesToProcess: FileList | File[]) => {
    const newFiles = Array.from(filesToProcess);

    if (selectedFiles.length + newFiles.length > 10) {
      setErrorMessage("Solo podés subir hasta 10 archivos por estudio.");
      return;
    }

    const validFiles: File[] = [];
    for (const file of newFiles) {
      const validation = await quickValidateFileType(file);
      if (!validation.isValid) {
        setErrorMessage(`El archivo ${file.name} no es válido: ${validation.error}`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setErrorMessage(null);
      setAnalyzed(false);
      setOcrText("");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
    }
    e.target.value = "";
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!(uploading || analyzing)) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (uploading || analyzing) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFiles(e.dataTransfer.files);
    }
  };

  // Botón inicial de completar con IA
  const handleInitiateAI = () => {
    if (selectedFiles.length === 0) return;

    if (selectedFiles.length === 1) {
      // Solo 1 archivo, analizamos ese directamente
      executeAnalysis(selectedFiles[0]);
    } else {
      // Más de 1 archivo, abrir modal para seleccionar
      // Preseleccionar PDF si existe
      const pdfFile = selectedFiles.find(f => f.name.toLowerCase().endsWith('.pdf'));
      setFileForAI(pdfFile || selectedFiles[0]);
      setShowAISelector(true);
    }
  };

  const executeAnalysis = async (targetFile: File) => {
    setShowAISelector(false);
    setAnalyzing(true);
    setErrorMessage(null);
    setOcrProgress("Iniciando análisis...");

    setTimeout(() => {
      if (modalTopRef.current) {
        modalTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);

    try {
      setOcrProgress(`Extrayendo texto de ${targetFile.name}...`);
      const ocrResult = await extractTextFromFile(targetFile, (progress) => {
        setOcrProgress(progress);
      });

      if (!ocrResult.success || !ocrResult.text) {
        setErrorMessage(ocrResult.error || "No se pudo extraer texto del documento.");
        setAnalyzing(false);
        setOcrProgress("");
        return;
      }

      setOcrText(ocrResult.text);
      setOcrProgress("Analizando documento con inteligencia artificial...");

      const analysisResult = await analyzeStudyWithAI(ocrResult.text);

      if (!analysisResult.success) {
        setErrorMessage(analysisResult.message || "Error al analizar el documento.");
        setAnalyzing(false);
        setOcrProgress("");
        return;
      }

      if (analysisResult.studyName && analysisResult.studyName.trim()) setTitle(analysisResult.studyName);
      if (analysisResult.institution && analysisResult.institution.trim()) setInstitution(analysisResult.institution);
      if (analysisResult.doctor && analysisResult.doctor.trim()) setDoctor(analysisResult.doctor);
      if (analysisResult.conclusion && analysisResult.conclusion.trim()) setConclusion(analysisResult.conclusion);
      if (analysisResult.studyDate && analysisResult.studyDate.trim()) setDate(analysisResult.studyDate);

      setAnalyzed(true);
      setAnalyzing(false);
      setOcrProgress("");
    } catch (error) {
      console.error("Error al analizar estudio:", error);
      setErrorMessage("Ocurrió un error al analizar el documento. Por favor, intentá nuevamente.");
      setAnalyzing(false);
      setOcrProgress("");
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      setErrorMessage("Por favor, seleccioná al menos un archivo.");
      setTimeout(() => {
        if (modalTopRef.current) modalTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      return;
    }

    setUploading(true);
    setErrorMessage(null);

    try {
      const finalTitle = title.trim() || `Estudio médico`;

      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append("files", file);
      });
      formData.append("title", finalTitle);
      formData.append("date", date); // Enviar en formato DD-MM-YYYY
      if (institution.trim()) formData.append("institution", institution.trim());
      if (doctor.trim()) formData.append("medico", doctor.trim());
      if (conclusion.trim()) formData.append("conclusion", conclusion.trim());
      if (description.trim()) formData.append("description", description.trim());
      formData.append("familyMemberId", owner);

      const response = await fetch('/api/upload-study', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setUploadSuccess(true);
        setUploading(false);
        toast.success("Estudio subido con éxito");
        router.refresh();
      } else {
        setErrorMessage(result.message || "Error al subir el estudio");
        setTimeout(() => {
          if (modalTopRef.current) modalTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
        setUploading(false);
      }
    } catch (error) {
      console.error("Error al subir estudio:", error);
      setErrorMessage("Ocurrió un error inesperado. Por favor, intentá nuevamente.");
      setTimeout(() => {
        if (modalTopRef.current) modalTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
      setUploading(false);
    }
  };

  const handleClose = () => {
    if ((uploading || analyzing) && !uploadSuccess) return;

    onHide();
    setTimeout(() => {
      setSelectedFiles([]);
      setTitle("");
      setDate(moment().format("DD-MM-YYYY"));
      setInstitution("");
      setDoctor("");
      setConclusion("");
      setDescription("");
      setOwner(familyMemberId || "self");
      setOcrText("");
      setAnalyzing(false);
      setAnalyzed(false);
      setOcrProgress("");
      setUploadSuccess(false);
      setErrorMessage(null);
      setUploading(false);
      setShowAISelector(false);
      setFileForAI(null);
    }, 750)
  };

  const isValid = selectedFiles.length > 0;

  return (
    <>
      <Modal show={show} onHide={handleClose} centered size="lg"
        fullscreen="sm-down"
        backdrop="static"
        style={{ zIndex: showAISelector ? 1040 : 1050 }}>
        <Modal.Header closeButton={!uploading && !analyzing} className="border-0 pb-0" ref={modalTopRef}>
          <Modal.Title className="h5 fw-semibold">
            {uploadSuccess ? "Estudio subido" : "Subir estudio médico"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleConfirm} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: "1 1 auto", minHeight: 0 }}>
          <Modal.Body style={{ overflowY: "auto", flex: "1 1 auto", minHeight: 0, paddingBottom: "1rem" }}>
            {uploadSuccess ? (
              <div className="text-center py-4">
                <div
                  className="d-inline-flex align-items-center justify-content-center mb-4"
                  style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "var(--saluteca-green-wash)" }}
                >
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M33.3333 10L15 28.3333L6.66667 20" stroke="var(--saluteca-green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h4 className="fw-semibold mb-3" style={{ color: "var(--saluteca-ocean-deep)" }}>
                  Estudio subido con éxito
                </h4>
                <p className="text-muted mb-4">Tu estudio médico ha sido guardado de forma segura y ya está disponible en tu historial.</p>
                <button type="button" className="btn btn-primary-saluteca" onClick={handleClose}>Aceptar</button>
              </div>
            ) : (
              <>
                {errorMessage && (
                  <div className="mb-3 p-3 rounded-3 position-relative" style={{ backgroundColor: 'rgba(254, 235, 238, 0.95)', border: '1px solid #FFCDD2' }}>
                    <div className="d-flex align-items-center">
                      <div className="d-flex align-items-center justify-content-center me-3" style={{ width: '32px', height: '32px', backgroundColor: '#EF5350', borderRadius: '50%', flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M10 6V10M10 14H10.01M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span style={{ color: '#B71C1C', fontSize: '0.9375rem', fontWeight: 500, flex: 1, paddingRight: '24px' }}>
                        {errorMessage}
                      </span>
                      <button type="button" onClick={() => setErrorMessage(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'none', border: 'none' }}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 4L4 12M4 4L12 12" stroke="var(--saluteca-danger-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {ocrProgress && analyzing && (
                  <div className="mb-3 p-3 rounded-3" style={{ backgroundColor: '#E3F2FD', border: '1px solid #90CAF9' }}>
                    <div className="d-flex align-items-center">
                      <Spinner animation="border" size="sm" className="me-3" style={{ color: '#016390' }} />
                      <span style={{ color: '#014A6B', fontWeight: 500 }}>{ocrProgress}</span>
                    </div>
                  </div>
                )}

                {analyzed && !analyzing && (
                  <div className="mb-3 p-3 rounded-3" style={{ backgroundColor: 'var(--saluteca-green-faint)', border: '1px solid rgba(122, 187, 133, 0.25)' }}>
                    <div className="d-flex align-items-center">
                      <div className="d-flex align-items-center justify-content-center me-3" style={{ width: '32px', height: '32px', backgroundColor: 'var(--saluteca-green)', borderRadius: '50%', flexShrink: 0 }}>
                        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M16.6667 5L7.5 14.1667L3.33333 10" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span style={{ color: 'var(--saluteca-green-dark)', fontWeight: 500 }}>
                        Análisis completado. Verificá y completá la información.
                      </span>
                    </div>
                  </div>
                )}

                {/* File Upload */}
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium mb-1">
                    Archivos ({selectedFiles.length}/10) <span className="text-danger">*</span>
                  </Form.Label>
                  <div
                    className="border border-2 border-dashed rounded p-3 text-center mb-2"
                    style={{
                      borderColor: isDragging ? "var(--saluteca-ocean)" : "var(--border-stronger)",
                      backgroundColor: isDragging ? "var(--saluteca-sky-faint)" : "var(--surface-inset)",
                      cursor: (uploading || analyzing || selectedFiles.length >= 10) ? "not-allowed" : "pointer",
                      opacity: (uploading || analyzing || selectedFiles.length >= 10) ? 0.6 : 1,
                    }}
                    onClick={() => !(uploading || analyzing || selectedFiles.length >= 10) && document.getElementById("fileInput")?.click()}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <svg width="36" height="36" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-2">
                      <path d="M24 16V32" stroke="var(--saluteca-gray)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M16 24H32" stroke="var(--saluteca-gray)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="24" cy="24" r="12" stroke="var(--saluteca-gray)" strokeWidth="2" strokeDasharray="4 4" />
                    </svg>
                    <div className="fw-medium mb-1">
                      {isDragging ? "Soltá los archivos aquí" : "Arrastrá archivos o hacé clic"}
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.875rem" }}>
                      PDF, JPG, PNG, DOCX (máx. 10 archivos)
                    </div>
                    <Form.Control
                      id="fileInput"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.docx"
                      multiple
                      onChange={handleFileChange}
                      className="d-none"
                      disabled={uploading || analyzing || selectedFiles.length >= 10}
                    />
                  </div>

                  {/* Selected Files List */}
                  {selectedFiles.length > 0 && (
                    <div className="d-flex flex-column gap-2 mt-3">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: "var(--saluteca-sky-faint)", border: "1px solid var(--saluteca-sky-wash)" }}>
                          <div className="d-flex align-items-center gap-3 overflow-hidden">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="var(--saluteca-ocean)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M14 2V8H20" stroke="var(--saluteca-ocean)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="text-truncate">
                              <div className="fw-medium text-dark text-truncate" style={{ fontSize: "0.9rem" }}>{file.name}</div>
                              <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn text-danger p-1 ms-2"
                            onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                            disabled={uploading || analyzing}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </Form.Group>

                {/* AI Analysis Button */}
                {selectedFiles.length > 0 && !analyzed && !analyzing && !uploading && (
                  <div className="mb-3">
                    <button
                      type="button"
                      className="btn w-100 d-flex align-items-center justify-content-center py-2 border-0"
                      onClick={handleInitiateAI}
                      style={{
                        background: "var(--saluteca-sky-faint)",
                        border: "1px solid var(--saluteca-sky)",
                        borderRadius: "var(--radius-md)",
                        color: "var(--saluteca-ocean-deep)",
                        boxShadow: "0 1px 2px rgba(1, 99, 144, 0.05)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="me-2" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 11L19.85 8.65L17.5 7.5L19.85 6.35L21 4L22.15 6.35L24.5 7.5L22.15 8.65L21 11ZM6.5 24L4.35 19.15L0 17L4.35 14.85L6.5 10L8.65 14.85L13 17L8.65 19.15L6.5 24ZM16.5 17L15.35 14.65L13 13.5L15.35 12.35L16.5 10L17.65 12.35L20 13.5L17.65 14.65L16.5 17Z" fill="var(--saluteca-ocean)" />
                      </svg>
                      <span className="fw-semibold">Completar datos con Inteligencia Artificial</span>
                    </button>
                  </div>
                )}

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-medium">Fecha <span className="text-muted">(opcional)</span></Form.Label>
                      <Form.Control
                        type="date"
                        value={formatDateForInput(date)}
                        onChange={(e) => setDate(formatDateFromInput(e.target.value))}
                        max={new Date().toISOString().split("T")[0]}
                        disabled={uploading || analyzing}
                      />
                    </Form.Group>
                  </div>

                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-medium">Nombre del estudio <span className="text-muted">(opcional)</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={STUDY_FIELD_LIMITS.title}
                        disabled={uploading || analyzing}
                      />
                    </Form.Group>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-medium">Institución <span className="text-muted">(opcional)</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={institution}
                        onChange={(e) => setInstitution(e.target.value)}
                        maxLength={STUDY_FIELD_LIMITS.institution}
                        disabled={uploading || analyzing}
                      />
                    </Form.Group>
                  </div>

                  <div className="col-md-6">
                    <Form.Group>
                      <Form.Label className="fw-medium">Médico <span className="text-muted">(opcional)</span></Form.Label>
                      <Form.Control
                        type="text"
                        value={doctor}
                        onChange={(e) => setDoctor(e.target.value)}
                        maxLength={STUDY_FIELD_LIMITS.doctor}
                        disabled={uploading || analyzing}
                      />
                    </Form.Group>
                  </div>
                </div>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Observaciones <span className="text-muted">(opcional)</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={conclusion}
                    onChange={(e) => setConclusion(e.target.value)}
                    maxLength={STUDY_FIELD_LIMITS.conclusion}
                    disabled={uploading || analyzing}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">De quién es este estudio</Form.Label>
                  <Form.Select
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    disabled={uploading || analyzing || !!familyMemberId}
                  >
                    <option value="self">Para mí</option>
                    {familyMembers.map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Notas adicionales <span className="text-muted">(opcional)</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={STUDY_FIELD_LIMITS.description}
                    disabled={uploading || analyzing}
                  />
                  <div className="d-flex justify-content-end align-items-center">
                    <Form.Text className="text-muted" style={{ fontSize: "0.8rem", marginTop: "2px" }}>
                      {description.length}/{STUDY_FIELD_LIMITS.description}
                    </Form.Text>
                  </div>
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0 gap-2" style={{ borderTop: "1px solid var(--border-subtle)", padding: "12px 16px" }}>
            {!uploadSuccess && (
              <>
                <button type="button" className="btn btn-secondary-saluteca flex-fill flex-md-grow-0" onClick={handleClose} disabled={uploading || analyzing}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary-saluteca flex-fill flex-md-grow-0" disabled={!isValid || uploading || analyzing}>
                  {analyzing ? <><Spinner as="span" animation="border" size="sm" className="me-2" />Analizando...</> :
                    uploading ? <><Spinner as="span" animation="border" size="sm" className="me-2" />Guardando...</> :
                      "Guardar estudio"}
                </button>
              </>
            )}
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Selector de IA cuando hay múltiples archivos */}
      <Modal show={showAISelector} onHide={() => setShowAISelector(false)} centered backdrop="static" style={{ zIndex: 1060 }}>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h5 fw-semibold">Seleccionar archivo para IA</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted mb-4">Elegí el archivo principal (como el informe médico) que la inteligencia artificial analizará para completar los datos automáticamente.</p>
          <div className="d-flex flex-column gap-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="d-flex align-items-center p-3 rounded"
                style={{
                  border: `2px solid ${fileForAI === file ? 'var(--saluteca-ocean)' : 'var(--border-subtle)'}`,
                  backgroundColor: fileForAI === file ? 'var(--saluteca-sky-faint)' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setFileForAI(file)}
              >
                <Form.Check
                  type="radio"
                  name="ai-file"
                  id={`ai-file-${idx}`}
                  checked={fileForAI === file}
                  onChange={() => setFileForAI(file)}
                  className="me-3"
                />
                <div className="text-truncate">
                  <div className="fw-medium text-dark text-truncate">{file.name}</div>
                  <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="link" className="text-muted text-decoration-none" onClick={() => setShowAISelector(false)}>
            Cancelar
          </Button>
          <Button
            className="btn-primary-saluteca"
            disabled={!fileForAI}
            onClick={() => fileForAI && executeAnalysis(fileForAI)}
          >
            Continuar y analizar
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
