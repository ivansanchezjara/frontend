"use client";
import { useState, useCallback, useEffect, useRef } from 'react';
import { useErrorHandler } from './useErrorHandler';

/**
 * Hook personalizado para manejar peticiones API de forma estandarizada.
 * Encapsula estados de carga, error y data, e integra automáticamente useErrorHandler.
 * 
 * @param {Function} apiFunc - Función de servicio (de @/services/api)
 * @param {Object} options - Configuración: { auto, args, initialData, onSuccess, onError, handleError }
 */
export function useApi(apiFunc, options = {}) {
    const {
        auto = false,            // ¿Ejecutar inmediatamente al montar?
        args = [],               // Argumentos iniciales si auto es true
        initialData = null,      // Valor inicial de data
        onSuccess = null,        // Callback en caso de éxito
        onError = null,          // Callback en caso de error
        handleError: autoHandleError = true // ¿Usar el manejador de errores global?
    } = options;

    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(auto);
    const [error, setError] = useState(null);
    const globalErrorHandler = useErrorHandler();

    const execute = useCallback(async (...callArgs) => {
        setLoading(true);
        setError(null);
        try {
            // Usar argumentos pasados a execute o los definidos en la config
            const finalArgs = callArgs.length > 0 ? callArgs : args;
            const result = await apiFunc(...finalArgs);
            
            setData(result);
            if (onSuccess) onSuccess(result);
            return result;
        } catch (err) {
            setError(err);
            if (autoHandleError) globalErrorHandler(err);
            if (onError) onError(err);
            throw err; // Re-lanzar para permitir manejo local adicional si es necesario
        } finally {
            setLoading(false);
        }
    }, [apiFunc, globalErrorHandler, autoHandleError, onSuccess, onError, JSON.stringify(args)]);

    // Ejecución automática al montar
    const initialized = useRef(false);
    useEffect(() => {
        if (auto && !initialized.current) {
            execute();
            initialized.current = true;
        }
    }, [auto, execute]);

    return {
        data,
        loading,
        error,
        execute,
        setData,
        refresh: execute
    };
}
