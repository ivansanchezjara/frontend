import {
  API_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api.js";

// ─── Oportunidades ──────────────────────────────────────────────

export async function getOportunidades(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/oportunidades/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver oportunidades",
  );
}

export async function getOportunidad(id) {
  return request(
    `${API_URL}/ventas/oportunidades/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de oportunidad",
  );
}

export async function createOportunidad(data) {
  return request(
    `${API_URL}/ventas/oportunidades/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear oportunidad",
  );
}

export async function updateOportunidad(id, data) {
  return request(
    `${API_URL}/ventas/oportunidades/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar oportunidad",
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

export async function bulkCreateProspectos(prospectos) {
  return request(
    `${API_URL}/ventas/clientes/bulk/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ prospectos }),
    },
    "carga masiva de prospectos",
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

// ─── Presupuestos ───────────────────────────────────────────────

export async function getPresupuestos(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/presupuestos/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver presupuestos",
  );
}

export async function getPresupuesto(id) {
  return request(
    `${API_URL}/ventas/presupuestos/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de presupuesto",
  );
}

export async function createPresupuesto(data) {
  return request(
    `${API_URL}/ventas/presupuestos/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear presupuesto",
  );
}

export async function updatePresupuesto(id, data) {
  return request(
    `${API_URL}/ventas/presupuestos/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar presupuesto",
  );
}

export async function deletePresupuesto(id) {
  return request(
    `${API_URL}/ventas/presupuestos/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar presupuesto",
  );
}

export async function enviarPresupuesto(id) {
  return request(
    `${API_URL}/ventas/presupuestos/${id}/enviar/`,
    {
      method: "PATCH",
      headers: authHeaders(),
    },
    "enviar presupuesto al cliente",
  );
}

export async function aceptarPresupuesto(id) {
  return request(
    `${API_URL}/ventas/presupuestos/${id}/aceptar/`,
    {
      method: "PATCH",
      headers: authHeaders(),
    },
    "aceptar presupuesto",
  );
}

export async function rechazarPresupuesto(id, data = {}) {
  return request(
    `${API_URL}/ventas/presupuestos/${id}/rechazar/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "rechazar presupuesto",
  );
}

export async function revertirBorradorPresupuesto(id) {
  return request(
    `${API_URL}/ventas/presupuestos/${id}/revertir-borrador/`,
    {
      method: "PATCH",
      headers: authHeaders(),
    },
    "revertir presupuesto a borrador",
  );
}

export async function nuevaVersionPresupuesto(id) {
  return request(
    `${API_URL}/ventas/presupuestos/${id}/nueva-version/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "crear nueva versión de presupuesto",
  );
}

export async function getTextoPresupuesto(id) {
  return request(
    `${API_URL}/ventas/presupuestos/${id}/texto/`,
    {
      method: "GET",
      headers: authHeaders(),
    },
    "generar texto del presupuesto",
  );
}

export async function crearPresupuestoDirecto(data) {
  return request(
    `${API_URL}/ventas/presupuestos/directo/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear presupuesto directo",
  );
}

export async function descargarPdfPresupuesto(id) {
  const res = await fetch(`${API_URL}/ventas/presupuestos/${id}/pdf/`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Error al generar PDF");

  // Extraer nombre del archivo del header Content-Disposition
  const disposition = res.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `presupuesto_${id}.pdf`;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── Instituciones ──────────────────────────────────────────────

export async function getInstituciones(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(
    `${API_URL}/ventas/instituciones/${query ? `?${query}` : ""}`,
    { headers: authHeaders() },
    "listar instituciones",
  );
}

export async function getInstitucion(id) {
  return request(
    `${API_URL}/ventas/instituciones/${id}/`,
    { headers: authHeaders() },
    "obtener institución",
  );
}

export async function createInstitucion(data) {
  return request(
    `${API_URL}/ventas/instituciones/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear institución",
  );
}

export async function updateInstitucion(id, data) {
  return request(
    `${API_URL}/ventas/instituciones/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar institución",
  );
}

export async function deleteInstitucion(id) {
  return request(
    `${API_URL}/ventas/instituciones/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar institución",
  );
}

// ─── Especialidades / Carreras ──────────────────────────────────

export async function getEspecialidades(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(
    `${API_URL}/ventas/especialidades/${query ? `?${query}` : ""}`,
    { headers: authHeaders() },
    "listar especialidades",
  );
}

export async function createEspecialidad(data) {
  return request(
    `${API_URL}/ventas/especialidades/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear especialidad",
  );
}

export async function updateEspecialidad(id, data) {
  return request(
    `${API_URL}/ventas/especialidades/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar especialidad",
  );
}

export async function deleteEspecialidad(id) {
  return request(
    `${API_URL}/ventas/especialidades/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar especialidad",
  );
}
