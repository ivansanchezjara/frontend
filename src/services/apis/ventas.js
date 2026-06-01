import {
  API_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api.js";

// ─── Prospectos ─────────────────────────────────────────────────

export async function getProspectos(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/prospectos/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver prospectos",
  );
}

export async function getProspecto(id) {
  return request(
    `${API_URL}/ventas/prospectos/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de prospecto",
  );
}

export async function createProspecto(data) {
  return request(
    `${API_URL}/ventas/prospectos/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear prospecto",
  );
}

export async function updateProspecto(id, data) {
  return request(
    `${API_URL}/ventas/prospectos/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar prospecto",
  );
}

export async function convertirProspecto(id) {
  return request(
    `${API_URL}/ventas/prospectos/${id}/convertir/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "convertir prospecto a cliente",
  );
}

// ─── Clientes ───────────────────────────────────────────────────

export async function getVendedores() {
  return request(
    `${API_URL}/ventas/clientes/vendedores/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver vendedores disponibles",
  );
}

export async function getClientes(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/clientes/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver clientes",
  );
}

export async function getCliente(id) {
  return request(
    `${API_URL}/ventas/clientes/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de cliente",
  );
}

export async function createCliente(data) {
  return request(
    `${API_URL}/ventas/clientes/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear cliente",
  );
}

export async function updateCliente(id, data) {
  return request(
    `${API_URL}/ventas/clientes/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar cliente",
  );
}

export async function desactivarCliente(id) {
  return request(
    `${API_URL}/ventas/clientes/${id}/desactivar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "desactivar cliente",
  );
}

export async function reactivarCliente(id) {
  return request(
    `${API_URL}/ventas/clientes/${id}/reactivar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "reactivar cliente",
  );
}

export async function habilitarCuentaOnline(id) {
  return request(
    `${API_URL}/ventas/clientes/${id}/habilitar-cuenta-online/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "habilitar cuenta online del cliente",
  );
}

// ─── Interacciones ──────────────────────────────────────────────

export async function getInteracciones(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/interacciones/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver interacciones",
  );
}

export async function getInteraccion(id) {
  return request(
    `${API_URL}/ventas/interacciones/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de interacción",
  );
}

export async function createInteraccion(data) {
  return request(
    `${API_URL}/ventas/interacciones/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear interacción",
  );
}

export async function updateInteraccion(id, data) {
  return request(
    `${API_URL}/ventas/interacciones/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar interacción",
  );
}

// ─── Ventas ─────────────────────────────────────────────────────

export async function getVentas(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/ventas/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver ventas",
  );
}

export async function getVenta(id) {
  return request(
    `${API_URL}/ventas/ventas/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de venta",
  );
}

export async function createVenta(data) {
  return request(
    `${API_URL}/ventas/ventas/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear venta",
  );
}

export async function updateVenta(id, data) {
  return request(
    `${API_URL}/ventas/ventas/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar venta",
  );
}

export async function confirmarVenta(id) {
  return request(
    `${API_URL}/ventas/ventas/${id}/confirmar/`,
    {
      method: "PATCH",
      headers: authHeaders(),
    },
    "confirmar venta",
  );
}

export async function eliminarVenta(id) {
  return request(
    `${API_URL}/ventas/ventas/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar venta borrador",
  );
}

// ─── Búsqueda de Productos (para constructor de venta) ─────────

export async function buscarProductos(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/ventas/buscar-productos/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "buscar productos",
  );
}

// ─── Almacén Virtual ────────────────────────────────────────────

export async function getAlmacenVirtual(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/almacen-virtual/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver almacén virtual",
  );
}

export async function getDisponibilidadAlmacen(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/almacen-virtual/disponibilidad/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "consultar disponibilidad en almacén virtual",
  );
}

// ─── Caja Chica ─────────────────────────────────────────────────

export async function getMovimientosCaja(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/caja-chica/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver movimientos de caja chica",
  );
}

export async function createMovimientoCaja(data) {
  return request(
    `${API_URL}/ventas/caja-chica/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "registrar movimiento de caja chica",
  );
}

export async function getSaldoCajaChica() {
  return request(
    `${API_URL}/ventas/caja-chica/saldo/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver saldo de caja chica",
  );
}

// ─── Conciliaciones ─────────────────────────────────────────────

export async function getConciliaciones(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/conciliaciones/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver conciliaciones",
  );
}

export async function getConciliacion(id) {
  return request(
    `${API_URL}/ventas/conciliaciones/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de conciliación",
  );
}

export async function createConciliacion(data) {
  return request(
    `${API_URL}/ventas/conciliaciones/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear conciliación",
  );
}

export async function confirmarConciliacion(id) {
  return request(
    `${API_URL}/ventas/conciliaciones/${id}/confirmar/`,
    {
      method: "PATCH",
      headers: authHeaders(),
    },
    "confirmar conciliación",
  );
}

export async function rechazarConciliacion(id, data) {
  return request(
    `${API_URL}/ventas/conciliaciones/${id}/rechazar/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "rechazar conciliación",
  );
}

// ─── Tipos de Cambio ────────────────────────────────────────────

export async function getTiposCambio(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/tipos-cambio/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver tipos de cambio",
  );
}

export async function createTipoCambio(data) {
  return request(
    `${API_URL}/ventas/tipos-cambio/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "registrar tipo de cambio",
  );
}

export async function getTipoCambioVigente(par) {
  const query = toQueryString({ par });
  return request(
    `${API_URL}/ventas/tipos-cambio/vigente/${query}`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver tipo de cambio vigente",
  );
}

// ─── Mi Cuenta (Portal Cliente Online) ──────────────────────────

export async function getMiPerfil() {
  return request(
    `${API_URL}/ventas/mi-cuenta/perfil/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver mi perfil de cliente",
  );
}

export async function updateMiPerfil(data) {
  return request(
    `${API_URL}/ventas/mi-cuenta/perfil/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar mi perfil de cliente",
  );
}

export async function getMisCompras(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/mi-cuenta/historial-compras/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver mi historial de compras",
  );
}
