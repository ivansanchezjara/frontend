import {
  API_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api.js";

// ─── Cuentas Financieras ────────────────────────────────────────

export async function getCuentas(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/finanzas/cuentas/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver cuentas financieras",
  );
}

export async function getCuenta(id) {
  return request(
    `${API_URL}/finanzas/cuentas/${id}/`,
    { headers: authHeaders(), cache: "no-store" },
    "ver cuenta financiera",
  );
}

export async function createCuenta(data) {
  return request(
    `${API_URL}/finanzas/cuentas/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear cuenta financiera",
  );
}

export async function updateCuenta(id, data) {
  return request(
    `${API_URL}/finanzas/cuentas/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar cuenta financiera",
  );
}

// ─── Movimientos Financieros ────────────────────────────────────

export async function getMovimientos(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/finanzas/movimientos/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver movimientos financieros",
  );
}

export async function registrarMovimiento(data) {
  return request(
    `${API_URL}/finanzas/movimientos/registrar/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "registrar movimiento",
  );
}

export async function transferirEntreCuentas(data) {
  return request(
    `${API_URL}/finanzas/movimientos/transferir/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "transferir entre cuentas",
  );
}

// ─── Cheques ────────────────────────────────────────────────────

export async function getChequesTesoreria(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/finanzas/cheques/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver cheques",
  );
}

export async function createCheque(data) {
  return request(
    `${API_URL}/finanzas/cheques/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "registrar cheque",
  );
}

export async function depositarChequeTesoreria(id, data) {
  return request(
    `${API_URL}/finanzas/cheques/${id}/depositar/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "depositar cheque",
  );
}

export async function acreditarChequeTesoreria(id, data = {}) {
  return request(
    `${API_URL}/finanzas/cheques/${id}/acreditar/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "acreditar cheque",
  );
}

export async function rechazarChequeTesoreria(id, data) {
  return request(
    `${API_URL}/finanzas/cheques/${id}/rechazar/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "rechazar cheque",
  );
}

export async function emitirChequeTesoreria(id, data) {
  return request(
    `${API_URL}/finanzas/cheques/${id}/emitir/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "emitir cheque",
  );
}
