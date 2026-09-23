"use client";

import { useState } from "react";
import { Modal, Form } from "react-bootstrap";
import toast from "react-hot-toast";
import { addFamilyMember } from "@/user-dashboard/server-actions/new-member-family";
import { useRouter } from "next/navigation";
import { MAX_FAMILY_MEMBER_NAME_LENGTH } from "@/config/constants";

interface AddFamilyMemberModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess?: () => void;
}

export default function AddFamilyMemberModal({
  show,
  onHide,
  onSuccess,
}: AddFamilyMemberModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await addFamilyMember({
        name,
      });

      if (result.success) {
        router.refresh();
        // Llamar callback de éxito si existe (para actualizar la lista)
        if (onSuccess) {
          onSuccess();
        }
        handleClose();
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error("Error inesperado. Por favor, intenta nuevamente.");
      console.error("Error al agregar familiar:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName("");
    onHide();
  };

  const isValid = name.trim() !== ""; // Solo el nombre es obligatorio

  return (
    <Modal show={show} onHide={handleClose} centered fullscreen="sm-down">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="h5 fw-semibold">Agregar familiar</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", overflow: "hidden", flex: "1 1 auto", minHeight: 0 }}>
        <Modal.Body style={{ overflowY: "auto", flex: "1 1 auto", minHeight: 0 }}>
          <p className="text-muted mb-4">
            Agregá a un familiar para poder gestionar sus estudios médicos
          </p>

          {/* Name - OBLIGATORIO */}
          <Form.Group className="mb-4">
            <Form.Label className="fw-medium">
              Nombre <span className="text-danger">*</span>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Ej: Juan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_FAMILY_MEMBER_NAME_LENGTH}
              required
              autoFocus
            />
          </Form.Group>

          <div
            className="bg-light rounded p-3"
            style={{ border: "1px solid #E5E5E5" }}
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
                <path
                  d="M10 6V10"
                  stroke="var(--saluteca-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="10" cy="13" r="1" fill="var(--saluteca-primary)" />
                <circle
                  cx="10"
                  cy="10"
                  r="8"
                  stroke="var(--saluteca-primary)"
                  strokeWidth="2"
                />
              </svg>
              <div style={{ fontSize: "0.875rem" }}>
                <div className="fw-medium mb-1 text-dark">Privacidad</div>
                <div className="text-muted">
                  Solo vos tendrás acceso a esta información. Los datos están protegidos
                  y encriptados.
                </div>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="border-0 pt-0 gap-2" style={{
          flexShrink: 0,
          background: "white",
          padding: "12px 16px",
          paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
          borderTop: "1px solid var(--border-subtle)",
          boxShadow: "0 -2px 8px rgba(0,0,0,0.06)",
        }}>
          <button type="button" className="btn btn-secondary-saluteca flex-fill flex-md-grow-0" onClick={handleClose} disabled={saving}>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary-saluteca flex-fill flex-md-grow-0"
            disabled={!isValid || saving}
          >
            {saving ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Guardando...
              </>
            ) : (
              "Agregar familiar"
            )}
          </button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
