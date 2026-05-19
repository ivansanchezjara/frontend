"use client";
import { Pagination, Button, Text, Input, SearchBar } from '@/components/ui';
import { CheckSquare, ImageIcon, Check, Trash2, Link as LinkIcon, ChevronRight, Edit2, Package, X, AlertCircle } from 'lucide-react';
import BulkAssignModal from '@/components/comercial/media-manager/modals/BulkAssignModal';

/**
 * ExplorerPanel estandarizado.
 * Panel explorador de archivos del Media Manager con soporte para búsqueda,
 * selección múltiple, paginación, edición de metadatos SEO y asignaciones masivas.
 * Reutiliza las piezas atómicas de interfaz (SearchBar, Button, Typography, Input).
 */
export default function ExplorerPanel({
    archivos,
    loading,
    searchTerm,
    setSearchTerm,
    count,
    pageSize,
    page,
    setPage,
    isSelectionMode,
    toggleSelectionMode,
    handleSelectAll,
    selectedItems,
    setSelectedItems,
    toggleItemSelection,
    uploadProgress,
    handleDragStart,
    archivoSeleccionado,
    setArchivoSeleccionado,
    isEditingImage,
    setIsEditingImage,
    handleDelete,
    getFullImageUrl,
    formatFileSize,
    startEditingImage,
    editFormData,
    setEditFormData,
    handleSaveImageInfo,
    copyToClipboard,
    showBulkAssignModal,
    setShowBulkAssignModal,
    handleBulkDelete,
    handleBulkAssign
}) {
    return (
        <div className="flex-1 flex gap-4 min-h-0">
            {/* Explorador Principal */}
            <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                {/* Barra de herramientas */}
                <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0 select-none">
                    <div className="flex items-center gap-4 flex-1">
                        <SearchBar
                            placeholder="Buscar archivo por nombre..."
                            value={searchTerm}
                            onChange={setSearchTerm}
                            className="w-72"
                        />
                        <div className="h-6 w-px bg-slate-200"></div>
                        <Text variant="label" className="text-slate-500 font-black">
                            {count} elementos
                        </Text>
                    </div>

                    <div className="flex items-center gap-3">
                        {isSelectionMode && (
                            <Button
                                variant="outline"
                                onClick={handleSelectAll}
                                className="text-[10px] font-black uppercase tracking-widest px-3 h-8.5 rounded-lg text-slate-600 hover:bg-slate-50 border-slate-200 shrink-0"
                            >
                                {selectedItems.length === archivos.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                            </Button>
                        )}
                        <Button
                            variant={isSelectionMode ? 'success' : 'outline'}
                            onClick={toggleSelectionMode}
                            icon={CheckSquare}
                            className={`w-9 h-9 rounded-lg shrink-0 ${
                                isSelectionMode 
                                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' 
                                    : 'border-slate-200 text-slate-500 hover:bg-slate-100/85'
                            }`}
                            title="Selección Múltiple"
                        />
                    </div>
                </div>

                {/* Grilla de Archivos */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 relative min-h-0">
                    {loading && archivos.length > 0 && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-20 flex items-center justify-center animate-in fade-in duration-200">
                            <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-xl border border-slate-100 select-none">
                                <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                <Text variant="caption" className="text-slate-400 tracking-wider">
                                    Actualizando...
                                </Text>
                            </div>
                        </div>
                    )}

                    {loading && archivos.length === 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                                <div key={i} className="aspect-[4/5] bg-white border border-slate-100 rounded-xl animate-pulse flex flex-col items-center justify-center select-none">
                                    {i === 1 && uploadProgress.total > 0 && (
                                        <div className="text-center">
                                            <Text variant="caption" className="text-emerald-500">Subiendo</Text>
                                            <p className="text-lg font-black text-slate-800">{uploadProgress.current}/{uploadProgress.total}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 transition-opacity duration-300 ${loading && archivos.length > 0 ? 'opacity-40' : 'opacity-100'}`}>
                            {archivos.map(archivo => (
                                <div
                                    key={archivo.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, archivo.id)}
                                    onClick={() => {
                                        if (isSelectionMode) {
                                            toggleItemSelection(archivo.id);
                                        } else {
                                            setArchivoSeleccionado(archivo);
                                            setIsEditingImage(false);
                                        }
                                    }}
                                    className={`group flex flex-col bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all cursor-grab active:cursor-grabbing relative ${
                                        selectedItems.includes(archivo.id) 
                                            ? 'ring-2 ring-emerald-500 border-emerald-500 scale-[0.98]' 
                                            : (archivoSeleccionado?.id === archivo.id ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-slate-200')
                                    }`}
                                >
                                    {isSelectionMode && (
                                        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 z-10 flex items-center justify-center transition-all ${selectedItems.includes(archivo.id) ? 'bg-emerald-500 border-emerald-500' : 'bg-white/80 border-slate-300'}`}>
                                            {selectedItems.includes(archivo.id) && <Check size={12} className="text-white" />}
                                        </div>
                                    )}

                                    <div className="relative aspect-square bg-slate-100 overflow-hidden select-none">
                                        <img
                                            src={getFullImageUrl(archivo.url)}
                                            alt={archivo.name}
                                            className={`w-full h-full object-contain transition-transform duration-500 p-2 ${selectedItems.includes(archivo.id) ? 'opacity-70' : 'group-hover:scale-105'}`}
                                        />

                                        {archivo.usage?.length > 0 && (
                                            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                                <LinkIcon size={10} /> EN USO
                                            </div>
                                        )}

                                        {!isSelectionMode && (
                                            <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    className="w-7 h-7 bg-white/90 backdrop-blur rounded-md flex items-center justify-center text-slate-600 hover:text-red-600 shadow-sm transition-colors cursor-pointer"
                                                    title="Eliminar permanentemente"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(archivo.id);
                                                    }}
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-3">
                                        <Text variant="bodyXs" className="text-[11px] font-bold text-slate-700 truncate mb-1">
                                            {archivo.name}
                                        </Text>
                                        <div className="flex items-center justify-between select-none">
                                            <Text variant="bodyXs" className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0">
                                                {formatFileSize(archivo.size)}
                                            </Text>
                                            <Text variant="bodyXs" className="text-[9px] font-medium text-slate-400 truncate pl-2">
                                                {new Date(archivo.uploaded_at).toLocaleDateString()}
                                            </Text>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {archivos.length === 0 && (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 select-none">
                                    <ImageIcon size={48} className="mb-4 opacity-20" />
                                    <Text variant="bodySm" className="font-bold text-slate-500">
                                        No se encontraron archivos
                                    </Text>
                                    <Text variant="bodyXs" className="text-slate-400 mt-1">
                                        Sube uno nuevo o cambia de carpeta
                                    </Text>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PAGINACIÓN */}
                    {count > pageSize && (
                        <div className="mt-8 select-none">
                            <Pagination
                                count={count}
                                pageSize={pageSize}
                                currentPage={page}
                                onPageChange={setPage}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Panel de Detalles */}
            {archivoSeleccionado && (
                <div className="w-80 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0 animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center h-16 select-none">
                        <Text variant="label" className="text-slate-500 font-black">
                            {isEditingImage ? 'Editar Información' : 'Detalles del Archivo'}
                        </Text>
                        <div className="flex items-center gap-2">
                            {!isEditingImage && (
                                <button
                                    onClick={startEditingImage}
                                    className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors cursor-pointer"
                                    title="Editar"
                                >
                                    <Edit2 size={14} />
                                </button>
                            )}
                            <button
                                onClick={() => { setArchivoSeleccionado(null); setIsEditingImage(false); }}
                                className="p-1 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                                title="Cerrar panel"
                            >
                                <ChevronRight size={16} className="text-slate-400" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                        <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden mb-5 border border-slate-100 select-none">
                            <img
                                src={getFullImageUrl(archivoSeleccionado.url)}
                                alt={archivoSeleccionado.name}
                                className="w-full h-full object-contain p-2"
                            />
                        </div>

                        {isEditingImage ? (
                            <div className="space-y-4">
                                <Input
                                    label="Nombre"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="text-xs font-bold py-1.5"
                                />

                                <Input
                                    label="Texto Alt (SEO)"
                                    placeholder="Ej: Cureta de sinus quirúrgica..."
                                    value={editFormData.default_alt_text}
                                    onChange={(e) => setEditFormData({ ...editFormData, default_alt_text: e.target.value })}
                                    className="text-xs font-medium py-1.5"
                                />

                                <div>
                                    <Text variant="label" as="label" className="block mb-1 text-slate-400">
                                        Leyenda / Caption
                                    </Text>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all resize-none"
                                        rows={3}
                                        value={editFormData.default_caption}
                                        onChange={(e) => setEditFormData({ ...editFormData, default_caption: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-2 pt-2 select-none">
                                    <Button
                                        variant="secondary"
                                        onClick={() => setIsEditingImage(false)}
                                        className="flex-1 text-[10px] font-black uppercase h-10 rounded-xl"
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        variant="success"
                                        onClick={handleSaveImageInfo}
                                        className="flex-1 text-[10px] font-black uppercase h-10 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
                                    >
                                        Guardar
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <Text variant="label" className="block mb-1 text-slate-400">Nombre</Text>
                                    <Text variant="bodySm" className="font-bold text-slate-700 break-all">{archivoSeleccionado.name}</Text>
                                </div>

                                {archivoSeleccionado.default_alt_text && (
                                    <div>
                                        <Text variant="label" className="block mb-1 text-slate-400">Texto Alt</Text>
                                        <Text variant="bodyXs" className="font-medium text-slate-600">{archivoSeleccionado.default_alt_text}</Text>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Text variant="label" className="block mb-1 text-slate-400">Dimensiones</Text>
                                        <Text variant="bodyXs" className="font-bold text-slate-700">{archivoSeleccionado.width} x {archivoSeleccionado.height} px</Text>
                                    </div>
                                    <div>
                                        <Text variant="label" className="block mb-1 text-slate-400">Peso / Tamaño</Text>
                                        <Text variant="bodyXs" className="font-bold text-slate-700">{formatFileSize(archivoSeleccionado.size)}</Text>
                                    </div>
                                </div>

                                <div>
                                    <Text variant="label" className="block mb-1 text-slate-400">Subida</Text>
                                    <Text variant="bodyXs" className="font-bold text-slate-700">{new Date(archivoSeleccionado.uploaded_at).toLocaleDateString()}</Text>
                                </div>

                                <div>
                                    <Text variant="label" className="block mb-1 text-slate-400">URL Pública</Text>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={getFullImageUrl(archivoSeleccionado.url)}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-medium text-slate-500 outline-none select-all"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(getFullImageUrl(archivoSeleccionado.url))}
                                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                                            title="Copiar URL"
                                        >
                                            <LinkIcon size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <Text variant="label" className="block mb-3 text-slate-400">
                                        Vinculado a ({archivoSeleccionado.usage?.length || 0})
                                    </Text>
                                    <div className="space-y-2">
                                        {archivoSeleccionado.usage?.map((u, i) => (
                                            <div key={i} className="flex flex-col p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                <Text variant="bodyXs" className="text-[9px] font-black text-emerald-500 uppercase">{u.tipo}</Text>
                                                <Text variant="bodyXs" className="font-bold text-slate-700 truncate mt-0.5">{u.nombre}</Text>
                                                <Text variant="bodyXs" className="text-[9px] font-medium text-slate-400 mt-0.5">ID: {u.id}</Text>
                                            </div>
                                        ))}
                                        {archivoSeleccionado.usage?.length === 0 && (
                                            <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                                                <AlertCircle size={14} />
                                                <Text variant="bodyXs" className="font-bold uppercase tracking-tight text-amber-600">
                                                    Archivo Huérfano
                                                </Text>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2 select-none">
                        {!isEditingImage && (
                            <Button
                                variant="success"
                                onClick={() => {
                                    setSelectedItems([archivoSeleccionado.id]);
                                    setShowBulkAssignModal(true);
                                }}
                                icon={Package}
                                className="w-full h-11 text-[10px] font-black uppercase rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 active:scale-95 mb-1"
                            >
                                VINCULAR A PRODUCTO
                            </Button>
                        )}
                        <Button
                            variant="danger"
                            onClick={() => handleDelete(archivoSeleccionado.id)}
                            icon={Trash2}
                            className="w-full h-11 text-[10px] font-black uppercase rounded-xl"
                        >
                            ELIMINAR PERMANENTEMENTE
                        </Button>
                    </div>
                </div>
            )}

            {/* Barra de Acciones Masivas */}
            {isSelectionMode && selectedItems.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-8 z-[100] animate-in slide-in-from-bottom-10 duration-300 border border-slate-700/50 backdrop-blur-md bg-opacity-90">
                    <div className="flex items-center gap-3 border-r border-slate-700 pr-8 select-none">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-black">
                            {selectedItems.length}
                        </div>
                        <div>
                            <Text variant="bodyXs" className="font-black uppercase tracking-widest text-slate-100">
                                Seleccionados
                            </Text>
                            <button
                                onClick={() => setSelectedItems([])}
                                className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer block mt-0.5"
                            >
                                Deseleccionar todo
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 select-none">
                        <Button
                            variant="success"
                            onClick={() => setShowBulkAssignModal(true)}
                            icon={Package}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 h-11 rounded-xl shadow-lg shadow-emerald-500/20"
                        >
                            ASIGNAR A PRODUCTO
                        </Button>

                        <Button
                            variant="danger"
                            onClick={handleBulkDelete}
                            icon={Trash2}
                            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-5 h-11 rounded-xl border border-red-500/20 shadow-none hover:shadow-lg hover:shadow-red-500/10"
                        >
                            ELIMINAR SELECCIÓN
                        </Button>
                    </div>

                    <button
                        onClick={toggleSelectionMode}
                        className="ml-4 p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer flex items-center justify-center text-slate-400 hover:text-white"
                        title="Cerrar modo selección"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}

            <BulkAssignModal
                isOpen={showBulkAssignModal}
                onClose={() => setShowBulkAssignModal(false)}
                selectedCount={selectedItems.length}
                onAssign={handleBulkAssign}
            />
        </div>
    );
}
