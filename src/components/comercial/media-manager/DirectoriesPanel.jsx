"use client";
import { useState, useEffect } from 'react';
import { Folder, Trash2, AlertCircle, Plus } from 'lucide-react';
import { getFolders, createFolder, deleteFolder } from '@/services/apis/media.js';
import { Button, Text } from '@/components/ui';

/**
 * DirectoriesPanel estandarizado.
 * Sidebar de navegación de carpetas dentro del Media Manager,
 * utilizando componentes atómicos de diseño (Button, Typography - Text).
 */
export default function DirectoriesPanel({
    carpetaActual,
    navigateToFolder,
    handleAuditOrphans,
    isAuditing,
    handleDrop,
    handleDragOver
}) {
    const [carpetas, setCarpetas] = useState([]);
    const [loading, setLoading] = useState(false);

    const loadFolders = async () => {
        setLoading(true);
        try {
            const id = isAuditing ? 'root' : (carpetaActual === 'root' ? 'root' : carpetaActual);
            const data = await getFolders(id === 'root' ? null : id);
            setCarpetas(data.results || data);
        } catch (error) {
            console.error("Error al cargar carpetas:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFolders();
    }, [carpetaActual, isAuditing]);

    const onCreateFolder = async () => {
        const name = prompt("Nombre de la nueva carpeta:");
        if (!name) return;
        try {
            await createFolder(name, carpetaActual === 'root' ? null : carpetaActual);
            loadFolders();
        } catch (error) {
            alert("Error al crear carpeta");
        }
    };

    const onDeleteFolder = async (e, id) => {
        e.stopPropagation();
        if (!confirm("¿Estás seguro de eliminar esta carpeta? Solo se eliminará si está vacía.")) return;
        try {
            await deleteFolder(id);
            loadFolders();
        } catch (error) {
            alert("Error al eliminar carpeta. Asegúrate de que esté vacía.");
        }
    };

    return (
        <div className="w-64 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0 select-none">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center h-16">
                <Text variant="label" className="text-slate-500 font-black">
                    Directorios
                </Text>
                {!isAuditing && (
                    <Button
                        onClick={onCreateFolder}
                        variant="ghost"
                        size="icon"
                        icon={Plus}
                        className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 w-7 h-7 rounded-lg shrink-0 border-none transition-all"
                        title="Nueva Carpeta"
                    />
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-2">
                {loading && carpetas.length === 0 ? (
                    <div className="p-4 text-center">
                        <Text variant="bodyXs" className="text-slate-400 font-bold animate-pulse">
                            Cargando...
                        </Text>
                    </div>
                ) : (
                    <div className={`space-y-1 transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
                        {carpetas.map(c => (
                            <div
                                key={c.id}
                                onClick={() => navigateToFolder(c)}
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, c.id)}
                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group cursor-pointer border ${carpetaActual === c.id
                                    ? 'bg-emerald-50 border-emerald-200 shadow-sm'
                                    : 'hover:bg-slate-50 border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Folder
                                        size={18}
                                        className={carpetaActual === c.id ? 'text-emerald-500 fill-emerald-500/20' : 'text-slate-400'}
                                    />
                                    <div className="min-w-0">
                                        <Text
                                            variant="bodySm"
                                            className={`font-bold capitalize truncate ${carpetaActual === c.id ? 'text-emerald-800' : 'text-slate-700'}`}
                                        >
                                            {c.name}
                                        </Text>
                                        <Text variant="bodyXs" className="text-slate-400 mt-0.5 font-medium">
                                            {c.modified_at ? new Date(c.modified_at).toLocaleDateString() : 'Directorio'}
                                        </Text>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    onClick={(e) => onDeleteFolder(e, c.id)}
                                    className="w-6 h-6 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 border-none shrink-0"
                                    title="Eliminar carpeta"
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        ))}
                        {carpetas.length === 0 && (
                            <div className="p-8 text-center">
                                <Text variant="bodyXs" className="text-slate-400 italic font-medium">
                                    No hay subcarpetas
                                </Text>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <Button
                    onClick={handleAuditOrphans}
                    icon={AlertCircle}
                    className={`w-full text-[10px] font-black uppercase tracking-wider h-11 rounded-xl shadow-sm border transition-all active:scale-95 ${isAuditing
                        ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50'
                        }`}
                >
                    AUDITAR HUÉRFANAS
                </Button>
            </div>
        </div>
    );
}
