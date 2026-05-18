"use client";
import { useState } from 'react';
import { Text } from '@/components/ui';
import { X, Plus } from 'lucide-react';

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
                    <Text variant="bodySm" className="text-xs font-black text-slate-400 uppercase tracking-tight block px-1 truncate" >Sin atributos técnicos todavía.</Text>
                )}
                {entries.map(([k, v]) => (
                    <div key={k} className="flex gap-2 items-center bg-slate-50 p-2 rounded-xl border border-slate-100 group">
                        <div className="w-1/3 shrink-0">
                            <Text variant="bodySm" className="text-[10px] font-black text-slate-400 uppercase tracking-tight block px-1 truncate" title={k}>
                                {k}
                            </Text>
                        </div>
                        <input
                            className="flex-1 bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 p-0"
                            value={v}
                            onChange={(e) => handleEditValue(k, e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => handleRemove(k)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Selector para nuevo atributo */}
            <div className="flex gap-2 items-end pt-2 border-t border-slate-100">
                <div className="flex-1">
                    <Text variant="bodySm" className="text-[9px] font-black text-slate-400 uppercase mb-1 block px-1" as="label">Nueva Clave</Text>
                    <input
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="Ej: Material"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                </div>
                <div className="flex-[1.5]">
                    <Text variant="bodySm" className="text-[9px] font-black text-slate-400 uppercase mb-1 block px-1" as="label">Valor</Text>
                    <input
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="Ej: Acero 316L"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    />
                </div>
                <button
                    onClick={handleAdd}
                    disabled={!newKey.trim()}
                    className="h-[34px] px-3 bg-slate-900 text-white rounded-lg font-bold text-xs hover:bg-blue-600 transition-all disabled:opacity-30 flex items-center justify-center cursor-pointer"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
