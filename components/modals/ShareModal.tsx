"use client";

import { useState } from "react";
import { Modal, Form, InputGroup, Spinner } from "react-bootstrap";
import toast from "react-hot-toast";
import type { Study } from "@/types";
import { generateShareLink } from "@/user-dashboard/server-actions/generate-share-link";
import { VINCULO_OPTIONS } from "@/config/constants";

interface ShareModalProps {
  show: boolean;
  onHide: () => void;
  study: Study;
}

export default function ShareModal({ show, onHide, study }: ShareModalProps) {
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [vinculo, setVinculo] = useState<string>("medico");
  const [isGenerating, setIsGenerating] = useState(false);

  // Verificar si Web Share API está disponible
  const canUseNativeShare =
    typeof navigator !== "undefined" && "share" in navigator;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const response = await generateShareLink({
        studyId: study.id,
        doctorName: doctorName.trim(),
        vinculo: vinculo,
      });

      if (response.success && response.data) {
        const baseUrl =
          process.env.NEXT_PUBLIC_URL_LINK_SHARE || window.location.origin;
        const link = `${baseUrl}/s/${response.data.uuid}`;
        setShareLink(link);
      } else {
        toast.error(response.message || "Error al generar el link");
      }
    } catch (error) {
      console.error("Error al generar link:", error);
      toast.error("Error al generar el link. Por favor, intenta nuevamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareViaWhatsApp = async () => {
    if (shareLink) {
      const doctorText = doctorName ? `Dr/a. ${doctorName}, te` : "Te";
      const text = `${doctorText} comparto mi estudio médico en SALUTECA (acceso temporal): ${shareLink}`;

      if (canUseNativeShare) {
        const encodedText = encodeURIComponent(text);
        window.open(`https://wa.me/?text=${encodedText}`, "_blank");
        // await navigator.share({
        //   title: "Compartir estudio médico - SALUTECA",
        //   text: text,
        // });
      }
    }
  };

  const handleClose = () => {
    setShareLink(null);
    setCopied(false);
    setDoctorName("");
    setVinculo("medico");
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      fullscreen="sm-down"
      backdrop="static"
    >
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="h5 fw-semibold">Compartir estudio</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {!shareLink ? (
          <>
            <p className="text-muted mb-4">
              Generá un link temporal y seguro para compartir este estudio con
              tu médico
            </p>

            <div
              className="bg-light rounded p-3 mb-4"
              style={{ border: "1px solid var(--border-default)" }}
            >
              <div className="d-flex align-items-start gap-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ flexShrink: 0, marginTop: "2px" }}
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="8"
                    stroke="var(--saluteca-primary)"
                    strokeWidth="2"
                  />
                  <path
                    d="M10 10V14"
                    stroke="var(--saluteca-primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <circle cx="10" cy="7" r="1" fill="var(--saluteca-primary)" />
                </svg>
                <div style={{ fontSize: "0.875rem" }}>
                  <div className="fw-medium mb-1">
                    El link expira 24 horas después del primer acceso
                  </div>
                  <div className="text-muted">
                    Solo las personas con el link podrán ver este estudio. Podés
                    finalizar el acceso en cualquier momento.
                  </div>
                </div>
              </div>
            </div>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">
                  ¿Con quien compartis este estudio? (obligatorio)
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  required
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Este nombre aparecerá en el mensaje de WhatsApp
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Vínculo</Form.Label>
                <Form.Select
                  value={vinculo}
                  onChange={(e) => setVinculo(e.target.value)}
                >
                  {VINCULO_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <button
                type="submit"
                className="btn btn-primary-saluteca w-100"
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Generando...
                  </>
                ) : (
                  "Generar link de compartir"
                )}
              </button>
            </Form>
          </>
        ) : (
          <>
            <div
              className="rounded p-3 mb-4 d-flex align-items-center gap-2"
              style={{
                backgroundColor: "var(--saluteca-green-wash)",
                border: "1px solid rgba(122, 187, 133, 0.3)",
                color: "var(--saluteca-green-dark)",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle cx="10" cy="10" r="8" fill="var(--saluteca-green)" />
                <path
                  d="M6 10L8.5 12.5L14 7"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="fw-medium">Link generado exitosamente</div>
            </div>

            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">Link de compartir</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  value={shareLink}
                  readOnly
                  style={{ fontSize: "0.875rem" }}
                />
                <button
                  type="button"
                  className="btn btn-primary-saluteca"
                  onClick={copyToClipboard}
                  style={{
                    minWidth: "80px",
                    padding: "0.5rem 1rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {copied ? (
                    <>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="me-1 d-none d-sm-inline"
                        style={{ display: "inline" }}
                      >
                        <path
                          d="M4 8L6.5 10.5L12 5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="d-none d-sm-inline">Copiado</span>
                      <span className="d-sm-none">✓</span>
                    </>
                  ) : (
                    <>
                      <span className="d-none d-sm-inline">Copiar</span>
                      <span className="d-sm-none">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M5 4H11C11.5 4 12 4.5 12 5V11"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                          <rect
                            x="4"
                            y="5"
                            width="7"
                            height="7"
                            stroke="currentColor"
                            strokeWidth="2"
                            rx="1"
                          />
                        </svg>
                      </span>
                    </>
                  )}
                </button>
              </InputGroup>
            </Form.Group>

            <div className="d-grid gap-2 mb-3">
              <button
                type="button"
                className="btn w-100 d-flex align-items-center justify-content-center gap-2"
                onClick={shareViaWhatsApp}
                style={{
                  backgroundColor: "var(--saluteca-green)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius-btn)",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M10.0002 1.66666C5.39783 1.66666 1.66683 5.39766 1.66683 9.99999C1.66683 11.5908 2.12016 13.075 2.91016 14.3333L1.8335 18.3333L5.94183 17.2833C7.15016 18.0017 8.5335 18.3333 10.0002 18.3333C14.6025 18.3333 18.3335 14.6023 18.3335 9.99999C18.3335 5.39766 14.6025 1.66666 10.0002 1.66666ZM7.20016 6.66666C7.3085 6.66666 7.41683 6.66666 7.50849 6.67499C7.66683 6.68333 7.82516 6.69999 7.97516 7.04999C8.14183 7.43333 8.50016 8.39166 8.54183 8.47499C8.58349 8.55833 8.61683 8.65833 8.56683 8.76666C8.39183 9.10833 8.08349 9.48333 7.87516 9.71666C7.82516 9.77499 7.77516 9.84166 7.83349 9.94166C8.2335 10.6167 8.77516 11.2333 9.4335 11.7083C9.8835 12.0167 10.2752 12.1917 10.6168 12.3667C10.6752 12.3917 10.7418 12.3833 10.7918 12.3333C10.9668 12.1167 11.4585 11.55 11.6502 11.2583C11.8168 11.0083 11.9918 11.0583 12.2085 11.1333C12.4252 11.2 13.3835 11.675 13.6168 11.7917C13.8502 11.9083 14.0002 11.9667 14.0418 12.0667C14.0835 12.1667 14.0835 12.6 13.9168 13.1167C13.7502 13.6333 12.8668 14.1167 12.4668 14.15C12.0752 14.1833 11.7085 14.325 9.82516 13.5917C7.60016 12.7167 6.15016 10.4667 6.03349 10.3167C5.92516 10.1667 5.16683 9.14999 5.16683 8.09999C5.16683 7.04999 5.70849 6.52499 5.9085 6.31666C6.09183 6.12499 6.33349 6.06666 6.46683 6.06666C6.58349 6.06666 6.70016 6.06666 6.80016 6.07499C6.9085 6.07499 7.05849 6.03333 7.20016 6.66666Z"
                    fill="white"
                  />
                </svg>
                {canUseNativeShare ? "Compartir" : "Compartir por WhatsApp"}
              </button>
            </div>

            <div
              className="bg-light rounded p-3 mb-3"
              style={{ fontSize: "0.875rem" }}
            >
              <div className="fw-medium mb-1">
                Este link expira 24 horas después del primer acceso
              </div>
              <div className="text-muted">
                Podés revocar el acceso desde Configuración → Enlaces
                compartidos
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary-saluteca w-100"
              onClick={handleClose}
            >
              Cerrar
            </button>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}
