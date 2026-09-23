"use client";

import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { Study, FamilyMember } from "@/types";
import { updateStudy } from "@/user-dashboard/server-actions/update-study";
import { deleteStudy } from "@/user-dashboard/server-actions/delete-study";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import moment from "moment";
import { STUDY_FIELD_LIMITS } from "@/config/constants";
interface EditStudyModalProps {
  show: boolean;
  onHide: () => void;
  study: Study;
  familyMembers?: FamilyMember[];
  onDelete?: () => void;
  onUpdate?: (updatedStudy: Study) => void;
}

export default function EditStudyModal({
  show,
  onHide,
  study,
  familyMembers = [],
  onDelete,
  onUpdate,
}: EditStudyModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState(study.title || "");
  // Convertir de DD-MM-YYYY a YYYY-MM-DD para el input type="date"
  const [date, setDate] = useState(moment(study.date, "DD-MM-YYYY").format("YYYY-MM-DD"));
  const [institution, setInstitution] = useState(study.institution || "");
  const [medico, setMedico] = useState(study.medico || "");
  const [conclusion, setConclusion] = useState(study.conclusion || "");
  const [description, setDescription] = useState(study.description || "");
  const [owner, setOwner] = useState<string>(study.familyMemberId || "self");
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Resetear estados cuando el modal se abre o cambia el estudio
  useEffect(() => {
    if (show) {
      setTitle(study.title || "");
      // Convertir de DD-MM-YYYY a YYYY-MM-DD para el input type="date"
      setDate(moment(study.date, "DD-MM-YYYY").format("YYYY-MM-DD"));
      setInstitution(study.institution || "");
      setMedico(study.medico || "");
      setConclusion(study.conclusion || "");
      setDescription(study.description || "");
      setOwner(study.familyMemberId || "self");
      setSaving(false);
      setShowDeleteConfirm(false);
      setDeleting(false);
    }
  }, [show, study]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const dateMoment = moment(date).format("DD-MM-YYYY");
      const result = await updateStudy({
        studyId: study.id,
        title: title.trim() || undefined,
        date: dateMoment,
        institution: institution.trim() || undefined,
        medico: medico.trim() || "",
        conclusion: conclusion.trim() || undefined,
        description: description.trim() || undefined,
        familyMemberId: owner === "self" ? undefined : owner,
      });

      if (result.success) {
        toast.success(result.message);

        // Actualizar el estudio localmente para reflejar los cambios
        const updatedStudy: Study = {
          ...study,
          title: title.trim() || undefined,
          date: dateMoment, // Ya está en formato DD-MM-YYYY
          institution: institution.trim() || undefined,
          medico: medico.trim() || "",
          conclusion: conclusion.trim() || undefined,
          description: description.trim() || undefined,
          familyMemberId: owner === "self" ? undefined : owner,
        };

        if (onUpdate) {
          onUpdate(updatedStudy);
        }

        // Refrescar los datos de la página
        router.refresh();
        handleClose();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error al actualizar estudio:", error);
      toast.error("Ocurrió un error inesperado. Por favor, intentá nuevamente.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);

    try {
      const result = await deleteStudy(study.id);

      if (result.success) {
        toast.success(result.message);

        // Llamar al callback onDelete si existe
        if (onDelete) {
          onDelete();
        }

        // Refrescar los datos de la página
        router.refresh();
        handleClose();
      } else {
        toast.error(result.message);
        setDeleting(false);
      }
    } catch (error) {
      console.error("Error al eliminar estudio:", error);
      toast.error("Ocurrió un error inesperado. Por favor, intentá nuevamente.");
      setDeleting(false);
    }
  };

  const handleClose = () => {
    setTimeout(() => {
      setShowDeleteConfirm(false);
      onHide();
    }, 750)
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg"
    // fullscreen="sm-down"
    >
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="h5 fw-semibold">Editar estudio</Modal.Title>
      </Modal.Header>

      {!showDeleteConfirm ? (
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            {/* File info (read-only) */}
            {/* <div
              className="border rounded p-3 mb-4"
              style={{ backgroundColor: "var(--surface-inset)" }}
            >
              <div className="d-flex align-items-center gap-3">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 40 40"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="20" cy="20" r="20" fill="var(--saluteca-primary)" fillOpacity="0.1" />
                  <path
                    d="M21.6667 13.3333H15C14.558 13.3333 14.1341 13.5089 13.8215 13.8215C13.5089 14.1341 13.3333 14.558 13.3333 15V25C13.3333 25.442 13.5089 25.8659 13.8215 26.1785C14.1341 26.4911 14.558 26.6667 15 26.6667H25C25.442 26.6667 25.8659 26.4911 26.1785 26.1785C26.4911 25.8659 26.6667 25.442 26.6667 25V18.3333L21.6667 13.3333Z"
                    stroke="var(--saluteca-primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21.6667 13.3333V18.3333H26.6667"
                    stroke="var(--saluteca-primary)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex-grow-1">
                  <div className="fw-medium text-dark">Estudio seleccionado</div>
                  <div className="text-muted" style={{ fontSize: "0.875rem" }}>
                    {(study.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
            </div> */}

            <div className="row g-3 mb-3">
              {/* Date */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-medium">Fecha</Form.Label>
                  <Form.Control
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={new Date().toISOString().split("T")[0]}
                    maxLength={STUDY_FIELD_LIMITS.date}
                  />
                </Form.Group>
              </div>

              {/* Title */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-medium">
                    Nombre del estudio <span className="text-muted">(opcional)</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={STUDY_FIELD_LIMITS.title}
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row g-3 mb-3">
              {/* Institution */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-medium">
                    Institución <span className="text-muted">(opcional)</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    maxLength={STUDY_FIELD_LIMITS.institution}
                  />
                </Form.Group>
              </div>

              {/* Doctor */}
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label className="fw-medium">
                    Médico <span className="text-muted">(opcional)</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    value={medico}
                    onChange={(e) => setMedico(e.target.value)}
                    maxLength={STUDY_FIELD_LIMITS.doctor}
                  />
                </Form.Group>
              </div>
            </div>

            {/* Conclusion */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">
                Observaciones <span className="text-muted">(opcional)</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={conclusion}
                onChange={(e) => setConclusion(e.target.value)}
                maxLength={STUDY_FIELD_LIMITS.conclusion}
              />
              <div className="d-flex justify-content-end">
                <Form.Text className="text-muted" style={{ fontSize: "0.8rem", marginTop: "2px" }}>
                  {conclusion.length}/{STUDY_FIELD_LIMITS.conclusion}
                </Form.Text>
              </div>
            </Form.Group>

            {/* Owner */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">De quién es este estudio</Form.Label>
              <Form.Select value={owner} onChange={(e) => setOwner(e.target.value)}>
                <option value="self">Para mí</option>
                {familyMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            {/* Description */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-medium">
                Notas <span className="text-muted">(opcional)</span>
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={STUDY_FIELD_LIMITS.description}
              />
              <div className="d-flex justify-content-end">
                <Form.Text className="text-muted" style={{ fontSize: "0.8rem", marginTop: "2px" }}>
                  {description.length}/{STUDY_FIELD_LIMITS.description}
                </Form.Text>
              </div>
            </Form.Group>
          </Modal.Body>

          <Modal.Footer className="border-0 pt-0 d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-link text-decoration-none text-danger fw-medium p-0 hover-opacity"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={saving}
            >
              Eliminar estudio
            </button>
            <div className="d-flex gap-2">
              <button
                type="button"
                className="btn btn-secondary-saluteca"
                onClick={handleClose}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary-saluteca"
                disabled={saving}
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
                  "Guardar cambios"
                )}
              </button>
            </div>
          </Modal.Footer>
        </Form>
      ) : (
        <>
          <Modal.Body>
            <div className="text-center py-4">
              <div
                className="mx-auto mb-4"
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "50%",
                  backgroundColor: "var(--saluteca-danger-wash)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 9V13M12 17H12.01M5.07 19H18.93C20.14 19 21 17.93 20.43 16.87L13.5 5.12C12.93 4.06 11.07 4.06 10.5 5.12L3.57 16.87C3 17.93 3.86 19 5.07 19Z"
                    stroke="var(--saluteca-danger)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <h5 className="fw-semibold mb-2">¿Eliminar este estudio?</h5>
              <p className="text-muted mb-0">
                Esta acción no se puede deshacer. El archivo se eliminará permanentemente.
              </p>
            </div>
          </Modal.Body>
          <Modal.Footer className="border-0 pt-0 gap-2">
            <button
              type="button"
              className="btn btn-secondary-saluteca flex-fill flex-md-grow-0"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn flex-fill flex-md-grow-0"
              style={{
                background: "var(--saluteca-danger)",
                border: "none",
                color: "white",
                fontWeight: 500,
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
              }}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  Eliminando...
                </>
              ) : (
                "Sí, eliminar"
              )}
            </button>
          </Modal.Footer>
        </>
      )}
    </Modal>
  );
}
