"use client";
import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const Toast = ({ message, type = 'info', onClose }) => {
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, 4700);
        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    // Estilos minimalistas basados en Rojo (Error/Warning) o Slate (Info)
    const isError = type === 'error' || type === 'warning' || message.includes('No tienes permisos');
    
    const bgColor = isError ? 'bg-red-950/90' : 'bg-slate-900/90';
    const borderColor = isError ? 'border-red-500/50' : 'border-white/10';
    const textColor = isError ? 'text-red-100' : 'text-slate-100';
    const accentColor = isError ? 'bg-red-500' : 'bg-blue-500';

    return (
        <div 
            className={`
                pointer-events-auto min-w-[300px] max-w-[400px] 
                ${bgColor} backdrop-blur-md border ${borderColor} 
                rounded-lg py-3 px-4 flex items-center justify-between gap-4
                shadow-xl transition-all duration-300
                ${isClosing ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}
            `}
        >
            <div className="flex items-center gap-2 flex-1">
                {/* Indicador minimalista lateral */}
                <div className={`w-1 h-4 rounded-full ${accentColor}`} />
                <span className={`${textColor} text-[13px] font-medium leading-tight`}>
                    {message}
                </span>
            </div>
            
            <button 
                onClick={handleClose} 
                className="text-white/40 hover:text-white transition-colors shrink-0"
            >
                <X size={14} />
            </button>

            {/* Barra de progreso casi invisible */}
            <div className="absolute bottom-0 left-0 w-full h-[2px] opacity-30">
                <div 
                    className={`h-full origin-left ${accentColor}`}
                    style={{ animation: 'progress-bar 5s linear forwards' }}
                />
            </div>

            <style jsx>{`
                @keyframes progress-bar {
                    from { transform: scaleX(1); }
                    to { transform: scaleX(0); }
                }
            `}</style>
        </div>
    );
};

export default Toast;
