import { API_URL, request, authHeaders, jsonHeaders, toQueryString } from "../api.js";

// ─── Dashboard ──────────────────────────────────────────────────

export async function getDashboardCobranzas() {
  return request(
    `${API_URL}/cobranzas/dashboard/`,
    { headers: authHeaders(), cache: "no-store" },
    "ver dashboard de cobranzas",
  );
}

// ─── Cuentas por Cobrar ─────────────────────────────────────────

export async function getCuentasPorCobrar(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/cobranzas/cuentas/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver cuentas por cobrar",
  );
}

export async function getCuentaPorCobrar(id) {
  return request(
    `${API_URL}/cobranzas/cuentas/${id}/`,
    { headers: authHeaders(), cache: "no-store" },
    "ver detalle de cuenta por cobrar",
  );
}

export async function crearCuentaPorCobrar(data) {
  return request(
    `${API_URL}/cobranzas/cuentas/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear cuenta por cobrar",
  );
}

export async function registrarPagoCuenta(cuentaId, data) {
  return request(
    `${API_URL}/cobranzas/cuentas/${cuentaId}/registrar-pago/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "registrar pago de cuenta",
  );
}

export async function getAntiguedadSaldos() {
  return request(
    `${API_URL}/cobranzas/cuentas/antiguedad/`,
    { headers: authHeaders(), cache: "no-store" },
    "ver antigüedad de saldos",
  );
}

// ─── Líneas de Crédito ──────────────────────────────────────────

export async function getLineasCredito(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/cobranzas/lineas-credito/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver líneas de crédito",
  );
}

export async function createLineaCredito(data) {
  return request(
    `${API_URL}/cobranzas/lineas-credito/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear línea de crédito",
  );
}

export async function updateLineaCredito(id, data) {
  return request(
    `${API_URL}/cobranzas/lineas-credito/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar línea de crédito",
  );
}

export async function bloquearLineaCredito(id, data = {}) {
  return request(
    `${API_URL}/cobranzas/lineas-credito/${id}/bloquear/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "bloquear línea de crédito",
  );
}

export async function desbloquearLineaCredito(id, data = {}) {
  return request(
    `${API_URL}/cobranzas/lineas-credito/${id}/desbloquear/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "desbloquear línea de crédito",
  );
}

// ─── Cheques ────────────────────────────────────────────────────

export async function getCheques(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/cobranzas/cheques/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver cheques recibidos",
  );
}

export async function depositarCheque(id) {
  return request(
    `${API_URL}/cobranzas/cheques/${id}/depositar/`,
    { method: "POST", headers: authHeaders() },
    "depositar cheque",
  );
}

export async function confirmarCobroCheque(id) {
  return request(
    `${API_URL}/cobranzas/cheques/${id}/confirmar-cobro/`,
    { method: "POST", headers: authHeaders() },
    "confirmar cobro de cheque",
  );
}

export async function rechazarCheque(id, data) {
  return request(
    `${API_URL}/cobranzas/cheques/${id}/rechazar/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "rechazar cheque",
  );
}

// ─── Pagos / Verificaciones ─────────────────────────────────────

export async function getPagosCobranza(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/cobranzas/pagos/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver pagos de cobranza",
  );
}

export async function verificarPago(id, data) {
  return request(
    `${API_URL}/cobranzas/pagos/${id}/verificar/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "verificar pago bancario",
  );
}
