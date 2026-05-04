"use client";
import { useCallback } from 'react';

export function useErrorHandler() {
    return useCallback((err) => {
        // 1. Registramos el error en consola para que los desarrolladores puedan investigar
        console.error("🔴 API Error capturado por useErrorHandler:", err);

        // 2. Extraemos el mensaje de error de forma inteligente
        let mensaje = "Ocurrió un error inesperado al conectar con el servidor. Por favor, intenta de nuevo.";

        if (typeof err === 'string') {
            mensaje = err;
        } else if (err.message) {
            // Error estándar de JavaScript o de Fetch
            mensaje = err.message;
        } else if (err.response && err.response.data) {
            // Por si en algún momento usan Axios u otra librería similar
            mensaje = JSON.stringify(err.response.data);
        }

        // 3. Mostramos una alerta al usuario en lugar de romper la pantalla!
        alert(`⚠️ Atención:\n\n${mensaje}`);

    }, []);
}