import { API_URL, request, authHeaders, toQueryString } from "../api.js";

// ─── Inventario & Lotes ─────────────────────────────────────────

export async function getLotesPorVariante(varianteId) {
  return request(
    `${API_URL}/inventario/lotes/?variante=${varianteId}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver lotes por variante",
  );
}

/**
 * Obtiene el stock detallado por lotes y depósitos.
 */
export async function getStockLotes(params = {}) {
  return request(
    `${API_URL}/inventario/stock-lotes/${toQueryString(params)}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver stock por lotes",
  );
}

/**
 * Obtiene todos los lotes de stock (sin paginación).
 * Útil para listados donde se necesitan todos los lotes disponibles.
 */
export async function getAllStockLotes() {
  return request(
    `${API_URL}/inventario/stock-lotes/`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver todos los lotes de stock",
  );
}

// ─── Lotes por Variante (con varianteId como parámetro) ─────────

export async function getLotesPorVarianteId(varianteId) {
  return request(
    `${API_URL}/inventario/stock-lotes/?variante=${varianteId}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver lotes por variante",
  );
}
