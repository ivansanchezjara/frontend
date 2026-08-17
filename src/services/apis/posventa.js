import {
  API_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api";

// ─── Reclamos ─────────────────────────────────────────────────────

export async function getReclamos(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/posventa/reclamos/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver reclamos",
  );
}

export async function getReclamo(id) {
  return request(
    `${API_URL}/posventa/reclamos/${id}/`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver detalle de reclamo",
  );
}

export async function crearReclamo(data) {
  return request(
    `${API_URL}/posventa/reclamos/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear reclamo",
  );
}

export async function transicionReclamo(id, data) {
  return request(
    `${API_URL}/posventa/reclamos/${id}/transicion/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "transicionar reclamo",
  );
}

export async function getSeguimientos(reclamoId) {
  return request(
    `${API_URL}/posventa/reclamos/${reclamoId}/seguimientos/`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver seguimientos",
  );
}

export async function agregarSeguimiento(reclamoId, data) {
  return request(
    `${API_URL}/posventa/reclamos/${reclamoId}/seguimientos/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "agregar seguimiento",
  );
}

export async function registrarEncuesta(reclamoId, data) {
  return request(
    `${API_URL}/posventa/reclamos/${reclamoId}/encuesta/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "registrar encuesta",
  );
}

export async function getEncuesta(reclamoId) {
  return request(
    `${API_URL}/posventa/reclamos/${reclamoId}/encuesta/`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver encuesta",
  );
}

// ─── Garantías ────────────────────────────────────────────────────

export async function getGarantias(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/posventa/garantias/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver garantías",
  );
}

export async function getGarantia(id) {
  return request(
    `${API_URL}/posventa/garantias/${id}/`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver detalle de garantía",
  );
}

export async function crearGarantia(data) {
  return request(
    `${API_URL}/posventa/garantias/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear garantía",
  );
}

export async function verificarGarantia(id) {
  return request(
    `${API_URL}/posventa/garantias/${id}/verificar/`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "verificar garantía",
  );
}

// ─── Reparaciones ─────────────────────────────────────────────────

export async function getReparaciones(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/posventa/reparaciones/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver reparaciones",
  );
}

export async function getReparacion(id) {
  return request(
    `${API_URL}/posventa/reparaciones/${id}/`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver detalle de reparación",
  );
}

export async function crearReparacion(data) {
  return request(
    `${API_URL}/posventa/reparaciones/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear reparación",
  );
}

export async function diagnosticarReparacion(id, data) {
  return request(
    `${API_URL}/posventa/reparaciones/${id}/diagnosticar/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "diagnosticar reparación",
  );
}

export async function iniciarReparacion(id) {
  return request(
    `${API_URL}/posventa/reparaciones/${id}/iniciar/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify({}) },
    "iniciar reparación",
  );
}

export async function completarReparacion(id, data) {
  return request(
    `${API_URL}/posventa/reparaciones/${id}/completar/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "completar reparación",
  );
}

export async function marcarNoReparable(id, data = {}) {
  return request(
    `${API_URL}/posventa/reparaciones/${id}/no-reparable/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "marcar no reparable",
  );
}

export async function entregarEquipo(id, data) {
  return request(
    `${API_URL}/posventa/reparaciones/${id}/entregar/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "entregar equipo",
  );
}
