"use server";

import { pool } from "@/lib/database";
import { RowDataPacket } from "mysql2/promise";
import { verifyAuth } from "./auth";

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  email: string;
  image: string | null;
  total_estudios: number;
  total_compartidos: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  image: string | null;
  totalEstudios: number;
  totalCompartidos: number;
}

export interface UsersResponse {
  users: User[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
}

/**
 * Obtiene el listado de usuarios con paginación
 * @param page - Número de página (inicia en 1)
 * @param perPage - Cantidad de usuarios por página
 */
export async function getUsers(
  page: number = 1,
  perPage: number = 20
): Promise<UsersResponse> {
  try {
    const isAuthenticated = await verifyAuth();
    if (!isAuthenticated) {
      return {
        users: [],
        total: 0,
        page: 1,
        totalPages: 0,
        perPage: 0,
      };
    }
    // Calcular offset
    const offset = (page - 1) * perPage;

    // Obtener total de usuarios
    const [countRows] = await pool.execute<RowDataPacket[]>(
      "SELECT COUNT(*) as total FROM users"
    );
    const total = countRows[0].total;

    // Obtener usuarios paginados ordenados por ID DESC
    // Incluye cantidad de estudios y compartidos por usuario
    const [rows] = await pool.execute<UserRow[]>(
      `SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.image,
        COALESCE(COUNT(DISTINCT e.id), 0) as total_estudios,
        COALESCE(COUNT(DISTINCT l.id), 0) as total_compartidos
       FROM users u
       LEFT JOIN estudios e ON u.id = e.id_usuario
       LEFT JOIN links l ON u.id = l.id_usuario
       GROUP BY u.id, u.name, u.email, u.image
       ORDER BY u.id DESC
       LIMIT ? OFFSET ?`,
      [perPage, offset]
    );

    const users: User[] = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      image: row.image,
      totalEstudios: row.total_estudios,
      totalCompartidos: row.total_compartidos,
    }));

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / perPage),
      perPage,
    };
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return {
      users: [],
      total: 0,
      page: 1,
      totalPages: 0,
      perPage,
    };
  }
}
