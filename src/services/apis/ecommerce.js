import {
  API_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api.js";

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
