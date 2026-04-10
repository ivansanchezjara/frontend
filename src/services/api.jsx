import Cookies from 'js-cookie';
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const API_URL = `${BASE_URL}/api`;

export async function getProductos() {
    const token = Cookies.get('token');

    try {
        const res = await fetch(`${API_URL}/productos/`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            cache: 'no-store'
        });

        if (res.status === 401) {
            window.location.href = '/login';
            return [];
        }

        if (!res.ok) throw new Error('Error al cargar productos');
        return await res.json();

    } catch (error) {
        // ESCUDO: Si no hay internet o Django está apagado
        throw new Error('No se pudo conectar al servidor.');
    }
}

export const getCategorias = async () => {
    const token = Cookies.get('token');

    try {
        const res = await fetch(`${API_URL}/categorias/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) return [];
        return await res.json();
    } catch (error) {
        // Si falla la conexión de categorías, no rompemos todo, devolvemos vacío
        return [];
    }
};

export const getFullImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${BASE_URL}${path}`;
};