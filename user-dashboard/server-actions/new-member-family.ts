"use server";

import { pool } from "@/lib/database";
import { dateNowWithMinutes } from "@/config/date";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ResultSetHeader } from "mysql2/promise";
import { v4 as uuidv4 } from "uuid";
import { MAX_FAMILY_MEMBER_NAME_LENGTH } from "@/config/constants";

interface AddFamilyMemberData {
  name: string;
}

interface AddFamilyMemberResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
  };
}

export async function addFamilyMember(
  data: AddFamilyMemberData
): Promise<AddFamilyMemberResponse> {
  try {
    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.userId || !session.user.email) {
      return {
        success: false,
        message: "No hay sesión activa. Por favor, inicia sesión.",
      };
    }

    // Validar datos requeridos
    if (!data.name || data.name.trim() === "") {
      return {
        success: false,
        message: "El nombre es obligatorio.",
      };
    }

    // Validar longitud del nombre
    if (data.name.length > MAX_FAMILY_MEMBER_NAME_LENGTH) {
      return {
        success: false,
        message: `El nombre no puede superar los ${MAX_FAMILY_MEMBER_NAME_LENGTH} caracteres.`,
      };
    }

    const now = dateNowWithMinutes();

    const uuid = uuidv4();
    const timestamp = new Date().getTime().toString();
    const formattedTimestamp = timestamp.match(/.{1,4}/g)?.join('-') || timestamp;
    const finalUuid = uuid + '-' + formattedTimestamp;
    // Insertar el familiar en la base de datos
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO familiares (id_usuario, email_usuario, nombre, created_at, updated_at, uuid) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [session.user.userId, session.user.email, data.name.trim(), now, now, finalUuid]
    );

    return {
      success: true,
      message: "Familiar agregado exitosamente",
      data: {
        id: result.insertId,
      },
    };
  } catch (error) {
    console.error("Error al agregar familiar:", error);
    return {
      success: false,
      message: "Error al agregar el familiar. Por favor, intenta nuevamente.",
    };
  }
}
