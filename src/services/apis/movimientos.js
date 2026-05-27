import {
  API_URL,
  request,
  jsonHeaders,
  authHeaders,
  toQueryString,
} from "../api.js";

export async function crearAjuste(data) {
  return request(
    `${API_URL}/inventario/ajustes/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear ajuste de inventario",
  );
}

export async function getAjustes(params = {}) {
  return request(
    `${API_URL}/inventario/ajustes/${toQueryString(params)}`,
    {
      method: "GET",
      headers: authHeaders(),
    },
    "ver ajustes de inventario",
  );
}

export async function getAjuste(id) {
  return request(
    `${API_URL}/inventario/ajustes/${id}/`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de ajuste de inventario",
  );
}

/**
 * Aprueba un ajuste de inventario y actualiza el stock físico.
 */
export async function aprobarAjuste(id) {
  return request(
    `${API_URL}/inventario/ajustes/${id}/aprobar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "aprobar ajuste de inventario",
  );
}

export async function rechazarAjuste(id) {
  return request(
    `${API_URL}/inventario/ajustes/${id}/rechazar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "rechazar ajuste de inventario",
  );
}

// ─── Ingresos ───────────────────────────────────────────────────────

export async function getIngresos(params = {}) {
  return request(
    `${API_URL}/inventario/ingresos/${toQueryString(params)}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver ingresos",
  );
}

export async function getIngreso(id) {
  return request(
    `${API_URL}/inventario/ingresos/${id}/`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de ingreso",
  );
}

export async function crearIngreso(data) {
  return request(
    `${API_URL}/inventario/ingresos/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear ingreso",
  );
}

export async function actualizarIngreso(id, data) {
  return request(
    `${API_URL}/inventario/ingresos/${id}/`,
    {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar ingreso",
  );
}

export async function aprobarIngreso(id) {
  return request(
    `${API_URL}/inventario/ingresos/${id}/aprobar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "aprobar ingreso",
  );
}

export async function rechazarIngreso(id) {
  return request(
    `${API_URL}/inventario/ingresos/${id}/rechazar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "rechazar ingreso",
  );
}

// ─── Transferencias ─────────────────────────────────────────────

export async function getTransferencias(params = {}) {
  return request(
    `${API_URL}/inventario/transferencias/${toQueryString(params)}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver transferencias",
  );
}

export async function getTransferencia(id) {
  return request(
    `${API_URL}/inventario/transferencias/${id}/`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de transferencia",
  );
}

export async function aprobarTransferencia(id) {
  return request(
    `${API_URL}/inventario/transferencias/${id}/aprobar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "aprobar transferencia",
  );
}

export async function rechazarTransferencia(id) {
  return request(
    `${API_URL}/inventario/transferencias/${id}/rechazar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "rechazar transferencia",
  );
}

