import {
  API_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api.js";

// ─── Precios de Variantes ──────────────────────────────────────────

export async function getPreciosVariantes(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/catalogo/precios/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver precios de variantes",
  );
}

export async function actualizarPrecioVariante(id, data) {
  return request(
    `${API_URL}/catalogo/precios/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar precio de variante",
  );
}

export async function bulkUpdatePrecios(data) {
  return request(
    `${API_URL}/catalogo/precios/bulk-update/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualización masiva de precios",
  );
}

export async function getPreciosStats() {
  return request(
    `${API_URL}/catalogo/precios/stats/`,
    {
      headers: authHeaders(),
    },
    "estadísticas de precios",
  );
}

export async function getHistorialPrecios(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/catalogo/precios/historial-precios/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "historial de cambios de precios",
  );
}

// ─── Promociones por Volumen ───────────────────────────────────────

export async function getPromociones(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/catalogo/promociones-volumen/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver promociones por volumen",
  );
}

export async function crearPromocion(data) {
  return request(
    `${API_URL}/catalogo/promociones-volumen/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear promoción por volumen",
  );
}

export async function actualizarPromocion(id, data) {
  return request(
    `${API_URL}/catalogo/promociones-volumen/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar promoción",
  );
}

export async function eliminarPromocion(id) {
  return request(
    `${API_URL}/catalogo/promociones-volumen/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar promoción",
  );
}

// ─── Combos ────────────────────────────────────────────────────────

export async function getCombos(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/catalogo/combos/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver combos",
  );
}

export async function getCombo(id) {
  return request(
    `${API_URL}/catalogo/combos/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de combo",
  );
}

export async function crearCombo(data) {
  return request(
    `${API_URL}/catalogo/combos/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear combo",
  );
}

export async function actualizarCombo(id, data) {
  return request(
    `${API_URL}/catalogo/combos/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar combo",
  );
}

export async function eliminarCombo(id) {
  return request(
    `${API_URL}/catalogo/combos/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar combo",
  );
}
