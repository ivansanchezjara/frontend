import { API_URL, request, authHeaders, toQueryString } from "../api.js";

// ─── Reportes Gerenciales ───────────────────────────────────────

export async function getReportePYL(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/reportes/pyl/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver estado de resultados",
  );
}

export async function getKPIsVentas(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/reportes/kpis-ventas/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver KPIs de ventas",
  );
}
