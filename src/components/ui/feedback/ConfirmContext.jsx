"use client";
import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, HelpCircle, CheckCircle2, XCircle, Info } from 'lucide-react';

const ConfirmContext = createContext(null);

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
                                <div className={`p-3 rounded-xl ${
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
                                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                        {config.title || 'Confirmación'}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                        {config.message}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/50">
                            {!config.isAlert && (
                                <button
                                    onClick={() => close(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    {config.cancelText || 'Cancelar'}
                                </button>
                            )}
                            <button
                                onClick={() => close(true)}
                                className={`px-5 py-2 text-sm font-semibold text-white rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${
                                    config.type === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                                    config.type === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
                                    config.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' :
                                    'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {config.confirmText || 'Aceptar'}
                            </button>
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
