"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import { Card, Form } from "react-bootstrap";
import SharedLinksModal from "@/components/modals/SharedLinksModal";
import DeleteAccountModal from "@/components/modals/DeleteAccountModal";
import type { User } from "@/user-dashboard/server-actions/get-user";
import type { ShareLink } from "@/src/features/sharing/api";

interface SettingsPageClientProps {
  user: User;
  sharedLinks: ShareLink[];
}

export default function SettingsPageClient({ user, sharedLinks }: SettingsPageClientProps) {
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [links, setLinks] = useState<ShareLink[]>(sharedLinks);

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <AppShell title="Configuración">
      <div className="row">
        <div className="col-lg-8">
          {/* Profile Section */}
          <Card className="mb-4">
            <Card.Header className="bg-white border-bottom">
              <h3 className="h6 mb-0 fw-semibold">Perfil</h3>
            </Card.Header>
            <Card.Body>
              <div className="mb-4">
                {user.image ? (
                  <img
                    src={user.image}
                    alt={user.name}
                    width="80"
                    height="80"
                    style={{
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    className="bg-secondary-saluteca d-flex align-items-center justify-content-center text-white fw-semibold"
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      fontSize: "1.5rem",
                    }}
                  >
                    {getInitials(user.name)}
                  </div>
                )}
              </div>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Nombre completo</Form.Label>
                  <Form.Control
                    type="text"
                    defaultValue={user.name}
                    placeholder="Nombre completo"
                    disabled
                  />
                  <Form.Text className="text-muted">
                    El nombre se obtiene de tu cuenta de Google
                  </Form.Text>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    defaultValue={user.email}
                    placeholder="Email"
                    disabled
                  />
                  <Form.Text className="text-muted">
                    El email no se puede cambiar (vinculado con Google)
                  </Form.Text>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>

          {/* Security Section */}
          <Card className="mb-4">
            <Card.Header className="bg-white border-bottom">
              <h3 className="h6 mb-0 fw-semibold">Seguridad y privacidad</h3>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-start justify-content-between mb-3 pb-3 border-bottom">
                <div>
                  <div className="fw-medium mb-1">Autenticación con Google</div>
                  <div className="text-muted" style={{ fontSize: "0.875rem" }}>
                    Tu cuenta está protegida con Google OAuth
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle cx="10" cy="10" r="8" fill="var(--saluteca-success)" />
                    <path
                      d="M6 10L8.5 12.5L14 7"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="text-success fw-medium" style={{ fontSize: "0.875rem" }}>
                    Activo
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-start justify-content-between">
                <div>
                  <div className="fw-medium mb-1">Enlaces compartidos</div>
                  <div className="text-muted" style={{ fontSize: "0.875rem" }}>
                    Gestioná los links temporales de tus estudios compartidos
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary-saluteca btn-sm"
                  onClick={() => setShowLinksModal(true)}
                >
                  Ver enlaces
                </button>
              </div>
            </Card.Body>
          </Card>

          {/* Danger Zone */}
          <Card >
            {/* <Card.Header className="bg-white border-bottom border-danger">
              <h3 className="h6 mb-0 fw-semibold text-danger">Zona peligrosa</h3>
            </Card.Header> */}
            <Card.Body>
              <div className="d-flex align-items-start justify-content-between">
                <div>
                  <div className="fw-medium mb-1">Eliminar cuenta</div>
                  <div className="text-muted" style={{ fontSize: "0.875rem" }}>
                    Eliminar permanentemente tu cuenta y todos tus datos
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => setShowDeleteModal(true)}
                >
                  Eliminar cuenta
                </button>
              </div>
            </Card.Body>
          </Card>
        </div>

        <div className="col-lg-4">
          {/* Info Card */}
          <Card className="bg-light border-0">
            <Card.Body>
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
                <div>
                  <div className="fw-semibold mb-2">Acerca de Mi Saluteca</div>
                  <p className="text-muted mb-0" style={{ fontSize: "0.875rem" }}>
                    Tu historial médico digital, seguro y siempre accesible. Mantené organizados
                    todos tus estudios y los de tu familia en un solo lugar.
                  </p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <SharedLinksModal
        show={showLinksModal}
        onHide={() => setShowLinksModal(false)}
        links={links}
        onLinkRevoked={(linkId, newOpenedAt) => {
          // Actualizar el link con la nueva fecha
          setLinks((prevLinks) =>
            prevLinks.map((link) =>
              link.id === linkId
                ? { ...link, openedAt: newOpenedAt }
                : link
            )
          );
        }}
      />

      <DeleteAccountModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
      />
    </AppShell>
  );
}
