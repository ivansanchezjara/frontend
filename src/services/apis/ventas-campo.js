import {
  API_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api.js";

const BASE = `${API_URL}/ventas-campo`;

// ─── Eventos de Campo ───────────────────────────────────────────

export async function getEventos(params = {}) {
  const query = toQueryString(params);
  return request(
    `${BASE}/eventos/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver eventos de campo",
  );
}

export async function getEvento(id) {
  return request(
    `${BASE}/eventos/${id}/`,
    { headers: authHeaders(), cache: "no-store" },
    "ver detalle de evento",
  );
}

export async function createEvento(data) {
  return request(
    `${BASE}/eventos/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear evento de campo",
  );
}

export async function updateEvento(id, data) {
  return request(
    `${BASE}/eventos/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar evento de campo",
  );
}

// ─── Transiciones de estado del evento ──────────────────────────

export async function activarEvento(id) {
  return request(
    `${BASE}/eventos/${id}/activar/`,
    { method: "POST", headers: authHeaders() },
    "activar evento",
  );
}

export async function cerrarEvento(id) {
  return request(
    `${BASE}/eventos/${id}/cerrar/`,
    { method: "POST", headers: authHeaders() },
    "cerrar evento",
  );
}

export async function rendirEvento(id) {
  return request(
    `${BASE}/eventos/${id}/rendir/`,
    { method: "POST", headers: authHeaders() },
    "rendir evento",
  );
}

export async function cancelarEvento(id) {
  return request(
    `${BASE}/eventos/${id}/cancelar/`,
    { method: "POST", headers: authHeaders() },
    "cancelar evento",
  );
}

// ─── Vendedores del evento ──────────────────────────────────────

export async function asignarVendedor(eventoId, data) {
  return request(
    `${BASE}/eventos/${eventoId}/asignar-vendedor/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "asignar vendedor al evento",
  );
}

export async function desasignarVendedor(eventoId, vendedorId) {
  return request(
    `${BASE}/eventos/${eventoId}/desasignar-vendedor/${vendedorId}/`,
    { method: "DELETE", headers: authHeaders() },
    "desasignar vendedor del evento",
  );
}

// ─── Stock del evento ───────────────────────────────────────────

export async function getStockEvento(eventoId) {
  return request(
    `${BASE}/eventos/${eventoId}/stock/`,
    { headers: authHeaders(), cache: "no-store" },
    "ver stock del evento",
  );
}

// ─── POS de Campo ───────────────────────────────────────────────

export async function crearVentaCampo(eventoId, data) {
  return request(
    `${BASE}/eventos/${eventoId}/pos/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "registrar venta en campo",
  );
}

// ─── Solicitudes de Reposición ──────────────────────────────────

export async function getSolicitudes(params = {}) {
  const query = toQueryString(params);
  return request(
    `${BASE}/solicitudes-reposicion/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver solicitudes de reposición",
  );
}

export async function getSolicitud(id) {
  return request(
    `${BASE}/solicitudes-reposicion/${id}/`,
    { headers: authHeaders(), cache: "no-store" },
    "ver detalle de solicitud",
  );
}

export async function createSolicitud(data) {
  return request(
    `${BASE}/solicitudes-reposicion/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear solicitud de reposición",
  );
}

export async function aprobarSolicitud(id, data = {}) {
  return request(
    `${BASE}/solicitudes-reposicion/${id}/aprobar/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "aprobar solicitud de reposición",
  );
}

export async function rechazarSolicitud(id, data = {}) {
  return request(
    `${BASE}/solicitudes-reposicion/${id}/rechazar/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "rechazar solicitud de reposición",
  );
}

export async function enviarSolicitud(id) {
  return request(
    `${BASE}/solicitudes-reposicion/${id}/enviar/`,
    { method: "POST", headers: authHeaders() },
    "marcar solicitud como enviada",
  );
}

export async function confirmarRecepcion(id) {
  return request(
    `${BASE}/solicitudes-reposicion/${id}/confirmar-recepcion/`,
    { method: "POST", headers: authHeaders() },
    "confirmar recepción de reposición",
  );
}
