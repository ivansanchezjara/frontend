import Cookies from 'js-cookie';

const API_URL = "http://127.0.0.1:8000/api";

export async function getProductos() {
    const token = Cookies.get('token');

    const res = await fetch(`${API_URL}/productos/`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // Aquí mandamos la "llave" a Django
            'Authorization': `Bearer ${token}`
        },
        // Esto es para que Next.js no guarde en caché datos viejos de stock
        cache: 'no-store'
    });

    if (res.status === 401) {
        // Si el token venció, mandamos al login
        window.location.href = '/login';
        return;
    }

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Error de Django:", errorData); // Esto te lo muestra en la consola F12
        throw new Error(`Error ${res.status}: ${errorData.detail || 'Fallo en la API'}`);
    }

    return res.json();
}