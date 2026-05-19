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

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
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
                        onClick={() => !config.preventClose && close(false)}
                    />
                    
                    {/* Modal Card */}
                    <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-xl shrink-0 ${
                                    config.type === 'danger' ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' :
                                    config.type === 'warning' ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400' :
                                    config.type === 'success' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                                    'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400'
                                }`}>
                                    {config.type === 'danger' && <XCircle size={24} />}
                                    {config.type === 'warning' && <AlertCircle size={24} />}
                                    {config.type === 'success' && <CheckCircle2 size={24} />}
                                    {config.type === 'question' && <HelpCircle size={24} />}
                                    {(config.type === 'info' || !config.type) && <Info size={24} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Heading level={5} className="text-slate-900 dark:text-white mb-1">
                                        {config.title || 'Confirmación'}
                                    </Heading>
                                    <Text variant="bodySm" className="text-slate-500 dark:text-slate-400 leading-relaxed">
                                        {config.message}
                                    </Text>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
                            {!config.isAlert && (
                                <Button
                                    variant="secondary"
                                    onClick={() => close(false)}
                                    className="px-4 text-slate-700 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700"
                                >
                                    {config.cancelText || 'Cancelar'}
                                </Button>
                            )}
                            <Button
                                variant={buttonVariant}
                                onClick={() => close(true)}
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
            confirm({ message, title, type: 'danger', confirmText: 'Eliminar', ...options })
    };
};
