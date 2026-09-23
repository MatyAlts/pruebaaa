"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, Form } from "react-bootstrap";
import toast from "react-hot-toast";
import { FamilyMember } from "@/types";
import { MAX_FAMILY_MEMBER_NAME_LENGTH } from "@/config/constants";
import { editFamilyMember } from "@/user-dashboard/server-actions/edit-family-member";
import { deleteFamilyMember } from "@/user-dashboard/server-actions/delete-family-member";

interface FamilyMemberActionsProps {
  member: FamilyMember;
  redirectOnDelete?: string;
}

export default function FamilyMemberActions({ member, redirectOnDelete }: FamilyMemberActionsProps) {
  const router = useRouter();

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [editName, setEditName] = useState(member.name);
  const [deleteInput, setDeleteInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await editFamilyMember({
        uuid: member.uuid,
        name: editName,
      });

      if (result.success) {
        toast.success(result.message);
        setShowEditModal(false);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Ocurrió un error al actualizar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (deleteInput.toLowerCase() !== "misaluteca" || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = await deleteFamilyMember(member.uuid);

      if (result.success) {
        toast.success(result.message);
        setShowDeleteModal(false);
        if (redirectOnDelete) {
          router.push(redirectOnDelete);
        } else {
          router.refresh();
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Ocurrió un error al eliminar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="position-relative">
        <button
          className="btn btn-link p-0 text-muted border-0 text-decoration-none shadow-none"
          style={{ outline: "none" }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 6C12.5523 6 13 5.55228 13 5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5C11 5.55228 11.4477 6 12 6Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 20C12.5523 20 13 19.5523 13 19C13 18.4477 12.5523 18 12 18C11.4477 18 11 18.4477 11 19C11 19.5523 11.4477 20 12 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {showMenu && (
          <>
            <div
              style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(false);
              }}
            />
            <div
              className="bg-white rounded shadow border py-2"
              style={{
                position: "absolute",
                top: "100%",
                right: 0,
                minWidth: "160px",
                zIndex: 1000,
              }}
            >
              <button
                className="dropdown-item"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  setEditName(member.name);
                  setShowEditModal(true);
                }}
              >
                Editar
              </button>
              <button
                className="dropdown-item text-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(false);
                  setDeleteInput("");
                  setShowDeleteModal(true);
                }}
              >
                Eliminar
              </button>
            </div>
          </>
        )}
      </div>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-semibold">Editar familiar</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleEdit}>
          <Modal.Body>
            <Form.Group>
              <Form.Label>
                Nombre <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={MAX_FAMILY_MEMBER_NAME_LENGTH}
                required
                autoFocus
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-secondary-saluteca" onClick={() => setShowEditModal(false)} disabled={isSubmitting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary-saluteca" disabled={!editName.trim() || isSubmitting}>
              {isSubmitting ? "Actualizando..." : "Actualizar"}
            </button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="h5 fw-semibold text-danger">Eliminar familiar</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            ¿Estás seguro que querés eliminar a <strong>{member.name}</strong>? Se eliminarán todos sus estudios de forma permanente.
          </p>
          <Form.Group className="mt-3">
            <Form.Label>
              Escribí <strong>misaluteca</strong> para confirmar:
            </Form.Label>
            <Form.Control
              type="text"
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              autoFocus
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary-saluteca" onClick={() => setShowDeleteModal(false)} disabled={isSubmitting}>
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleDelete}
            disabled={deleteInput.toLowerCase() !== "misaluteca" || isSubmitting}
          >
            {isSubmitting ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
