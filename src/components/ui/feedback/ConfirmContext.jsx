"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, HelpCircle, CheckCircle2, XCircle, Info } from 'lucide-react';
import Button from '../basics/Button';
import { Heading, Text } from '../basics/Typography';

const ConfirmContext = createContext(null);

/**
 * ConfirmProvider estandarizado.
 * Proveedor de diálogos de confirmación que utiliza los componentes atómicos
 * del sistema (Button, Typography) para renderizar ventanas emergentes de confirmación/alerta.
 */
export function ConfirmProvider({ children }) {
    const [config, setConfig] = useState(null);
    const [inputValue, setInputValue] = useState('');

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setInputValue(options.defaultValue || '');
            setConfig({
                ...options,
                resolve
            });
        });
    }, []);

    const close = (result) => {
        if (config?.resolve) {
            config.resolve(result);
        }
        setConfig(null);
        setInputValue('');
    };

    // Mapeo dinámico del tipo de confirmación al variante del botón de confirmación
    const buttonVariant = config ? (
        config.type === 'danger' ? 'danger' :
        config.type === 'success' ? 'success' :
        'primary'
    ) : 'primary';

    // Sobrescribir el estilo si el tipo es una alerta de advertencia (warning)
    const buttonCustomClass = config?.type === 'warning'
        ? 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500 shadow-sm shadow-amber-200 border-none'
        : '';

    return (
        <ConfirmContext.Provider value={confirm}>
            {children}
            {config && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => !config.preventClose && close(config.isPrompt ? null : false)}
                    />
                    
                    {/* Modal Card */}
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl shrink-0 ${
                                    config.type === 'danger' ? 'bg-red-50 text-red-600' :
                                    config.type === 'warning' ? 'bg-amber-50 text-amber-600' :
                                    config.type === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                    'bg-blue-50 text-blue-600'
                                }`}>
                                    {config.type === 'danger' && <XCircle size={24} />}
                                    {config.type === 'warning' && <AlertCircle size={24} />}
                                    {config.type === 'success' && <CheckCircle2 size={24} />}
                                    {config.type === 'question' && <HelpCircle size={24} />}
                                    {(config.type === 'info' || !config.type) && <Info size={24} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Heading level={5} className="text-slate-900 mb-1">
                                        {config.title || 'Confirmación'}
                                    </Heading>
                                    <Text variant="bodySm" className="text-slate-500 leading-relaxed mb-4">
                                        {config.message}
                                    </Text>
                                    {config.isPrompt && (
                                        <div className="mt-3">
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all animate-in fade-in slide-in-from-top-1 duration-200"
                                                placeholder={config.placeholder || 'Escribe aquí...'}
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        close(inputValue);
                                                    }
                                                }}
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50">
                            {!config.isAlert && (
                                <Button
                                    variant="secondary"
                                    onClick={() => close(config.isPrompt ? null : false)}
                                    className="px-4 text-slate-700"
                                >
                                    {config.cancelText || 'Cancelar'}
                                </Button>
                            )}
                            <Button
                                variant={buttonVariant}
                                onClick={() => close(config.isPrompt ? inputValue : true)}
                                className={buttonCustomClass}
                            >
                                {config.confirmText || 'Aceptar'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
}

export const useConfirm = () => {
    const confirm = useContext(ConfirmContext);
    if (!confirm) {
        throw new Error('useConfirm debe usarse dentro de un ConfirmProvider');
    }
    
    return {
        confirm: (message, title, options = {}) => 
            confirm({ message, title, type: 'question', ...options }),
        alert: (message, title, options = {}) => 
            confirm({ message, title, type: 'info', isAlert: true, ...options }),
        danger: (message, title, options = {}) => 
            confirm({ message, title, type: 'danger', confirmText: 'Eliminar', ...options }),
        prompt: (message, title, options = {}) =>
            confirm({ message, title, type: 'info', isPrompt: true, ...options })
    };
};
