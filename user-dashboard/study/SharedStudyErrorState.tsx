import { Container } from "react-bootstrap";

export type ErrorType =
  | "notFound"
  | "expired"
  | "revoked"
  | "studyNotFound"
  | "serverError";

interface SharedStudyErrorStateProps {
  type: ErrorType;
}

export default function SharedStudyErrorState({
  type,
}: SharedStudyErrorStateProps) {
  const getContent = () => {
    switch (type) {
      case "notFound":
        return {
          title: "Link no válido",
          description: "Este link de compartir no existe o ha sido revocado",
          icon: (
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
              />
              <path
                d="M20 13.3333V20"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle
                cx="20"
                cy="26.6667"
                r="1.5"
                fill="var(--saluteca-gray)"
              />
            </svg>
          ),
        };
      case "expired":
        return {
          title: "Link eliminado",
          description: "Este link fue eliminado por el dueño del estudio",
          icon: (
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
              />
              <path
                d="M13.3333 13.3333L26.6666 26.6667"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M26.6666 13.3333L13.3333 26.6667"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ),
        };
      case "revoked":
        return {
          title: "Link eliminado",
          description: "Este link fue eliminado por el dueño del estudio",
          icon: (
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
              />
              <path
                d="M13.3333 13.3333L26.6666 26.6667"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M26.6666 13.3333L13.3333 26.6667"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ),
        };
      case "studyNotFound":
        return {
          title: "Estudio no encontrado",
          description: "El estudio no existe",
          icon: (
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
              />
              <path
                d="M20 13.3333V20"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle
                cx="20"
                cy="26.6667"
                r="1.5"
                fill="var(--saluteca-gray)"
              />
            </svg>
          ),
        };
      case "serverError":
        return {
          title: "Error del servidor",
          description:
            "Hubo un problema al cargar el estudio. Por favor, intenta nuevamente más tarde.",
          icon: (
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="20"
                cy="20"
                r="16"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
              />
              <path
                d="M20 13.3333V20"
                stroke="var(--saluteca-gray)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle
                cx="20"
                cy="26.6667"
                r="1.5"
                fill="var(--saluteca-gray)"
              />
            </svg>
          ),
        };
    }
  };

  const content = getContent();

  return (
    <Container className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center">
        <div
          className="bg-light d-inline-flex align-items-center justify-content-center mb-4"
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
          }}
        >
          {content.icon}
        </div>
        <h1 className="h4 fw-semibold mb-2">{content.title}</h1>
        <p className="text-muted mb-4">{content.description}</p>
      </div>
    </Container>
  );
}
