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

// ─── Catálogos PDF ──────────────────────────────────────────────

export async function getCatalogosAdmin(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ecommerce/admin/catalogos/${query}`,
    { headers: authHeaders() },
    "obtener catálogos",
  );
}

export async function crearCatalogo(data) {
  return request(
    `${API_URL}/ecommerce/admin/catalogos/`,
    {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "crear catálogo",
  );
}

export async function actualizarCatalogo(id, data) {
  return request(
    `${API_URL}/ecommerce/admin/catalogos/${id}/`,
    {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "actualizar catálogo",
  );
}

export async function toggleCatalogo(id) {
  return request(
    `${API_URL}/ecommerce/admin/catalogos/${id}/toggle/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "activar/desactivar catálogo",
  );
}

export async function eliminarCatalogo(id) {
  return request(
    `${API_URL}/ecommerce/admin/catalogos/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar catálogo",
  );
}


// ─── Eventos ────────────────────────────────────────────────────

export async function getEventosAdmin(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ecommerce/admin/eventos/${query}`,
    { headers: authHeaders() },
    "obtener eventos",
  );
}

export async function crearEvento(data) {
  return request(
    `${API_URL}/ecommerce/admin/eventos/`,
    {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "crear evento",
  );
}

export async function actualizarEvento(id, data) {
  return request(
    `${API_URL}/ecommerce/admin/eventos/${id}/`,
    {
      method: "PATCH",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    "actualizar evento",
  );
}

export async function toggleEvento(id) {
  return request(
    `${API_URL}/ecommerce/admin/eventos/${id}/toggle/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "activar/desactivar evento",
  );
}

export async function eliminarEvento(id) {
  return request(
    `${API_URL}/ecommerce/admin/eventos/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar evento",
  );
}
