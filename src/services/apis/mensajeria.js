import {
  API_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api.js";

// ─── Conversaciones (agrupadas por contacto) ────────────────────

/**
 * Obtiene interacciones de mensajería (whatsapp, instagram, messenger)
 * agrupadas o filtradas por contacto.
 */
export async function getConversaciones(params = {}) {
  // Traer interacciones de tipo mensajería, ordenadas por fecha desc
  const query = toQueryString({
    ...params,
    ordering: "-fecha",
  });
  return request(
    `${API_URL}/ventas/interacciones/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver conversaciones",
  );
}

/**
 * Obtiene el historial de mensajes de un contacto específico.
 */
export async function getMensajesContacto(clienteId, params = {}) {
  const query = toQueryString({
    cliente: clienteId,
    ...params,
    ordering: "fecha",
    page_size: 50,
  });
  return request(
    `${API_URL}/ventas/interacciones/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver mensajes de contacto",
  );
}

/**
 * Obtiene el historial de mensajes vinculados a una oportunidad.
 */
export async function getMensajesOportunidad(oportunidadId, params = {}) {
  const query = toQueryString({
    oportunidad: oportunidadId,
    ...params,
    ordering: "fecha",
    page_size: 50,
  });
  return request(
    `${API_URL}/ventas/interacciones/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver mensajes de oportunidad",
  );
}

// ─── Envío de mensajes ──────────────────────────────────────────

/**
 * Envía un mensaje de texto por el canal especificado.
 * @param {Object} data - { cuenta_id, canal, texto }
 */
export async function enviarMensaje(data) {
  return request(
    `${API_URL}/ventas/mensajeria/enviar/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "enviar mensaje",
  );
}

/**
 * Envía un template de WhatsApp.
 * @param {Object} data - { cuenta_id, template_name, language_code?, components? }
 */
export async function enviarTemplate(data) {
  return request(
    `${API_URL}/ventas/mensajeria/enviar-template/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "enviar template WhatsApp",
  );
}

// ─── Cuentas (para buscar contactos) ────────────────────────────

/**
 * Busca cuentas comerciales por nombre o teléfono.
 */
export async function buscarContactos(search) {
  const query = toQueryString({ search, page_size: 20 });
  return request(
    `${API_URL}/ventas/cuentas/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "buscar contactos",
  );
}

// ─── Notificaciones de mensajería ───────────────────────────────

/**
 * Obtiene la cantidad de mensajes sin responder (para el badge del FAB).
 */
export async function getMensajesSinResponder() {
  return request(
    `${API_URL}/ventas/mensajeria/sin-responder/`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "mensajes sin responder",
  );
}

// ─── Métricas ───────────────────────────────────────────────────

/**
 * Obtiene métricas de mensajería (tiempos de respuesta, volumen, etc.)
 * @param {Object} params - { vendedor?, dias? }
 */
export async function getMetricasMensajeria(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/ventas/mensajeria/metricas/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "métricas de mensajería",
  );
}

// ─── Templates de WhatsApp ──────────────────────────────────────

/**
 * Obtiene la lista de templates de WhatsApp disponibles.
 */
export async function getTemplatesDisponibles() {
  return request(
    `${API_URL}/ventas/mensajeria/templates/`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "templates disponibles",
  );
}
