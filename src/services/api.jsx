import Cookies from 'js-cookie';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const API_URL = `${BASE_URL}/api`;

// ─── Helpers ────────────────────────────────────────────────────

function authHeaders(extraHeaders = {}) {
    const token = Cookies.get('token');
    return {
        'Authorization': `Bearer ${token}`,
        ...extraHeaders,
    };
}

function jsonHeaders() {
    return authHeaders({ 'Content-Type': 'application/json' });
}

async function handleResponse(res) {
    if (res.status === 401) {
        window.location.href = '/login';
        return null;
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: `Error ${res.status}` }));
        throw err;
    }
    if (res.status === 204) return true; // No Content (DELETE)
    return res.json();
}

// ─── Imágenes ───────────────────────────────────────────────────

export const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
};

// ─── Categorías ─────────────────────────────────────────────────

export const getCategorias = async () => {
    try {
        const res = await fetch(`${API_URL}/catalogo/categorias/`, {
            headers: authHeaders(),
        });
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
};

export const crearCategoria = async (nombre) => {
    const res = await fetch(`${API_URL}/catalogo/categorias/`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({ nombre }),
    });
    return handleResponse(res);
};

// ─── Productos (lectura) ─────────────────────────────────────────

export async function getProductos() {
    try {
        const res = await fetch(`${API_URL}/catalogo/productos/`, {
            method: 'GET',
            headers: authHeaders(),
            cache: 'no-store',
        });
        return handleResponse(res);
    } catch {
        throw new Error('No se pudo conectar al servidor.');
    }
}

export async function getProducto(slug) {
    try {
        const res = await fetch(`${API_URL}/catalogo/productos/${slug}/`, {
            headers: authHeaders(),
            cache: 'no-store',
        });
        return handleResponse(res);
    } catch {
        throw new Error('No se pudo conectar al servidor.');
    }
}

// ─── Productos (escritura) ───────────────────────────────────────

export async function crearProducto(data) {
    const res = await fetch(`${API_URL}/catalogo/productos/`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}

export async function actualizarProducto(slug, data) {
    const res = await fetch(`${API_URL}/catalogo/productos/${slug}/`, {
        method: 'PATCH',
        headers: jsonHeaders(),
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}

export async function eliminarProducto(slug) {
    const res = await fetch(`${API_URL}/catalogo/productos/${slug}/`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    return handleResponse(res);
}

// ─── Variantes ───────────────────────────────────────────────────

export async function crearVariante(data) {
    const res = await fetch(`${API_URL}/catalogo/variantes/`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}

export async function actualizarVariante(id, data) {
    const res = await fetch(`${API_URL}/catalogo/variantes/${id}/`, {
        method: 'PATCH',
        headers: jsonHeaders(),
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}

export async function eliminarVariante(id) {
    const res = await fetch(`${API_URL}/catalogo/variantes/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    return handleResponse(res);
}

// ─── Galería de Imágenes ────────────────────────────────────────

export async function crearImagenProducto(data) {
    const res = await fetch(`${API_URL}/catalogo/imagenes-producto/`, {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify(data),
    });
    return handleResponse(res);
}

export async function eliminarImagenProducto(id) {
    const res = await fetch(`${API_URL}/catalogo/imagenes-producto/${id}/`, {
        method: 'DELETE',
        headers: authHeaders(),
    });
    return handleResponse(res);
}