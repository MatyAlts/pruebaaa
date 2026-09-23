"use server";

import { pool } from "@/lib/database";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RowDataPacket } from "mysql2/promise";

export interface SharedLink {
  id: number;
  id_estudio: number;
  nombre_medico: string;
  uuid: string;
  created_at: string;
  fecha_abierto: string;
  estudio_titulo: string;
  estudio_fecha: string;
}

export async function getSharedLinks(): Promise<SharedLink[]> {
  try {
    // Obtener la sesión del usuario
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.userId) {
      return [];
    }

    // Obtener todos los links del usuario con información del estudio
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        l.id,
        l.id_estudio,
        l.nombre_medico,
        l.uuid,
        l.created_at,
        l.fecha_abierto,
        e.titulo as estudio_titulo,
        e.fecha as estudio_fecha
      FROM links l
      INNER JOIN estudios e ON l.id_estudio = e.id
      WHERE l.id_usuario = ?
      ORDER BY l.created_at DESC`,
      [session.user.userId]
    );

    return rows.map((row) => ({
      id: row.id,
      id_estudio: row.id_estudio,
      nombre_medico: row.nombre_medico,
      uuid: row.uuid,
      created_at: row.created_at,
      fecha_abierto: row.fecha_abierto,
      estudio_titulo: row.estudio_titulo || "Estudio médico",
      estudio_fecha: row.estudio_fecha,
    }));
  } catch (error) {
    console.error("Error al obtener enlaces compartidos:", error);
    return [];
  }
}
