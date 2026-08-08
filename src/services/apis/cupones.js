import { API_URL, request, authHeaders, jsonHeaders, toQueryString } from "../api.js";

// ─── CRUD de Cupones (Admin) ────────────────────────────────────

/**
 * Lista todos los cupones con filtros opcionales.
 * @param {Object} params - { estado, buscar }
 */
export async function getCupones(params = {}) {
  const query = toQueryString(params);
  const data = await request(
    `${API_URL}/ecommerce/admin/cupones/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "cupones"
  );
  return data.results || data;
}

/**
 * Obtiene el detalle de un cupón.
 * @param {number} id
 */
export async function getCupon(id) {
  return request(
    `${API_URL}/ecommerce/admin/cupones/${id}/`,
    { method: "GET", headers: authHeaders() },
    "detalle de cupón"
  );
}

/**
 * Crea un nuevo cupón.
 * @param {Object} data
 */
export async function crearCupon(data) {
  return request(
    `${API_URL}/ecommerce/admin/cupones/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear cupón"
  );
}

/**
 * Actualiza un cupón existente.
 * @param {number} id
 * @param {Object} data
 */
export async function actualizarCupon(id, data) {
  return request(
    `${API_URL}/ecommerce/admin/cupones/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar cupón"
  );
}

/**
 * Desactiva (soft delete) un cupón.
 * @param {number} id
 */
export async function eliminarCupon(id) {
  return request(
    `${API_URL}/ecommerce/admin/cupones/${id}/`,
    { method: "DELETE", headers: authHeaders() },
    "eliminar cupón"
  );
}

/**
 * Activa/desactiva un cupón.
 * @param {number} id
 */
export async function toggleCupon(id) {
  return request(
    `${API_URL}/ecommerce/admin/cupones/${id}/toggle/`,
    { method: "POST", headers: authHeaders() },
    "toggle cupón"
  );
}

/**
 * Asigna un cupón a clientes específicos.
 * @param {number} id - ID del cupón
 * @param {number[]} cuentasIds - IDs de cuentas comerciales
 */
export async function asignarCupon(id, cuentasIds) {
  return request(
    `${API_URL}/ecommerce/admin/cupones/${id}/asignar/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ cuentas_ids: cuentasIds }),
    },
    "asignar cupón"
  );
}
