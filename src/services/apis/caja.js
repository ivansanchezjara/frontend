import {
  API_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api.js";

// ─── Sesiones de Caja ───────────────────────────────────────────

export async function getSesiones(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/caja/sesiones/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver sesiones de caja",
  );
}

export async function getSesionDetalle(id) {
  return request(
    `${API_URL}/caja/sesiones/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de sesión de caja",
  );
}

export async function abrirCaja(data) {
  return request(
    `${API_URL}/caja/sesiones/abrir/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "abrir caja",
  );
}

export async function cerrarCaja(id, data) {
  return request(
    `${API_URL}/caja/sesiones/${id}/cerrar/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "cerrar caja",
  );
}

// ─── Movimientos de Caja ────────────────────────────────────────

export async function getMovimientos(id) {
  return request(
    `${API_URL}/caja/sesiones/${id}/movimientos/`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver movimientos de sesión",
  );
}

export async function registrarMovimiento(id, data) {
  return request(
    `${API_URL}/caja/sesiones/${id}/movimientos/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "registrar movimiento de caja",
  );
}

// ─── Cola de Cobro ──────────────────────────────────────────────

export async function getColaCobro(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/caja/cola-cobro/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver cola de cobro",
  );
}

export async function getColaCobroDetalle(id) {
  return request(
    `${API_URL}/caja/cola-cobro/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de pedido en cola de cobro",
  );
}

export async function cobrarPedido(id, data) {
  return request(
    `${API_URL}/caja/cola-cobro/${id}/cobrar/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "cobrar pedido",
  );
}

// ─── Cola de Entrega ────────────────────────────────────────────

export async function getColaEntrega(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/caja/cola-entrega/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver cola de entrega",
  );
}

export async function entregarPedido(id) {
  return request(
    `${API_URL}/caja/cola-entrega/${id}/entregar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "registrar entrega de pedido",
  );
}

// ─── Comprobantes Internos ──────────────────────────────────────

export async function getComprobantes(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/caja/comprobantes/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver comprobantes internos",
  );
}

export async function getComprobante(id) {
  return request(
    `${API_URL}/caja/comprobantes/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de comprobante",
  );
}

export async function anularComprobante(id, data) {
  return request(
    `${API_URL}/caja/comprobantes/${id}/anular/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "anular comprobante interno",
  );
}

// ─── Facturas Legales ───────────────────────────────────────────

export async function getFacturas(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/caja/facturas/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver facturas legales",
  );
}

export async function anularFactura(id, data) {
  return request(
    `${API_URL}/caja/facturas/${id}/anular/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "anular factura legal",
  );
}

// ─── Notas de Crédito ───────────────────────────────────────────

export async function getNotasCredito(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/caja/notas-credito/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver notas de crédito",
  );
}

export async function emitirNotaCredito(data) {
  return request(
    `${API_URL}/caja/notas-credito/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "emitir nota de crédito",
  );
}

// ─── Puntos de Expedición ────────────────────────────────────────

export async function getPuntosExpedicion(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/caja/puntos-expedicion/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver puntos de expedición",
  );
}

// ─── Timbrados ──────────────────────────────────────────────────

export async function getTimbrados(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/caja/timbrados/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver timbrados",
  );
}

export async function crearTimbrado(data) {
  return request(
    `${API_URL}/caja/timbrados/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear timbrado",
  );
}

export async function actualizarTimbrado(id, data) {
  return request(
    `${API_URL}/caja/timbrados/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar timbrado",
  );
}

// ─── Reportes ───────────────────────────────────────────────────

export async function getResumenDiario(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/caja/reportes/resumen-diario/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver resumen diario de caja",
  );
}
