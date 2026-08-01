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

// ─── Cuentas Comerciales (búsqueda global para selects) ─────────

export async function getCuentas(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/cuentas/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver cuentas comerciales",
  );
}

export async function getCuenta(id) {
  return request(
    `${API_URL}/ventas/cuentas/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de cuenta comercial",
  );
}

// ─── Personas (profesionales, estudiantes, etc.) ────────────────

export async function getPersonas(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/personas/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver personas",
  );
}

export async function getPersona(id) {
  return request(
    `${API_URL}/ventas/personas/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de persona",
  );
}

export async function createPersona(data) {
  return request(
    `${API_URL}/ventas/personas/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear persona",
  );
}

export async function updatePersona(id, data) {
  return request(
    `${API_URL}/ventas/personas/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar persona",
  );
}

export async function deletePersona(id) {
  return request(
    `${API_URL}/ventas/personas/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "desactivar persona",
  );
}

export async function reactivarPersona(id) {
  return request(
    `${API_URL}/ventas/personas/${id}/reactivar/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "reactivar persona",
  );
}

export async function habilitarOnlinePersona(id) {
  return request(
    `${API_URL}/ventas/personas/${id}/habilitar-online/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "habilitar cuenta online",
  );
}

export async function deshabilitarOnlinePersona(id) {
  return request(
    `${API_URL}/ventas/personas/${id}/deshabilitar-online/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "deshabilitar cuenta online",
  );
}

export async function bulkCreatePersonas(personas) {
  return request(
    `${API_URL}/ventas/personas/bulk/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ personas }),
    },
    "carga masiva de personas",
  );
}

// ─── Clínicas ───────────────────────────────────────────────────

export async function getClinicas(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/clinicas/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver clínicas",
  );
}

export async function getClinica(id) {
  return request(
    `${API_URL}/ventas/clinicas/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de clínica",
  );
}

export async function createClinica(data) {
  return request(
    `${API_URL}/ventas/clinicas/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear clínica",
  );
}

export async function updateClinica(id, data) {
  return request(
    `${API_URL}/ventas/clinicas/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar clínica",
  );
}

export async function deleteClinica(id) {
  return request(
    `${API_URL}/ventas/clinicas/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "desactivar clínica",
  );
}

// ─── Mayoristas ─────────────────────────────────────────────────

export async function getMayoristas(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/mayoristas/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver mayoristas",
  );
}

export async function getMayorista(id) {
  return request(
    `${API_URL}/ventas/mayoristas/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de mayorista",
  );
}

export async function createMayorista(data) {
  return request(
    `${API_URL}/ventas/mayoristas/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear mayorista",
  );
}

export async function updateMayorista(id, data) {
  return request(
    `${API_URL}/ventas/mayoristas/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar mayorista",
  );
}

// ─── Relaciones de Personas ─────────────────────────────────────

export async function getFormaciones(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/formaciones-academicas/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver formaciones académicas",
  );
}

export async function createFormacion(data) {
  return request(
    `${API_URL}/ventas/formaciones-academicas/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear formación académica",
  );
}

export async function updateFormacion(id, data) {
  return request(
    `${API_URL}/ventas/formaciones-academicas/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar formación académica",
  );
}

export async function deleteFormacion(id) {
  return request(
    `${API_URL}/ventas/formaciones-academicas/${id}/`,
    { method: "DELETE", headers: authHeaders() },
    "eliminar formación académica",
  );
}

export async function getVinculosLaborales(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/vinculos-laborales/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver vínculos laborales",
  );
}

export async function createVinculoLaboral(data) {
  return request(
    `${API_URL}/ventas/vinculos-laborales/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear vínculo laboral",
  );
}

export async function deleteVinculoLaboral(id) {
  return request(
    `${API_URL}/ventas/vinculos-laborales/${id}/`,
    { method: "DELETE", headers: authHeaders() },
    "eliminar vínculo laboral",
  );
}

export async function updateVinculoLaboral(id, data) {
  return request(
    `${API_URL}/ventas/vinculos-laborales/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar vínculo laboral",
  );
}

export async function getVinculosDocentes(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/vinculos-docentes/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver vínculos docentes",
  );
}

export async function createVinculoDocente(data) {
  return request(
    `${API_URL}/ventas/vinculos-docentes/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear vínculo docente",
  );
}

export async function deleteVinculoDocente(id) {
  return request(
    `${API_URL}/ventas/vinculos-docentes/${id}/`,
    { method: "DELETE", headers: authHeaders() },
    "eliminar vínculo docente",
  );
}

export async function updateVinculoDocente(id, data) {
  return request(
    `${API_URL}/ventas/vinculos-docentes/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar vínculo docente",
  );
}

