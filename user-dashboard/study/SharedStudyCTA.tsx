import Link from "next/link";
export default function SharedStudyCTA() {
  return (
    <div
      className="text-center mt-5 pt-4"
      style={{ borderTop: "1px solid #E5E5E5" }}
    >
      <p className="text-muted mb-3">
        ¿Querés organizar tus  estudios médicos?
      </p>
      <Link href="/" className="btn btn-outline-primary" prefetch={false}>
        Crear cuenta en SALUTECA
      </Link>
    </div>
  );
}
