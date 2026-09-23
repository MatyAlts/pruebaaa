"use client";

import { useState } from "react";
import {
  Modal,
  Button,
  ListGroup,
  Spinner,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { revokeShareLink } from "@/src/features/sharing/api";
import { SHARE_LINK_EXPIRATION_HOURS } from "@/config/constants";
import type { ShareLink } from "@/src/features/sharing/api";
import moment from "moment";

interface SharedLinksModalProps {
  show: boolean;
  onHide: () => void;
  links: ShareLink[];
  onLinkRevoked: (linkId: string, newOpenedAt: string) => void;
}

export default function SharedLinksModal({
  show,
  onHide,
  links,
  onLinkRevoked,
}: SharedLinksModalProps) {
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [revokingLinkId, setRevokingLinkId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleCopyLink = (linkId: string, uuid: string) => {
    const baseUrl =
      process.env.NEXT_PUBLIC_URL_LINK_SHARE || window.location.origin;
    const url = `${baseUrl}/s/${uuid}`;
    navigator.clipboard.writeText(url);

    setCopiedLinkId(linkId);
    setTimeout(() => {
      setCopiedLinkId(null);
    }, 2000);
  };

  const handleRevokeLink = async (linkId: string) => {
    setRevokingLinkId(linkId);

    try {
      const response = await revokeShareLink(linkId);

      if (response.success) {
        setToastMessage("Link eliminado exitosamente");
        setShowToast(true);

        // Calcular la nueva fecha (1 mes antes)
        const oneMonthAgo = moment()
          .subtract(1, "month")
          .format("DD-MM-YYYY HH:mm");
        onLinkRevoked(linkId, oneMonthAgo);
      } else {
        setToastMessage(response.message || "Error al revocar el link");
        setShowToast(true);
      }
    } catch (error) {
      console.error("Error:", error);
      setToastMessage("Error al revocar el link");
      setShowToast(true);
    } finally {
      setRevokingLinkId(null);
    }
  };

  const isLinkExpired = (fechaAbierto: string): boolean => {
    if (!fechaAbierto) return false;

    const fechaAbertoMoment = moment(fechaAbierto, "DD-MM-YYYY HH:mm");
    const expirationDate = fechaAbertoMoment
      .clone()
      .add(SHARE_LINK_EXPIRATION_HOURS, "hours");
    const now = moment();

    return now.isAfter(expirationDate);
  };

  const formatDate = (dateString: string): string => {
    return moment(dateString, "DD-MM-YYYY HH:mm").format("DD/MM/YYYY HH:mm");
  };

  const renderLinksList = (links: ShareLink[]) => {

    if (links.length === 0) {
      return (
        <div className="text-center py-5">
          <div
            className="d-flex align-items-center justify-content-center mb-3"
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              backgroundColor: "var(--surface-inset)",
              margin: "0 auto",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 13C10.4295 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9923C14.3618 15.0435 15.0796 14.9403 15.7513 14.6897C16.4231 14.4392 17.0331 14.047 17.54 13.54L20.54 10.54C21.4508 9.59695 21.9548 8.33394 21.9434 7.02296C21.932 5.71198 21.4061 4.45791 20.4791 3.53087C19.5521 2.60383 18.298 2.07799 16.987 2.0666C15.676 2.0552 14.413 2.55918 13.47 3.46997L11.75 5.17997"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14 11C13.5705 10.4259 13.0226 9.95083 12.3934 9.60707C11.7642 9.26331 11.0685 9.05888 10.3533 9.00768C9.63816 8.95647 8.92037 9.05965 8.24861 9.31023C7.57685 9.5608 6.96684 9.95303 6.45996 10.46L3.45996 13.46C2.54917 14.403 2.04519 15.666 2.05659 16.977C2.06798 18.288 2.59382 19.5421 3.52086 20.4691C4.4479 21.3961 5.70197 21.922 7.01295 21.9334C8.32393 21.9448 9.58694 21.4408 10.53 20.53L12.24 18.82"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="h6 fw-semibold mb-2">No hay enlaces compartidos</h3>
          <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }}>
            Aún no compartiste ningún estudio
          </p>
        </div>
      );
    }

    return (
      <ListGroup variant="flush">
        {links.map((link) => {
          const isExpired = isLinkExpired(link.openedAt || "");
          const isCopied = copiedLinkId === link.id;
          const isRevoking = revokingLinkId === link.id;

          return (
            <ListGroup.Item
              key={link.id}
              className="px-0 py-3"
              style={{ borderColor: "var(--border-default)" }}
            >
              <div className="d-flex flex-column gap-2">
                <div className="d-flex align-items-start justify-content-between">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div className="fw-medium">
                        {link.studyTitle || "Estudio médico"}
                      </div>
                      {isExpired && (
                        <span
                          className="badge"
                          style={{
                            backgroundColor: "var(--saluteca-warning-wash)",
                            color: "var(--saluteca-warning-text)",
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            padding: "0.25rem 0.5rem",
                          }}
                        >
                          Eliminado
                        </span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span
                        className="text-muted"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Creado: {link.createdAt}
                      </span>
                      {link.openedAt && (
                        <>
                          <span
                            className="text-muted"
                            style={{ fontSize: "0.75rem" }}
                          >
                            •
                          </span>
                          <span
                            className="text-muted"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Abierto: {formatDate(link.openedAt)}
                          </span>
                        </>
                      )}
                      {link.doctorName && (
                        <>
                          <span
                            className="text-muted"
                            style={{ fontSize: "0.75rem" }}
                          >
                            •
                          </span>
                          <span
                            className="text-muted"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Dr/a. {link.doctorName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!isExpired && (
                  <div className="d-flex gap-4 mt-2">
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none p-0 d-flex align-items-center hover-opacity"
                      onClick={() => handleCopyLink(link.id, link.uuid)}
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--saluteca-ocean)",
                        transition: "opacity 0.2s",
                      }}
                      disabled={isRevoking}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="me-1"
                      >
                        <path
                          d="M11.6667 5.25H6.41667C5.63327 5.25 5 5.88327 5 6.66667V11.9167C5 12.7001 5.63327 13.3333 6.41667 13.3333H11.6667C12.4501 13.3333 13.0833 12.7001 13.0833 11.9167V6.66667C13.0833 5.88327 12.4501 5.25 11.6667 5.25Z"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M2.91667 8.75H2.33333C1.95942 8.75 1.60072 8.60156 1.33566 8.33651C1.07061 8.07145 0.916672 7.71275 0.916672 7.33333V2.08333C0.916672 1.70942 1.07061 1.35072 1.33566 1.08566C1.60072 0.820606 1.95942 0.666672 2.33333 0.666672H7.58333C7.95725 0.666672 8.31594 0.820606 8.581 1.08566C8.84606 1.35072 8.99999 1.70942 8.99999 2.08333V2.66667"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {isCopied ? "Copiado" : "Copiar enlace"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-link text-decoration-none p-0 d-flex align-items-center hover-opacity"
                      onClick={() => handleRevokeLink(link.id)}
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--saluteca-danger)",
                        transition: "opacity 0.2s",
                      }}
                      disabled={isRevoking}
                    >
                      {isRevoking ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-1"
                            style={{
                              width: "14px",
                              height: "14px",
                              borderWidth: "1.5px",
                            }}
                          />
                          Cancelando...
                        </>
                      ) : (
                        "Cancelar"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    );
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton className="border-0 pb-0">
          <Modal.Title className="h5 fw-semibold">
            Enlaces compartidos
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-0">
          <div className="px-4">
            <p className="text-muted mb-3" style={{ fontSize: "0.875rem" }}>
              Todos los enlaces generados para compartir estudios. Los enlaces
              expiran {SHARE_LINK_EXPIRATION_HOURS} horas después del primer
              acceso.
            </p>
            {renderLinksList(links)}
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0">
          <button
            type="button"
            className="btn btn-primary-saluteca"
            onClick={onHide}
          >
            Cerrar
          </button>
        </Modal.Footer>
      </Modal>

      {/* Toast de éxito */}
      <ToastContainer
        position="top-end"
        className="p-3"
        style={{ zIndex: 9999 }}
      >
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg="success"
        >
          <Toast.Header closeButton={false}>
            <strong className="me-auto">Éxito</strong>
          </Toast.Header>
          <Toast.Body className="text-white">{toastMessage}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
}
