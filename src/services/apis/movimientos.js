import { API_URL, request, jsonHeaders, authHeaders, toQueryString } from "../api.js";

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
