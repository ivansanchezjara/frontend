import {
  API_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api.js";

// ─── Categorías de Gastos ───────────────────────────────────────────────────

export async function getCategoriasGasto(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/finanzas/categorias/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver categorías de gasto",
  );
}

export async function getCategoriaGasto(id) {
  return request(
    `${API_URL}/finanzas/categorias/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver categoría de gasto",
  );
}

export async function createCategoriaGasto(data) {
  return request(
    `${API_URL}/finanzas/categorias/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear categoría de gasto",
  );
}

export async function updateCategoriaGasto(id, data) {
  return request(
    `${API_URL}/finanzas/categorias/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar categoría de gasto",
  );
}

export async function deleteCategoriaGasto(id) {
  return request(
    `${API_URL}/finanzas/categorias/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar categoría de gasto",
  );
}

// ─── Gastos ─────────────────────────────────────────────────────────────────

export async function getGastos(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/finanzas/gastos/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver gastos",
  );
}

export async function getGasto(id) {
  return request(
    `${API_URL}/finanzas/gastos/${id}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de gasto",
  );
}

export async function createGasto(data) {
  return request(
    `${API_URL}/finanzas/gastos/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear gasto",
  );
}

export async function updateGasto(id, data) {
  return request(
    `${API_URL}/finanzas/gastos/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar gasto",
  );
}

export async function pagarGasto(id, data) {
  return request(
    `${API_URL}/finanzas/gastos/${id}/pagar/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "pagar gasto",
  );
}

export async function anularGasto(id) {
  return request(
    `${API_URL}/finanzas/gastos/${id}/anular/`,
    {
      method: "POST",
      headers: authHeaders(),
    },
    "anular gasto",
  );
}
