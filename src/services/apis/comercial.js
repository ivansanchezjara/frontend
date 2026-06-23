import {
  API_URL,
  request,
  authHeaders,
  toQueryString,
} from "../api.js";

// ─── Rendimiento de Vendedores ─────────────────────────────────

export async function getRendimientoVendedores(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/analytics/rendimiento-vendedores/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "rendimiento de vendedores",
  );
}

// ─── Análisis de Ventas ────────────────────────────────────────

export async function getAnalisisVentas(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/analytics/analisis-ventas/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "análisis de ventas",
  );
}

// ─── Seguimiento Pipeline ──────────────────────────────────────

export async function getSeguimientoPipeline() {
  return request(
    `${API_URL}/ventas/analytics/seguimiento-pipeline/`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "seguimiento de pipeline",
  );
}
