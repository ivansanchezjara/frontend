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

// ─── Bajas de Inventario ─────────────────────────────────────────

export async function getBajas(params = {}) {
  return request(
    `${API_URL}/inventario/bajas/${toQueryString(params)}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver bajas de inventario",
  );
}

export async function aprobarBaja(id) {
  return request(
    `${API_URL}/inventario/bajas/${id}/aprobar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "aprobar baja de inventario",
  );
}

export async function crearBaja(data) {
  return request(
    `${API_URL}/inventario/bajas/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear baja de inventario",
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
