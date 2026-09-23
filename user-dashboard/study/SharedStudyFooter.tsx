import { formatDate } from "@/lib/formatters";

interface SharedStudyFooterProps {
  viewsCount: number;
  expiresAt: Date;
}

export default function SharedStudyFooter({
  viewsCount,
  expiresAt,
}: SharedStudyFooterProps) {
  return (
    <div className="text-center text-muted" style={{ fontSize: "0.875rem" }}>
      <p className="mb-2">
        Este estudio fue compartido mediante un link temporal y seguro
      </p>
      <p className="mb-0">
        Compartido {viewsCount} {viewsCount === 1 ? "vez" : "veces"} • Expira el{" "}
        {formatDate(expiresAt)}
      </p>
    </div>
  );
}
