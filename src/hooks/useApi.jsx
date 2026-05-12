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
        auto = false,
        args = [],
        initialData = null,
        onSuccess = null,
        onError = null,
        handleError: autoHandleError = true
    } = options;

    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(auto);
    const [error, setError] = useState(null);
    const globalErrorHandler = useErrorHandler();

    const execute = useCallback(async (...callArgs) => {
        setLoading(true);
        setError(null);
        try {
            const finalArgs = callArgs.length > 0 ? callArgs : args;
            const result = await apiFunc(...finalArgs);
            
            setData(result);
            if (onSuccess) onSuccess(result);
            return result;
        } catch (err) {
            setError(err);
            if (autoHandleError) globalErrorHandler(err);
            if (onError) onError(err);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiFunc, globalErrorHandler, autoHandleError, onSuccess, onError, JSON.stringify(args)]);

    const refetch = useCallback(() => {
        return execute(...args);
    }, [execute, args]);

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
        refresh: execute,
        refetch
    };
}
