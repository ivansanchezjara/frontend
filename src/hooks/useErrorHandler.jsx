"use client";
import { useToast } from '@/components/ui';
import { useCallback } from 'react';
import { ApiError } from '@/services/api';

export function useErrorHandler() {
    const { showToast } = useToast();

    return useCallback((err) => {
        console.error("🔴 Error capturado:", err);

        let mensaje = "Ocurrió un error inesperado.";
        let tipo = 'error';

        if (err instanceof ApiError) {
            mensaje = err.message;
            if (err.status === 403) tipo = 'warning';
        } else if (err instanceof Error) {
            mensaje = err.message;
        } else if (typeof err === 'string') {
            mensaje = err;
        }

        showToast(mensaje, tipo);
    }, [showToast]);
}