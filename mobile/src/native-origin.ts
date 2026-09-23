import { apiOrigin, SessionError } from "./session";

export function configuredApiOrigin(value: string | undefined) {
  if (!value)
    throw new SessionError(
      "CONFIG",
      "El servicio de Mi Saluteca no está configurado.",
    );
  return apiOrigin(value);
}
