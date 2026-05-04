import Cookies from 'js-cookie';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api`;

export const login = async (username, password) => {
    let res;

    // 1. EL ESCUDO: Intentamos comunicarnos con Django
    try {
        res = await fetch(`${API_URL}/login/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
    } catch (error) {
        throw new Error('No se pudo conectar al servidor. Verificá tu internet o si el backend está encendido.');
    }

    // 2. VALIDACIÓN: Hay internet, pero Django nos avisa que algo está mal
    if (!res.ok) {
        if (res.status === 401) {
            throw new Error('Usuario o contraseña incorrectos.');
        } else {
            throw new Error(`Error en el servidor (Código: ${res.status}). Intentá de nuevo más tarde.`);
        }
    }

    // 3. ÉXITO: Todo salió bien, procesamos los datos
    const data = await res.json();

    console.log("Respuesta completa de Django:", data);

    // Guardamos los tokens en Cookies
    Cookies.set('token', data.access, { expires: 1 / 24, secure: false });
    Cookies.set('refresh', data.refresh, { expires: 1, secure: false });

    // --- LÓGICA DE GUARDADO DEL USUARIO ---
    const usuarioParaGuardar = data.user || {
        username: username,
        first_name: data.first_name || data.user?.first_name || username,
        last_name: data.last_name || data.user?.last_name || ""
    };

    // 🚀 CAMBIO: Guardamos el usuario también en Cookies usando JSON.stringify
    Cookies.set('user', JSON.stringify(usuarioParaGuardar), { expires: 1 / 24, secure: false });

    return data;
};

export const logout = () => {
    Cookies.remove('token');
    Cookies.remove('refresh');
    // 🚀 CAMBIO: Limpiamos la Cookie del usuario
    Cookies.remove('user');
};

export const getToken = () => Cookies.get('token');

export const getProfile = async () => {
    const token = getToken();
    const res = await fetch(`${API_URL}/profile/`, {
        headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('No se pudo cargar el perfil.');
    return await res.json();
};

export const updateProfile = async (profileData) => {
    const token = getToken();
    const res = await fetch(`${API_URL}/profile/`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
    });
    if (!res.ok) throw new Error('No se pudo actualizar el perfil.');
    const updatedUser = await res.json();

    // 🚀 CAMBIO: Actualizamos la Cookie del usuario
    Cookies.set('user', JSON.stringify(updatedUser), { expires: 1 / 24, secure: false });
    return updatedUser;
};

export const getUser = () => {
    const userCookie = Cookies.get('user');
    return userCookie ? JSON.parse(userCookie) : null;
};