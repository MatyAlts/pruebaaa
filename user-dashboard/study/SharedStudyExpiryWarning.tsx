interface SharedStudyExpiryWarningProps {
  daysUntilExpiry: number;
}

export default function SharedStudyExpiryWarning({
  daysUntilExpiry,
}: SharedStudyExpiryWarningProps) {
  if (daysUntilExpiry > 3) return null;

  return (
    <div
      className="alert alert-warning d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
        <path
          d="M10 6V10"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="10" cy="13.5" r="1" fill="currentColor" />
      </svg>
      <div>
        Este link expira{" "}
        {daysUntilExpiry === 0
          ? "hoy"
          : `en ${daysUntilExpiry} día${daysUntilExpiry > 1 ? "s" : ""}`}
      </div>
    </div>
  );
}
