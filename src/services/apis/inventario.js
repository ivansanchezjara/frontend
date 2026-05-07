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
    "ver lotes",
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
