import {
  API_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api.js";

// ─── Tipos de Servicio ──────────────────────────────────────────

export async function getTiposServicio(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/asistencia/tipos-servicio/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver tipos de servicio",
  );
}

export async function createTipoServicio(data) {
  return request(
    `${API_URL}/asistencia/tipos-servicio/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear tipo de servicio",
  );
}

export async function updateTipoServicio(id, data) {
  return request(
    `${API_URL}/asistencia/tipos-servicio/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar tipo de servicio",
  );
}

export async function deleteTipoServicio(id) {
  return request(
    `${API_URL}/asistencia/tipos-servicio/${id}/`,
    { method: "DELETE", headers: authHeaders() },
    "eliminar tipo de servicio",
  );
}

// ─── Técnicos ───────────────────────────────────────────────────

export async function getTecnicos(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/asistencia/tecnicos/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver técnicos",
  );
}

export async function getTecnico(id) {
  return request(
    `${API_URL}/asistencia/tecnicos/${id}/`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver detalle de técnico",
  );
}

export async function createTecnico(data) {
  return request(
    `${API_URL}/asistencia/tecnicos/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear técnico",
  );
}

export async function updateTecnico(id, data) {
  return request(
    `${API_URL}/asistencia/tecnicos/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar técnico",
  );
}

export async function getAgendaTecnico(id) {
  return request(
    `${API_URL}/asistencia/tecnicos/${id}/agenda/`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver agenda del técnico",
  );
}

// ─── Disponibilidad ─────────────────────────────────────────────

export async function getDisponibilidades(tecnicoId) {
  return request(
    `${API_URL}/asistencia/tecnicos/${tecnicoId}/disponibilidades/`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver disponibilidades",
  );
}

export async function createDisponibilidad(tecnicoId, data) {
  return request(
    `${API_URL}/asistencia/tecnicos/${tecnicoId}/disponibilidades/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear disponibilidad",
  );
}

export async function deleteDisponibilidad(tecnicoId, id) {
  return request(
    `${API_URL}/asistencia/tecnicos/${tecnicoId}/disponibilidades/${id}/`,
    { method: "DELETE", headers: authHeaders() },
    "eliminar disponibilidad",
  );
}

// ─── Bloqueos ───────────────────────────────────────────────────

export async function getBloqueos(tecnicoId) {
  return request(
    `${API_URL}/asistencia/tecnicos/${tecnicoId}/bloqueos/`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver bloqueos de agenda",
  );
}

export async function createBloqueo(tecnicoId, data) {
  return request(
    `${API_URL}/asistencia/tecnicos/${tecnicoId}/bloqueos/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear bloqueo de agenda",
  );
}

export async function deleteBloqueo(tecnicoId, id) {
  return request(
    `${API_URL}/asistencia/tecnicos/${tecnicoId}/bloqueos/${id}/`,
    { method: "DELETE", headers: authHeaders() },
    "eliminar bloqueo",
  );
}

// ─── Órdenes de Trabajo ─────────────────────────────────────────

export async function getOrdenes(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/asistencia/ordenes/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver órdenes de trabajo",
  );
}

export async function getOrden(id) {
  return request(
    `${API_URL}/asistencia/ordenes/${id}/`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver detalle de orden",
  );
}

export async function createOrden(data) {
  return request(
    `${API_URL}/asistencia/ordenes/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear orden de trabajo",
  );
}

export async function updateOrden(id, data) {
  return request(
    `${API_URL}/asistencia/ordenes/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar orden de trabajo",
  );
}

// ─── Transiciones de Estado ─────────────────────────────────────

export async function asignarOrden(id, tecnicoId) {
  return request(
    `${API_URL}/asistencia/ordenes/${id}/asignar/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ tecnico_id: tecnicoId }),
    },
    "asignar técnico a orden",
  );
}

export async function iniciarOrden(id) {
  return request(
    `${API_URL}/asistencia/ordenes/${id}/iniciar/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify({}) },
    "iniciar orden de trabajo",
  );
}

export async function completarOrden(id, observaciones = "") {
  return request(
    `${API_URL}/asistencia/ordenes/${id}/completar/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ observaciones_cierre: observaciones }),
    },
    "completar orden de trabajo",
  );
}

export async function cancelarOrden(id, motivo) {
  return request(
    `${API_URL}/asistencia/ordenes/${id}/cancelar/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify({ motivo }),
    },
    "cancelar orden de trabajo",
  );
}

// ─── Notas Técnicas ─────────────────────────────────────────────

export async function getNotas(ordenId) {
  return request(
    `${API_URL}/asistencia/ordenes/${ordenId}/notas/`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver notas de orden",
  );
}

export async function createNota(ordenId, data) {
  return request(
    `${API_URL}/asistencia/ordenes/${ordenId}/notas/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "agregar nota técnica",
  );
}

// ─── Materiales ─────────────────────────────────────────────────

export async function getMateriales(ordenId) {
  return request(
    `${API_URL}/asistencia/ordenes/${ordenId}/materiales/`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver materiales de orden",
  );
}

export async function createMaterial(ordenId, data) {
  return request(
    `${API_URL}/asistencia/ordenes/${ordenId}/materiales/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "agregar material utilizado",
  );
}

// ─── Rastreo GPS ────────────────────────────────────────────────

export async function reportarUbicacion(data) {
  return request(
    `${API_URL}/asistencia/rastreo/reportar/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "reportar ubicación",
  );
}

export async function iniciarTracking(motivo = "Salida de sucursal") {
  return request(
    `${API_URL}/asistencia/rastreo/iniciar/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify({ motivo }) },
    "iniciar tracking",
  );
}

export async function detenerTracking(motivo = "Regreso a sucursal") {
  return request(
    `${API_URL}/asistencia/rastreo/detener/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify({ motivo }) },
    "detener tracking",
  );
}

export async function getEstadoTracking() {
  return request(
    `${API_URL}/asistencia/rastreo/estado/`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver estado de tracking",
  );
}

export async function getMapaTecnicos() {
  return request(
    `${API_URL}/asistencia/rastreo/mapa/`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver mapa de técnicos",
  );
}

export async function getHistorialUbicaciones(tecnicoId, params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/asistencia/rastreo/historial/${tecnicoId}/${query}`,
    { method: "GET", headers: authHeaders(), cache: "no-store" },
    "ver historial de ubicaciones",
  );
}
