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
        // Si entra aquí, es porque fetch falló por completo (No hay internet o Django está apagado)
        throw new Error('No se pudo conectar al servidor. Verificá tu internet o si el backend está encendido.');
    }

    // 2. VALIDACIÓN: Hay internet, pero Django nos avisa que algo está mal
    if (!res.ok) {
        if (res.status === 401) {
            throw new Error('Usuario o contraseña incorrectos.');
        } else {
            // Atrapa errores 500 (tu código falló) o 404 (ruta no existe)
            throw new Error(`Error en el servidor (Código: ${res.status}). Intentá de nuevo más tarde.`);
        }
    }

    // 3. ÉXITO: Todo salió bien, procesamos los datos
    const data = await res.json();

    // 🔍 DEBUG: Esto es vital. Abrí la consola (F12) al loguearte 
    // y mirá qué imprime "Respuesta completa".
    console.log("Respuesta completa de Django:", data);

    // Guardamos los tokens en Cookies
    Cookies.set('token', data.access, { expires: 1 / 24, secure: false });
    Cookies.set('refresh', data.refresh, { expires: 1, secure: false });

    // --- LÓGICA DE GUARDADO DEL USUARIO ---
    // Intentamos capturar el objeto user, si no viene, lo armamos con lo que hay
    const usuarioParaGuardar = data.user || {
        username: username,
        first_name: data.first_name || data.user?.first_name || username,
        last_name: data.last_name || data.user?.last_name || ""
    };

    localStorage.setItem('user', JSON.stringify(usuarioParaGuardar));

    return data;
};

export const logout = () => {
    Cookies.remove('token');
    Cookies.remove('refresh');
    // Limpiamos los datos del usuario al salir para que no quede el nombre de otro
    localStorage.removeItem('user');
};

export const getToken = () => Cookies.get('token');

// Función auxiliar para obtener el usuario en cualquier componente
export const getUser = () => {
    if (typeof window !== 'undefined') {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
    return null;
};