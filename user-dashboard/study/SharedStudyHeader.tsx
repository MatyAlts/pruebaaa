import { Container } from "react-bootstrap";

export default function SharedStudyHeader() {
  return (
    <div className="bg-white border-bottom py-3">
      <Container>
        <div className="d-flex align-items-center gap-3">
          <div
            className="bg-primary-saluteca d-flex align-items-center justify-content-center"
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M13 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V9L13 2Z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M13 2V9H20"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="14" r="2" fill="white" />
            </svg>
          </div>
          <div>
            <div className="fw-semibold" style={{ fontSize: "1.125rem" }}>
              SALUTECA
            </div>
            <div className="text-muted" style={{ fontSize: "0.875rem" }}>
              Estudio compartido
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
