"use client";

import { useState } from "react";
import { Modal, Form, Spinner } from "react-bootstrap";
import toast from "react-hot-toast";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/user-dashboard/server-actions/delete-account";

interface DeleteAccountModalProps {
  show: boolean;
  onHide: () => void;
}

export default function DeleteAccountModal({
  show,
  onHide,
}: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const isValid = confirmText.toLowerCase() === "misaluteca";

  const handleDelete = async () => {
    if (!isValid) return;

    setIsDeleting(true);

    try {
      const result = await deleteAccount();

      if (result.success) {
        toast.success(result.message);

        // Cerrar sesión y redirigir
        await signOut({ redirect: false });
        router.refresh();
        router.push("/");
      } else {
        toast.error(result.message);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error("Error al eliminar cuenta:", error);
      toast.error("Error inesperado al eliminar la cuenta. Por favor, intentá nuevamente.");
      setIsDeleting(false);
    }
  };

  const handleHide = () => {
    if (!isDeleting) {
      setConfirmText("");
      onHide();
    }
  };

  return (
    <Modal show={show} onHide={handleHide} centered>
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-semibold text-danger">
          Eliminar cuenta permanentemente
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="px-4 pb-4">
        <div className="mb-4">
          <p className="mb-3">
            Esta acción es <strong>irreversible</strong> y eliminará permanentemente:
          </p>
          <ul className="text-muted" style={{ fontSize: "0.9375rem" }}>
            <li>Tu cuenta de usuario</li>
            <li>Todos tus estudios médicos</li>
            <li>Todos tus familiares registrados</li>
            <li>Todos los enlaces compartidos</li>
            <li>Todos los archivos asociados</li>
          </ul>
        </div>

        <div className="alert alert-danger" role="alert" style={{ fontSize: "0.875rem" }}>
          <strong>⚠️ Advertencia:</strong> Esta acción no se puede deshacer.
        </div>

        <Form.Group className="mb-0">
          <Form.Label className="fw-semibold">
            Para confirmar, escribí <code>misaluteca</code> en el campo de abajo:
          </Form.Label>
          <Form.Control
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            disabled={isDeleting}
          />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0">
        <button
          type="button"
          className="btn btn-secondary-saluteca"
          onClick={handleHide}
          disabled={isDeleting}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn"
          style={{
            background: "var(--saluteca-danger)",
            border: "none",
            color: "white",
            fontWeight: 500,
            padding: "0.625rem 1.25rem",
            borderRadius: "var(--radius-md)",
          }}
          onClick={handleDelete}
          disabled={!isValid || isDeleting}
        >
          {isDeleting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Eliminando...
            </>
          ) : (
            "Eliminar permanentemente"
          )}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
