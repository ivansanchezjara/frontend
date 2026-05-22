import {
  API_URL,
  BASE_URL,
  request,
  authHeaders,
  jsonHeaders,
  toQueryString,
} from "../api.js";

// ─── Imágenes & URL Helpers ─────────────────────────────────────

export const getFullImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${BASE_URL}${path}`;
};

// ─── Categorías ─────────────────────────────────────────────────

export const getCategorias = async () => {
  const data = await request(
    `${API_URL}/catalogo/categorias/`,
    {
      headers: authHeaders(),
    },
    "ver categorías",
  );
  return data?.results || data || [];
};

export const crearCategoria = async (nombre) => {
  return request(
    `${API_URL}/catalogo/categorias/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({ nombre }),
    },
    "crear categoría",
  );
};

// ─── Productos (lectura) ─────────────────────────────────────────

export async function getProductos(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/catalogo/productos/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver productos",
  );
}

export async function getProducto(slug) {
  return request(
    `${API_URL}/catalogo/productos/${slug}/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver detalle de producto",
  );
}

// ─── Productos (escritura) ───────────────────────────────────────

export async function crearProducto(data) {
  return request(
    `${API_URL}/catalogo/productos/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear producto",
  );
}

export async function actualizarProducto(slug, data) {
  return request(
    `${API_URL}/catalogo/productos/${slug}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "editar producto",
  );
}

export async function eliminarProducto(slug) {
  return request(
    `${API_URL}/catalogo/productos/${slug}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar producto",
  );
}

// ─── Variantes ───────────────────────────────────────────────────

export async function getVariantes(params = {}) {
  const query = toQueryString(params);
  return request(
    `${API_URL}/catalogo/variantes/${query}`,
    {
      method: "GET",
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver variantes",
  );
}

export async function crearVariante(data) {
  return request(
    `${API_URL}/catalogo/variantes/`,
    {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "crear variante",
  );
}

export async function actualizarVariante(id, data) {
  return request(
    `${API_URL}/catalogo/variantes/${id}/`,
    {
      method: "PATCH",
      headers: jsonHeaders(),
      body: JSON.stringify(data),
    },
    "actualizar variante",
  );
}

export async function eliminarVariante(id) {
  return request(
    `${API_URL}/catalogo/variantes/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar variante",
  );
}

// ─── Galería de Imágenes ────────────────────────────────────────

export async function crearImagenProducto(data) {
  return request(`${API_URL}/catalogo/imagenes-producto/`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(data),
  });
}

export async function eliminarImagenProducto(id) {
  return request(
    `${API_URL}/catalogo/imagenes-producto/${id}/`,
    {
      method: "DELETE",
      headers: authHeaders(),
    },
    "eliminar imagen del producto",
  );
}

// ─── Stats ────────────────────────────────────────────────────────

export async function getProductosStats() {
  return request(
    `${API_URL}/catalogo/productos/stats/`,
    {
      headers: authHeaders(),
    },
    "ver estadísticas de productos",
  );
}

// ─── Historial ────────────────────────────────────────────────────

export async function getHistorialProducto(slug) {
  return request(
    `${API_URL}/catalogo/productos/${slug}/historial/`,
    {
      headers: authHeaders(),
      cache: "no-store",
    },
    "ver historial del producto",
  );
}
