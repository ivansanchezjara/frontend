"use client";
import { useState, useCallback } from 'react';

export function useErrorHandler() {
    const [error, setError] = useState(null);
    if (error) throw error;
    return useCallback((err) => {
        setError(err);
    }, []);
}