export async function getCargosDirectivos(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/cargos-directivos/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver cargos directivos",
  );
}

export async function createCargoDirectivo(data) {
  return request(
    `${API_URL}/ventas/cargos-directivos/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear cargo directivo",
  );
}

export async function deleteCargoDirectivo(id) {
  return request(
    `${API_URL}/ventas/cargos-directivos/${id}/`,
    { method: "DELETE", headers: authHeaders() },
    "eliminar cargo directivo",
  );
}

export async function updateCargoDirectivo(id, data) {
  return request(
    `${API_URL}/ventas/cargos-directivos/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar cargo directivo",
  );
}

export async function getRegistrosProfesionales(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/registros-profesionales/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver registros profesionales",
  );
}

export async function createRegistroProfesional(data) {
  return request(
    `${API_URL}/ventas/registros-profesionales/`,
    { method: "POST", headers: jsonHeaders(), body: JSON.stringify(data) },
    "crear registro profesional",
  );
}

export async function updateRegistroProfesional(id, data) {
  return request(
    `${API_URL}/ventas/registros-profesionales/${id}/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "actualizar registro profesional",
  );
}

// ─── Verificaciones de Estudiante ───────────────────────────────

export async function getVerificacionesEstudiante(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/verificaciones-estudiante/${query}`,
    { headers: authHeaders(), cache: "no-store" },
    "ver verificaciones de estudiante",
  );
}

export async function createVerificacionEstudiante(formData) {
  // Usa FormData para subir archivo
  return request(
    `${API_URL}/ventas/verificaciones-estudiante/`,
    { method: "POST", headers: authHeaders(), body: formData },
    "crear verificación de estudiante",
  );
}

export async function revisarVerificacionEstudiante(id, data) {
  return request(
    `${API_URL}/ventas/verificaciones-estudiante/${id}/revisar/`,
    { method: "PATCH", headers: jsonHeaders(), body: JSON.stringify(data) },
    "revisar verificación de estudiante",
  );
}

// ─── Aliases de compatibilidad (legacy → nuevo) ─────────────────
// Estos mantienen el código existente del frontend funcionando
// mientras se migran los componentes uno a uno.

export const getClientes = getPersonas;
export const getCliente = getPersona;
export const createCliente = createPersona;
export const updateCliente = updatePersona;
export const desactivarCliente = deletePersona;
export const reactivarCliente = reactivarPersona;

export async function habilitarCuentaOnline(id) {
  // TODO: re-implementar cuando el portal online esté listo
  console.warn("habilitarCuentaOnline: funcionalidad pendiente de migración");
  return { message: "Funcionalidad en migración" };
}

export async function bulkCreateProspectos(prospectos) {
  // Crea prospectos uno a uno usando el endpoint de personas
  const resultados = { creados: 0, errores: 0, detalle_creados: [], detalle_errores: [] };
  for (let i = 0; i < prospectos.length; i++) {
    const item = prospectos[i];
    try {
      const persona = await createPersona({
        razon_social: item.razon_social,
        telefono: item.telefono || "",
        ruc: item.ruc || "",
        etapa: "prospecto",
      });
      resultados.creados++;
      resultados.detalle_creados.push(persona);
    } catch (err) {
      resultados.errores++;
      resultados.detalle_errores.push({ fila: i + 1, nombre: item.razon_social, error: String(err) });
    }
  }
  return resultados;
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

export async function bulkCreateInstituciones(instituciones) {
  return request(
    `${API_URL}/ventas/instituciones/bulk/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ instituciones }),
    },
    "carga masiva de instituciones",
  );
}

// Nota: cada institución/sede es un registro independiente.
// Usar createInstitucion / updateInstitucion / deleteInstitucion.

export async function getInstitucionHistorial(id) {
  return request(
    `${API_URL}/ventas/instituciones/${id}/historial/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver historial de institución",
  );
}

// ─── Oferta Académica (carreras, programas, cursos) ─────────────

export async function getOfertaAcademica(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(
    `${API_URL}/ventas/oferta-academica/${query ? `?${query}` : ""}`,
    { headers: authHeaders() },
    "listar oferta académica",
  );
}

export async function getOfertaAcademicaById(id) {
  return request(
    `${API_URL}/ventas/oferta-academica/${id}/`,
    { headers: authHeaders(), cache: "no-store" },
    "ver detalle de oferta académica",
  );
}

export async function createOfertaAcademica(data) {
  return request(
    `${API_URL}/ventas/oferta-academica/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear oferta académica",
  );
}

export async function updateOfertaAcademica(id, data) {
  return request(
    `${API_URL}/ventas/oferta-academica/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar oferta académica",
  );
}

export async function deleteOfertaAcademica(id) {
  return request(
    `${API_URL}/ventas/oferta-academica/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar oferta académica",
  );
}
