import {
  API_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api.js";

// ─── Órdenes de Compra ──────────────────────────────────────────

/**
 * Lista órdenes de compra con filtros opcionales.
 * @param {Object} params - { page, estado, proveedor, search, fecha_desde, fecha_hasta }
 */
export async function getOrdenesCompra(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/compras/ordenes/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver órdenes de compra",
  );
}

/**
 * Obtiene detalle de una orden de compra.
 */
export async function getOrdenCompra(id) {
  return request(
    `${API_URL}/compras/ordenes/${id}/`,
    { headers: authHeaders(), cache: "no-store" },
    "ver orden de compra",
  );
}

/**
 * Crea una nueva orden de compra.
 */
export async function createOrdenCompra(data) {
  return request(
    `${API_URL}/compras/ordenes/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear orden de compra",
  );
}

/**
 * Actualiza una orden de compra existente.
 */
export async function updateOrdenCompra(id, data) {
  return request(
    `${API_URL}/compras/ordenes/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar orden de compra",
  );
}

/**
 * Obtiene el siguiente número sugerido para una OC.
 */
export async function getSiguienteNumeroOC() {
  return request(
    `${API_URL}/compras/ordenes/siguiente-numero/`,
    { headers: authHeaders(), cache: "no-store" },
    "obtener siguiente número OC",
  );
}

// ─── Acciones de Estado ─────────────────────────────────────────

export async function confirmarOrden(id) {
  return request(
    `${API_URL}/compras/ordenes/${id}/confirmar/`,
    { method: "POST", headers: jsonHeaders() },
    "confirmar orden de compra",
  );
}

export async function marcarPagadaOrden(id, data = {}) {
  return request(
    `${API_URL}/compras/ordenes/${id}/marcar-pagada/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "marcar orden como pagada",
  );
}

export async function recepcionParcialOrden(id) {
  return request(
    `${API_URL}/compras/ordenes/${id}/recepcion-parcial/`,
    { method: "POST", headers: jsonHeaders() },
    "registrar recepción parcial",
  );
}

export async function marcarRecibidaOrden(id) {
  return request(
    `${API_URL}/compras/ordenes/${id}/marcar-recibida/`,
    { method: "POST", headers: jsonHeaders() },
    "marcar orden como recibida",
  );
}

export async function cancelarOrden(id) {
  return request(
    `${API_URL}/compras/ordenes/${id}/cancelar/`,
    { method: "POST", headers: jsonHeaders() },
    "cancelar orden de compra",
  );
}

// ─── Vinculaciones ──────────────────────────────────────────────

/**
 * Vincula un gasto (pago) a una orden de compra.
 * @param {number} ordenId - ID de la orden
 * @param {Object} data - { gasto_id, concepto_pago }
 */
export async function vincularPagoOrden(ordenId, data) {
  return request(
    `${API_URL}/compras/ordenes/${ordenId}/vincular-pago/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "vincular pago a orden de compra",
  );
}

/**
 * Vincula un ingreso de mercadería a una orden de compra.
 * @param {number} ordenId - ID de la orden
 * @param {Object} data - { ingreso_mercaderia_id }
 */
export async function vincularIngresoOrden(ordenId, data) {
  return request(
    `${API_URL}/compras/ordenes/${ordenId}/vincular-ingreso/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "vincular ingreso de mercadería",
  );
}
