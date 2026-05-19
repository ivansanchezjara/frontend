"use client";
import { Text } from '../basics/Typography';

/**
 * LoadingScreen estandarizado.
 * Pantalla de carga animada y sutil que utiliza la tipografía atómica
 * del sistema (Typography - Text) para conservar consistencia visual.
 */
export default function LoadingScreen({ texto, message }) {
    const displayText = texto || message || "Cargando";

    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-transparent min-h-[400px] animate-in fade-in duration-1000">
            <div className="relative flex items-center justify-center mb-6">
                {/* Spinner minimalista */}
                <div className="w-12 h-12 border-[1.5px] border-slate-200 rounded-full"></div>
                <div className="absolute w-12 h-12 border-[1.5px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>

            <div className="text-center select-none">
                {/* Reutiliza la variante caption con un espaciado amplio y pulsante */}
                <Text 
                    variant="caption" 
                    className="text-slate-400 tracking-[0.4em] animate-pulse font-medium text-[10px]"
                >
                    {displayText}
                </Text>
            </div>
        </div>
    );
}
