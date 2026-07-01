import {
  API_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api.js";

// ─── Departamentos ──────────────────────────────────────────────

export async function getDepartamentos(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/rrhh/departamentos/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver departamentos",
  );
}

export async function getDepartamento(id) {
  return request(
    `${API_URL}/rrhh/departamentos/${id}/`,
    { headers: authHeaders(), cache: "no-store" },
    "ver departamento",
  );
}

export async function createDepartamento(data) {
  return request(
    `${API_URL}/rrhh/departamentos/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear departamento",
  );
}

export async function updateDepartamento(id, data) {
  return request(
    `${API_URL}/rrhh/departamentos/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar departamento",
  );
}

export async function deleteDepartamento(id) {
  return request(
    `${API_URL}/rrhh/departamentos/${id}/`,
    { method: "DELETE", headers: authHeaders() },
    "eliminar departamento",
  );
}

// ─── Cargos ─────────────────────────────────────────────────────

export async function getCargos(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/rrhh/cargos/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver cargos",
  );
}

export async function getCargo(id) {
  return request(
    `${API_URL}/rrhh/cargos/${id}/`,
    { headers: authHeaders(), cache: "no-store" },
    "ver cargo",
  );
}

export async function createCargo(data) {
  return request(
    `${API_URL}/rrhh/cargos/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear cargo",
  );
}

export async function updateCargo(id, data) {
  return request(
    `${API_URL}/rrhh/cargos/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar cargo",
  );
}

export async function deleteCargo(id) {
  return request(
    `${API_URL}/rrhh/cargos/${id}/`,
    { method: "DELETE", headers: authHeaders() },
    "eliminar cargo",
  );
}

// ─── Funcionarios ───────────────────────────────────────────────

export async function getFuncionarios(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/rrhh/funcionarios/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver funcionarios",
  );
}

export async function getFuncionario(id) {
  return request(
    `${API_URL}/rrhh/funcionarios/${id}/`,
    { headers: authHeaders(), cache: "no-store" },
    "ver funcionario",
  );
}

export async function createFuncionario(data) {
  return request(
    `${API_URL}/rrhh/funcionarios/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear funcionario",
  );
}

export async function updateFuncionario(id, data) {
  return request(
    `${API_URL}/rrhh/funcionarios/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar funcionario",
  );
}

export async function desactivarFuncionario(id) {
  return request(
    `${API_URL}/rrhh/funcionarios/${id}/desactivar/`,
    { method: "POST", headers: authHeaders() },
    "desactivar funcionario",
  );
}

export async function reactivarFuncionario(id) {
  return request(
    `${API_URL}/rrhh/funcionarios/${id}/reactivar/`,
    { method: "POST", headers: authHeaders() },
    "reactivar funcionario",
  );
}

// ─── Contratos Laborales ────────────────────────────────────────

export async function getContratos(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/rrhh/contratos/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver contratos",
  );
}

export async function createContrato(data) {
  return request(
    `${API_URL}/rrhh/contratos/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear contrato",
  );
}

export async function updateContrato(id, data) {
  return request(
    `${API_URL}/rrhh/contratos/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar contrato",
  );
}

// ─── Ausencias ──────────────────────────────────────────────────

export async function getAusencias(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/rrhh/ausencias/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver ausencias",
  );
}

export async function createAusencia(data) {
  return request(
    `${API_URL}/rrhh/ausencias/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear ausencia",
  );
}

export async function updateAusencia(id, data) {
  return request(
    `${API_URL}/rrhh/ausencias/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar ausencia",
  );
}

export async function aprobarAusencia(id) {
  return request(
    `${API_URL}/rrhh/ausencias/${id}/aprobar/`,
    { method: "POST", headers: authHeaders() },
    "aprobar ausencia",
  );
}

export async function rechazarAusencia(id, data = {}) {
  return request(
    `${API_URL}/rrhh/ausencias/${id}/rechazar/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "rechazar ausencia",
  );
}

// ─── Asistencias ────────────────────────────────────────────────

export async function getAsistencias(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/rrhh/asistencias/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver asistencias",
  );
}

export async function createAsistencia(data) {
  return request(
    `${API_URL}/rrhh/asistencias/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "registrar asistencia",
  );
}

export async function updateAsistencia(id, data) {
  return request(
    `${API_URL}/rrhh/asistencias/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar asistencia",
  );
}

// ─── Evaluaciones ───────────────────────────────────────────────

export async function getEvaluaciones(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/rrhh/evaluaciones/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver evaluaciones",
  );
}

export async function createEvaluacion(data) {
  return request(
    `${API_URL}/rrhh/evaluaciones/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear evaluación",
  );
}

export async function updateEvaluacion(id, data) {
  return request(
    `${API_URL}/rrhh/evaluaciones/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar evaluación",
  );
}

// ─── Liquidaciones ──────────────────────────────────────────────

export async function getLiquidaciones(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/rrhh/liquidaciones/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver liquidaciones",
  );
}

export async function createLiquidacion(data) {
  return request(
    `${API_URL}/rrhh/liquidaciones/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear liquidación",
  );
}

export async function updateLiquidacion(id, data) {
  return request(
    `${API_URL}/rrhh/liquidaciones/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar liquidación",
  );
}

export async function aprobarLiquidacion(id) {
  return request(
    `${API_URL}/rrhh/liquidaciones/${id}/aprobar/`,
    { method: "POST", headers: authHeaders() },
    "aprobar liquidación",
  );
}

export async function marcarPagadaLiquidacion(id) {
  return request(
    `${API_URL}/rrhh/liquidaciones/${id}/marcar_pagada/`,
    { method: "POST", headers: authHeaders() },
    "marcar liquidación como pagada",
  );
}

// ─── Sanciones ──────────────────────────────────────────────────

export async function getSanciones(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/rrhh/sanciones/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver sanciones",
  );
}

export async function createSancion(data) {
  return request(
    `${API_URL}/rrhh/sanciones/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear sanción",
  );
}

export async function updateSancion(id, data) {
  return request(
    `${API_URL}/rrhh/sanciones/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar sanción",
  );
}

// ─── Documentos de Funcionario ──────────────────────────────────

export async function getDocumentosFuncionario(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/rrhh/documentos/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver documentos de funcionario",
  );
}

export async function createDocumentoFuncionario(data) {
  return request(
    `${API_URL}/rrhh/documentos/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear documento de funcionario",
  );
}

export async function deleteDocumentoFuncionario(id) {
  return request(
    `${API_URL}/rrhh/documentos/${id}/`,
    { method: "DELETE", headers: authHeaders() },
    "eliminar documento de funcionario",
  );
}