export async function actualizarTransferencia(id, data) {
  return request(
    `${API_URL}/inventario/transferencias/${id}/`,
    {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar transferencia",
  );
}

export async function crearTransferencia(data) {
  return request(
    `${API_URL}/inventario/transferencias/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear transferencia",
  );
}

// ─── Consignaciones ───────────────────────────────────────────────

export async function getConsignaciones(params = {}) {
  return request(
    `${API_URL}/inventario/consignaciones/${toQueryString(params)}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver consignaciones",
  );
}

export async function getConsignacion(id) {
  return request(
    `${API_URL}/inventario/consignaciones/${id}/`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de consignación",
  );
}

export async function aprobarConsignacion(id) {
  return request(
    `${API_URL}/inventario/consignaciones/${id}/aprobar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "aprobar consignación",
  );
}

export async function crearDevolucion(data) {
  return request(
    `${API_URL}/inventario/devoluciones/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear devolución",
  );
}

export async function aprobarDevolucion(id) {
  return request(
    `${API_URL}/inventario/devoluciones/${id}/aprobar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "aprobar devolución",
  );
}

export async function crearLiquidacion(data) {
  return request(
    `${API_URL}/inventario/liquidaciones/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear liquidación",
  );
}

export async function crearConsignacion(data) {
  return request(
    `${API_URL}/inventario/consignaciones/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear consignación",
  );
}

// ─── Depósitos ───────────────────────────────────────────────────

export async function getDepositos() {
  return request(
    `${API_URL}/inventario/depositos/`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver depósitos",
  );
}

// ─── Auditoría de Stock ──────────────────────────────────────────

export async function getAuditoriasStock(params = {}) {
  return request(
    `${API_URL}/inventario/auditorias-stock/${toQueryString(params)}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver auditorías de stock",
  );
}

export async function getAuditoriaStock(id) {
  return request(
    `${API_URL}/inventario/auditorias-stock/${id}/`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de auditoría de stock",
  );
}

export async function crearAuditoriaStock(data) {
  return request(
    `${API_URL}/inventario/auditorias-stock/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear auditoría de stock",
  );
}

export async function iniciarConteoAuditoria(id) {
  return request(
    `${API_URL}/inventario/auditorias-stock/${id}/iniciar_conteo/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "iniciar conteo de auditoría",
  );
}

export async function registrarConteoAuditoria(id, lineas) {
  return request(
    `${API_URL}/inventario/auditorias-stock/${id}/registrar_conteo/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ lineas }),
    },
    "registrar conteo físico",
  );
}

export async function pasarConciliacionAuditoria(id) {
  return request(
    `${API_URL}/inventario/auditorias-stock/${id}/pasar_conciliacion/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "pasar auditoría a conciliación",
  );
}

export async function aprobarAuditoriaStock(id) {
  return request(
    `${API_URL}/inventario/auditorias-stock/${id}/aprobar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "aprobar auditoría de stock",
  );
}

export async function rechazarAuditoriaStock(id) {
  return request(
    `${API_URL}/inventario/auditorias-stock/${id}/rechazar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "rechazar auditoría de stock",
  );
}

export async function getMarcasDisponibles() {
  return request(
    `${API_URL}/inventario/auditorias-stock/marcas_disponibles/`,
    {
      method: "GET",
      headers: authHeaders(),
    },
    "ver marcas disponibles",
  );
}

// ─── Ajustes Rápidos (Altas/Bajas) ──────────────────────────────────

export async function getAjustesRapidos(params = {}) {
  return request(
    `${API_URL}/inventario/ajustes-rapidos/${toQueryString(params)}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver ajustes rápidos",
  );
}

export async function getAjusteRapido(id) {
  return request(
    `${API_URL}/inventario/ajustes-rapidos/${id}/`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de ajuste rápido",
  );
}

export async function crearAjusteRapido(data) {
  return request(
    `${API_URL}/inventario/ajustes-rapidos/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear ajuste rápido",
  );
}

export async function actualizarAjusteRapido(id, data) {
  return request(
    `${API_URL}/inventario/ajustes-rapidos/${id}/`,
    {
      method: "PUT",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar ajuste rápido",
  );
}

export async function aprobarAjusteRapido(id) {
  return request(
    `${API_URL}/inventario/ajustes-rapidos/${id}/aprobar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "aprobar ajuste rápido",
  );
}

export async function rechazarAjusteRapido(id) {
  return request(
    `${API_URL}/inventario/ajustes-rapidos/${id}/rechazar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "rechazar ajuste rápido",
  );
}

// ─── Ediciones de Lote ──────────────────────────────────────────────

export async function getEdicionesLote(params = {}) {
  return request(
    `${API_URL}/inventario/ediciones-lote/${toQueryString(params)}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver ediciones de lote",
  );
}

export async function getEdicionLote(id) {
  return request(
    `${API_URL}/inventario/ediciones-lote/${id}/`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de edición de lote",
  );
}

export async function crearEdicionLote(data) {
  return request(
    `${API_URL}/inventario/ediciones-lote/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear edición de lote",
  );
}

export async function aprobarEdicionLote(id) {
  return request(
    `${API_URL}/inventario/ediciones-lote/${id}/aprobar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "aprobar edición de lote",
  );
}

export async function rechazarEdicionLote(id) {
  return request(
    `${API_URL}/inventario/ediciones-lote/${id}/rechazar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "rechazar edición de lote",
  );
}
