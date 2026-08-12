import {
  API_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api.js";

// ─── Clientes Online ────────────────────────────────────────────

export async function getClientesOnline(params = {}) {
  const query = toQueryString({ cuenta_online: "true", ...params });
  return request(
    `${API_URL}/ventas/cuentas/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver clientes con cuenta online",
  );
}

// ─── Preguntas de Productos ─────────────────────────────────────

export async function getPreguntasAdmin(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ecommerce/admin/preguntas/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver preguntas del e-commerce",
  );
}

export async function responderPregunta(id, respuesta) {
  return request(
    `${API_URL}/ecommerce/admin/preguntas/${id}/responder/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ respuesta }),
    },
    "responder pregunta",
  );
}

export async function eliminarPregunta(id) {
  return request(
    `${API_URL}/ecommerce/admin/preguntas/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar pregunta",
  );
}

// ─── Reseñas / Evaluaciones ─────────────────────────────────────

export async function getResenasAdmin(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ecommerce/admin/resenas/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver reseñas del e-commerce",
  );
}

export async function moderarResena(id, data) {
  return request(
    `${API_URL}/ecommerce/admin/resenas/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "moderar reseña",
  );
}


// ─── Banners ────────────────────────────────────────────────────

export async function getBannersAdmin(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ecommerce/admin/banners/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver banners del e-commerce",
  );
}

export async function crearBanner(data) {
  return request(
    `${API_URL}/ecommerce/admin/banners/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear banner",
  );
}

export async function actualizarBanner(id, data) {
  return request(
    `${API_URL}/ecommerce/admin/banners/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar banner",
  );
}

export async function toggleBanner(id) {
  return request(
    `${API_URL}/ecommerce/admin/banners/${id}/toggle/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "activar/desactivar banner",
  );
}

export async function eliminarBanner(id) {
  return request(
    `${API_URL}/ecommerce/admin/banners/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar banner",
  );
}
