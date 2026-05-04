"use client";
import { Search, CheckSquare, ImageIcon, Check, Trash2, Link as LinkIcon, ChevronRight, Edit2, Package, X, AlertCircle } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import BulkAssignModal from '@/components/comercial/catalogo/BulkAssignModal';

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
                <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-72">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Buscar archivo por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
                            />
                        </div>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{count} elementos</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {isSelectionMode && (
                            <button
                                onClick={handleSelectAll}
                                className="text-[10px] font-black uppercase tracking-widest bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition-all text-slate-600"
                            >
                                {selectedItems.length === archivos.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                            </button>
                        )}
                        <button
                            onClick={toggleSelectionMode}
                            className={`p-2 border rounded-lg transition-all ${isSelectionMode ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'border-slate-200 text-slate-500 hover:bg-slate-100'}`}
                            title="Selección Múltiple"
                        >
                            <CheckSquare size={16} />
                        </button>
                    </div>
                </div>

                {/* Grilla de Archivos */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 relative min-h-0">
                    {loading && archivos.length > 0 && (
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] z-20 flex items-center justify-center animate-in fade-in duration-200">
                            <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-xl border border-slate-100">
                                <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actualizando...</p>
                            </div>
                        </div>
                    )}

                    {loading && archivos.length === 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(i => (
                                <div key={i} className="aspect-[4/5] bg-white border border-slate-100 rounded-xl animate-pulse flex flex-col items-center justify-center">
                                    {i === 1 && uploadProgress.total > 0 && (
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-emerald-500 uppercase">Subiendo</p>
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
                                    className={`group flex flex-col bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-300 transition-all cursor-grab active:cursor-grabbing relative ${selectedItems.includes(archivo.id) ? 'ring-2 ring-emerald-500 border-emerald-500 scale-[0.98]' : (archivoSeleccionado?.id === archivo.id ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-slate-200')}`}
                                >
                                    {isSelectionMode && (
                                        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 z-10 flex items-center justify-center transition-all ${selectedItems.includes(archivo.id) ? 'bg-emerald-500 border-emerald-500' : 'bg-white/80 border-slate-300'}`}>
                                            {selectedItems.includes(archivo.id) && <Check size={12} className="text-white" />}
                                        </div>
                                    )}

                                    <div className="relative aspect-square bg-slate-100 overflow-hidden">
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
                                                    className="w-7 h-7 bg-white/90 backdrop-blur rounded-md flex items-center justify-center text-slate-600 hover:text-red-600 shadow-sm transition-colors"
                                                    title="Eliminar"
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
                                        <p className="text-[11px] font-bold text-slate-700 truncate mb-1">{archivo.name}</p>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                {formatFileSize(archivo.size)}
                                            </p>
                                            <p className="text-[9px] font-medium text-slate-400">
                                                {new Date(archivo.uploaded_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {archivos.length === 0 && (
                                <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400">
                                    <ImageIcon size={48} className="mb-4 opacity-20" />
                                    <p className="font-bold">No se encontraron archivos</p>
                                    <p className="text-xs">Sube uno nuevo o cambia de carpeta</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PAGINACIÓN */}
                    {count > pageSize && (
                        <Pagination
                            count={count}
                            pageSize={pageSize}
                            currentPage={page}
                            onPageChange={setPage}
                        />
                    )}
                </div>
            </div>

            {/* Panel de Detalles */}
            {archivoSeleccionado && (
                <div className="w-80 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0 animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                            {isEditingImage ? 'Editar Información' : 'Detalles del Archivo'}
                        </h3>
                        <div className="flex items-center gap-2">
                            {!isEditingImage && (
                                <button
                                    onClick={startEditingImage}
                                    className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 size={14} />
                                </button>
                            )}
                            <button
                                onClick={() => { setArchivoSeleccionado(null); setIsEditingImage(false); }}
                                className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <ChevronRight size={16} className="text-slate-400" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                        <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden mb-5 border border-slate-100">
                            <img
                                src={getFullImageUrl(archivoSeleccionado.url)}
                                alt={archivoSeleccionado.name}
                                className="w-full h-full object-contain p-2"
                            />
                        </div>

                        {isEditingImage ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nombre</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Texto Alt (SEO)</label>
                                    <input
                                        type="text"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500"
                                        placeholder="Ej: Cureta de sinus quirúrgica..."
                                        value={editFormData.default_alt_text}
                                        onChange={(e) => setEditFormData({ ...editFormData, default_alt_text: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Leyenda / Caption</label>
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 resize-none"
                                        rows={3}
                                        value={editFormData.default_caption}
                                        onChange={(e) => setEditFormData({ ...editFormData, default_caption: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => setIsEditingImage(false)}
                                        className="flex-1 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-black uppercase"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleSaveImageInfo}
                                        className="flex-1 py-2 bg-emerald-600 text-white rounded-xl text-[11px] font-black uppercase shadow-lg shadow-emerald-500/20"
                                    >
                                        Guardar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Nombre</label>
                                    <p className="text-sm font-bold text-slate-700 break-all">{archivoSeleccionado.name}</p>
                                </div>

                                {archivoSeleccionado.default_alt_text && (
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Texto Alt</label>
                                        <p className="text-xs font-medium text-slate-600">{archivoSeleccionado.default_alt_text}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Dimensiones</label>
                                        <p className="text-xs font-bold text-slate-700">{archivoSeleccionado.width} x {archivoSeleccionado.height} px</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Peso / Tamaño</label>
                                        <p className="text-xs font-bold text-slate-700">{formatFileSize(archivoSeleccionado.size)}</p>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Subida</label>
                                    <p className="text-xs font-bold text-slate-700">{new Date(archivoSeleccionado.uploaded_at).toLocaleDateString()}</p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">URL Pública</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={getFullImageUrl(archivoSeleccionado.url)}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[10px] font-medium text-slate-500 outline-none"
                                        />
                                        <button
                                            onClick={() => copyToClipboard(getFullImageUrl(archivoSeleccionado.url))}
                                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                                            title="Copiar URL"
                                        >
                                            <LinkIcon size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-slate-100">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Vinculado a ({archivoSeleccionado.usage?.length || 0})</label>
                                    <div className="space-y-2">
                                        {archivoSeleccionado.usage?.map((u, i) => (
                                            <div key={i} className="flex flex-col p-2 bg-slate-50 rounded-lg border border-slate-100">
                                                <span className="text-[9px] font-black text-emerald-500 uppercase">{u.tipo}</span>
                                                <span className="text-xs font-bold text-slate-700 truncate">{u.nombre}</span>
                                                <span className="text-[10px] font-medium text-slate-400">ID: {u.id}</span>
                                            </div>
                                        ))}
                                        {archivoSeleccionado.usage?.length === 0 && (
                                            <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                                                <AlertCircle size={14} />
                                                <p className="text-[11px] font-bold uppercase tracking-tight">Archivo Huérfano</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
                        {!isEditingImage && (
                            <button
                                onClick={() => {
                                    setSelectedItems([archivoSeleccionado.id]);
                                    setShowBulkAssignModal(true);
                                }}
                                className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-[11px] font-black uppercase hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 mb-1"
                            >
                                <Package size={14} /> VINCULAR A PRODUCTO
                            </button>
                        )}
                        <button
                            onClick={() => handleDelete(archivoSeleccionado.id)}
                            className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase hover:bg-red-50 transition-all shadow-sm active:scale-95"
                        >
                            <Trash2 size={14} /> ELIMINAR PERMANENTEMENTE
                        </button>
                    </div>
                </div>
            )}

            {/* Barra de Acciones Masivas */}
            {isSelectionMode && selectedItems.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-8 z-[100] animate-in slide-in-from-bottom-10 duration-300 border border-slate-700/50 backdrop-blur-md bg-opacity-90">
                    <div className="flex items-center gap-3 border-r border-slate-700 pr-8">
                        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-xs font-black">
                            {selectedItems.length}
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest">Seleccionados</p>
                            <button
                                onClick={() => setSelectedItems([])}
                                className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Deseleccionar todo
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowBulkAssignModal(true)}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                        >
                            <Package size={14} /> ASIGNAR A PRODUCTO
                        </button>

                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 border border-red-500/20"
                        >
                            <Trash2 size={14} /> ELIMINAR SELECCIÓN
                        </button>
                    </div>

                    <button
                        onClick={toggleSelectionMode}
                        className="ml-4 p-2 hover:bg-white/10 rounded-full transition-colors"
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