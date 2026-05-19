"use client";
import { useState } from 'react';
import { Button, Input, Text } from '@/components/ui';
import { X, Plus } from 'lucide-react';

/**
 * AttributesEditor estandarizado.
 * Permite editar una estructura clave-valor (objeto JSON) de forma interactiva,
 * reutilizando los componentes atómicos del sistema (Input, Button, Typography - Text).
 */
export default function AttributesEditor({ attributes = {}, onChange }) {
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    const handleAdd = () => {
        if (!newKey.trim()) return;
        const updated = { ...attributes, [newKey.trim()]: newValue.trim() };
        onChange(updated);
        setNewKey('');
        setNewValue('');
    };

    const handleRemove = (key) => {
        const updated = { ...attributes };
        delete updated[key];
        onChange(updated);
    };

    const handleEditValue = (key, val) => {
        const updated = { ...attributes, [key]: val };
        onChange(updated);
    };

    const entries = Object.entries(attributes);

    return (
        <div className="space-y-4">
            {/* Lista de atributos existentes */}
            <div className="space-y-2">
                {entries.length === 0 && (
                    <Text variant="bodySm" className="text-xs font-black text-slate-400 uppercase tracking-tight block px-1 truncate select-none">
                        Sin atributos técnicos todavía.
                    </Text>
                )}
                {entries.map(([k, v]) => (
                    <div key={k} className="flex gap-2 items-center bg-slate-50 rounded-xl p-2 border border-slate-100 group transition-all duration-200 hover:bg-slate-100/30">
                        <div className="w-1/3 shrink-0 select-none">
                            <Text variant="bodySm" className="text-[10px] font-black text-slate-400 uppercase tracking-tight block px-1 truncate" title={k}>
                                {k}
                            </Text>
                        </div>
                        <input
                            className="flex-1 bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 p-0 outline-none placeholder:text-slate-300"
                            value={v}
                            onChange={(e) => handleEditValue(k, e.target.value)}
                            placeholder="Valor del atributo..."
                        />
                        <button
                            type="button"
                            onClick={() => handleRemove(k)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer"
                            title="Eliminar atributo"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Formulario para nuevo atributo */}
            <div className="flex gap-3 items-end pt-3 border-t border-slate-100 flex-wrap sm:flex-nowrap">
                <div className="flex-1 min-w-[140px]">
                    <Input
                        label="Nueva Clave"
                        placeholder="Ej: Material"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        className="text-xs font-bold py-1.5 focus:ring-blue-500/10 focus:border-blue-500 rounded-lg bg-slate-50 focus:bg-white"
                    />
                </div>
                <div className="flex-[1.5] min-w-[180px]">
                    <Input
                        label="Valor"
                        placeholder="Ej: Acero 316L"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        className="text-xs font-bold py-1.5 focus:ring-blue-500/10 focus:border-blue-500 rounded-lg bg-slate-50 focus:bg-white"
                    />
                </div>
                <Button
                    onClick={handleAdd}
                    disabled={!newKey.trim()}
                    icon={Plus}
                    className="bg-slate-900 hover:bg-slate-800 text-white border-none shrink-0 h-9.5 rounded-lg px-3 shadow-md shadow-slate-900/5 active:scale-95 transition-all"
                    title="Agregar atributo"
                />
            </div>
        </div>
    );
}
