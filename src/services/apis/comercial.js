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

// ─── Metas de Vendedores ───────────────────────────────────────

export async function getMetasResumen(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/metas-vendedor/resumen/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "resumen de metas",
  );
}

export async function getMetasVendedor(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/metas-vendedor/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "metas de vendedores",
  );
}

export async function crearMeta(data) {
  return request(
    `${API_URL}/ventas/metas-vendedor/`,
    {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    },
    "crear meta",
  );
}

export async function actualizarMeta(id, data) {
  return request(
    `${API_URL}/ventas/metas-vendedor/${id}/`,
    {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar meta",
  );
}

export async function cancelarMeta(id) {
  return request(
    `${API_URL}/ventas/metas-vendedor/${id}/cancelar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "cancelar meta",
  );
}
