import Cookies from 'js-cookie';

const API_URL = "http://127.0.0.1:8000/api";

export const login = async (username, password) => {
    const res = await fetch(`${API_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
        throw new Error('Credenciales inválidas');
    }

    const data = await res.json();

    // Guardamos el token. expires: 1/24 es 1 hora.
    Cookies.set('token', data.access, { expires: 1 / 24, secure: false });
    Cookies.set('refresh', data.refresh, { expires: 1, secure: false });

    return data;
};

export const logout = () => {
    Cookies.remove('token');
    Cookies.remove('refresh');
    window.location.href = '/login';
};

export const getToken = () => Cookies.get('token');