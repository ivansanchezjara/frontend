"use client";
import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import { 
    Folder, Image as ImageIcon, Search, Upload, Filter, 
    MoreVertical, Trash2, Edit2, Link as LinkIcon, 
    AlertCircle, HardDrive, CheckSquare, ChevronRight, Home,
    Package, X, Check
} from 'lucide-react';
import Link from 'next/link';
import Pagination from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';
import { 
    getFolders, getImages, uploadImage, 
    deleteImage, createFolder, getOrphans,
    bulkAssignImages, getAllFolders, deleteFolder,
    updateImage, updateFolder 
} from '@/services/media';
import { getFullImageUrl } from '@/services/api';
import BulkAssignModal from '@/components/catalogo/BulkAssignModal';

export default function MediaManagerPage() {
    const [carpetas, setCarpetas] = useState([]);
    const [archivos, setArchivos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [carpetaActual, setCarpetaActual] = useState('root');
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: 'root', nombre: 'Raíz' }]);
    const [searchTerm, setSearchTerm] = useState('');
    const searchTermDebounced = useDebounce(searchTerm, 400);
    const [page, setPage] = useState(1);
    const [count, setCount] = useState(0);
    const pageSize = 24;
    const fileInputRef = useRef(null);

    const [isAuditing, setIsAuditing] = useState(false);

    const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);

    // Estados para selección múltiple
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);

    // Estados para edición
    const [isEditingImage, setIsEditingImage] = useState(false);
    const [editFormData, setEditFormData] = useState({});
    const [allFolders, setAllFolders] = useState([]);

    // Estado para progreso de subida
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

    const loadData = async (folderId, pageNum = 1) => {
        if (!folderId && !isAuditing) return;
        setLoading(true);
        setArchivoSeleccionado(null);
        setSelectedItems([]);
        try {
            const params = { page: pageNum, search: searchTermDebounced };
            
            if (isAuditing) {
                const data = await getOrphans(params);
                setArchivos(data.results || data);
                setCount(data.count || 0);
                setCarpetas([]);
            } else {
                const [foldersData, imagesData] = await Promise.all([
                    getFolders(folderId),
                    getImages(folderId, params)
                ]);
                setCarpetas(foldersData.results || foldersData);
                setArchivos(imagesData.results || imagesData);
                setCount(imagesData.count || 0);
            }
        } catch (error) {
            console.error("Error cargando medios:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAuditOrphans = () => {
        setIsAuditing(true);
        setCarpetaActual(null);
        setPage(1);
    };

    useEffect(() => {
        loadData(carpetaActual, page);
    }, [carpetaActual, page, searchTermDebounced, isAuditing]);

    useEffect(() => {
        setPage(1);
    }, [carpetaActual, searchTermDebounced, isAuditing]);

    const navigateToFolder = (folder) => {
        setCarpetaActual(folder.id);
        setArchivoSeleccionado(null);
        const idx = breadcrumbs.findIndex(b => b.id === folder.id);
        if (idx >= 0) {
            setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
        } else {
            setBreadcrumbs([...breadcrumbs, { id: folder.id, nombre: folder.name || folder.nombre }]);
        }
    };

    const handleUploadClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setLoading(true);
        setUploadProgress({ current: 0, total: files.length });
        let successes = 0;
        let failures = 0;

        try {
            // PROCESAMIENTO SECUENCIAL: Para SQLite, 1 por 1 es lo más seguro 
            // para evitar el error "database is locked"
            const CHUNK_SIZE = 1; 
            for (let i = 0; i < files.length; i += CHUNK_SIZE) {
                setUploadProgress(prev => ({ ...prev, current: i + 1 }));
                const chunk = files.slice(i, i + CHUNK_SIZE);
                const results = await Promise.allSettled(chunk.map(file => uploadImage(file, carpetaActual)));
                
                results.forEach(res => {
                    if (res.status === 'fulfilled') successes++;
                    else {
                        failures++;
                        console.error("Error en subida individual:", res.reason);
                    }
                });
            }

            if (failures > 0) {
                alert(`Proceso de subida completado:\n✅ ${successes} archivos subidos con éxito.\n❌ ${failures} archivos fallaron.`);
            }
            
            loadData(carpetaActual);
        } catch (error) {
            console.error("Error crítico subiendo archivos:", error);
            alert("Ocurrió un error inesperado durante la subida.");
        } finally {
            setLoading(false);
            setUploadProgress({ current: 0, total: 0 });
            e.target.value = '';
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("¿Estás seguro de eliminar este archivo?")) return;
        try {
            await deleteImage(id);
            setArchivos(archivos.filter(a => a.id !== id));
            if (archivoSeleccionado?.id === id) setArchivoSeleccionado(null);
        } catch (error) {
            alert("Error al eliminar el archivo");
        }
    };

    const handleCreateFolder = async () => {
        const name = prompt("Nombre de la nueva carpeta:");
        if (!name) return;
        try {
            await createFolder(name, carpetaActual === 'root' ? null : carpetaActual);
            loadData(carpetaActual);
        } catch (error) {
            alert("Error al crear carpeta");
        }
    };

    const handleDeleteFolder = async (e, id) => {
        e.stopPropagation();
        if (!confirm("¿Estás seguro de eliminar esta carpeta? Solo se eliminará si está vacía.")) return;
        try {
            await deleteFolder(id);
            loadData(carpetaActual);
        } catch (error) {
            alert("Error al eliminar carpeta. Asegúrate de que esté vacía.");
        }
    };


    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedItems([]);
        setArchivoSeleccionado(null);
    };

    const toggleItemSelection = (id) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(item => item !== id));
        } else {
            setSelectedItems([...selectedItems, id]);
        }
    };

    const handleSelectAll = () => {
        const allIds = archivos.map(a => a.id);
        if (selectedItems.length === allIds.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(allIds);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`¿Estás seguro de eliminar ${selectedItems.length} archivos?`)) return;
        setLoading(true);
        try {
            await Promise.all(selectedItems.map(id => deleteImage(id)));
            setArchivos(archivos.filter(a => !selectedItems.includes(a.id)));
            setSelectedItems([]);
            setIsSelectionMode(false);
        } catch (error) {
            alert("Error al eliminar algunos archivos");
            loadData(carpetaActual);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkAssign = async (varianteId, targetType) => {
        setLoading(true);
        try {
            await bulkAssignImages(selectedItems, varianteId, targetType);
            alert("Acción completada con éxito");
            setShowBulkAssignModal(false);
            setSelectedItems([]);
            setIsSelectionMode(false);
            loadData(carpetaActual);
        } catch (error) {
            console.error("Error al asignar imágenes:", error);
            const msg = typeof error === 'object' ? JSON.stringify(error) : error;
            alert(`Error al asignar imágenes: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const startEditingImage = async () => {
        setEditFormData({
            name: archivoSeleccionado.name,
            default_alt_text: archivoSeleccionado.default_alt_text || '',
            default_caption: archivoSeleccionado.default_caption || '',
            folder: archivoSeleccionado.folder || 'root'
        });
        setIsEditingImage(true);
        
        // Cargar todas las carpetas para el selector
        try {
            const data = await getAllFolders();
            setAllFolders(data.results || data);
        } catch (e) {
            console.error("Error cargando todas las carpetas");
        }
    };

    const handleSaveImageInfo = async () => {
        setLoading(true);
        try {
            const dataToSave = { ...editFormData };
            if (dataToSave.folder === 'root') dataToSave.folder = null;
            
            const updated = await updateImage(archivoSeleccionado.id, dataToSave);
            setArchivoSeleccionado(updated);
            setIsEditingImage(false);
            loadData(carpetaActual);
        } catch (error) {
            console.error("Error actualizando imagen:", error);
            const msg = typeof error === 'object' ? JSON.stringify(error) : error;
            alert(`Error al actualizar la información de la imagen: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDragStart = (e, id) => {
        // Si el elemento arrastrado es parte de la selección múltiple, movemos todo el lote
        if (selectedItems.includes(id)) {
            e.dataTransfer.setData("imageIds", JSON.stringify(selectedItems));
        } else {
            // Si no, solo movemos el archivo individual
            e.dataTransfer.setData("imageIds", JSON.stringify([id]));
        }
    };

    const handleDrop = async (e, folderId) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("imageIds");
        if (!data) return;

        try {
            const ids = JSON.parse(data);
            const targetFolder = folderId === 'root' ? null : folderId;
            
            setLoading(true);
            // Movemos todos los archivos en paralelo
            await Promise.all(ids.map(id => updateImage(id, { folder: targetFolder })));
            
            // Limpiamos selección y recargamos
            setSelectedItems([]);
            setIsSelectionMode(false);
            loadData(carpetaActual);
        } catch (error) {
            console.error("Error moviendo archivos:", error);
            alert("Error al mover los archivos seleccionados");
        } finally {
            setLoading(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("URL copiada al portapapeles");
    };

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            {/* Cabecera */}
            <PageHeader 
                title="Gestor de Medios" 
                subtitle={<><HardDrive size={12} /> Almacenamiento y Archivos</>}
                subtitleClassName="text-emerald-600"
            >
                 <Link
                    href="/catalogo"
                    className="bg-white text-slate-600 border border-slate-200 px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all shadow-sm active:scale-95 cursor-pointer mr-2"
                >
                    ← VOLVER A CATÁLOGO
                </Link>
                <button 
                    onClick={handleUploadClick}
                    className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                >
                    <Upload size={14} /> SUBIR ARCHIVO
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                />
            </PageHeader>

            <main className="flex-1 overflow-hidden flex flex-col min-w-0 p-4 gap-4 max-w-[1700px] mx-auto w-full">
                
                {/* Breadcrumbs / Barra de navegación */}
                <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm">
                    {isAuditing ? (
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => loadData('root')}
                                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                            >
                                <Home size={14} />
                            </button>
                            <ChevronRight size={12} className="text-slate-300" />
                            <span className="text-xs font-black uppercase text-amber-600 flex items-center gap-1">
                                <AlertCircle size={12} /> Auditoría de Huérfanas
                            </span>
                        </div>
                    ) : (
                        breadcrumbs.map((b, idx) => (
                            <div key={b.id} className="flex items-center gap-2">
                                <button 
                                    onClick={() => navigateToFolder(b)}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, b.id)}
                                    className={`text-xs font-bold transition-colors p-1 rounded hover:bg-slate-50 ${carpetaActual === b.id ? 'text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
                                >
                                    {b.id === 'root' ? <Home size={14} /> : b.nombre}
                                </button>
                                {idx < breadcrumbs.length - 1 && <ChevronRight size={12} className="text-slate-300" />}
                            </div>
                        ))
                    )}
                    {!isAuditing && (
                        <button 
                            onClick={handleCreateFolder}
                            className="ml-auto text-[10px] font-black uppercase tracking-tighter bg-emerald-50 text-emerald-600 px-2 py-1 rounded hover:bg-emerald-100 transition-colors"
                        >
                            + Nueva Carpeta
                        </button>
                    )}
                </div>

                <div className="flex-1 flex gap-4 min-h-0">
                    {/* Panel Izquierdo: Directorios */}
                    <div className="w-64 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden shrink-0">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Directorios</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {loading ? (
                                <div className="p-4 text-center text-slate-400 text-xs font-bold animate-pulse">Cargando...</div>
                            ) : (
                                <div className="space-y-1">
                                    {carpetas.map(c => (
                                        <div
                                            key={c.id}
                                            onClick={() => navigateToFolder(c)}
                                            onDragOver={handleDragOver}
                                            onDrop={(e) => handleDrop(e, c.id)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group cursor-pointer ${carpetaActual === c.id ? 'bg-emerald-50 border border-emerald-200 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Folder size={18} className={carpetaActual === c.id ? 'text-emerald-500 fill-emerald-500/20' : 'text-slate-400'} />
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-bold capitalize truncate ${carpetaActual === c.id ? 'text-emerald-700' : 'text-slate-700'}`}>{c.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">{c.modified_at ? new Date(c.modified_at).toLocaleDateString() : 'Directorio'}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => handleDeleteFolder(e, c.id)}
                                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    {carpetas.length === 0 && (
                                        <div className="p-8 text-center">
                                            <p className="text-xs font-bold text-slate-400 italic">No hay subcarpetas</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                            <button 
                                onClick={handleAuditOrphans}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 border ${isAuditing ? 'bg-amber-500 text-white border-amber-600' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50'}`}
                            >
                                <AlertCircle size={14} /> AUDITAR HUÉRFANAS
                            </button>
                        </div>
                    </div>

                    {/* Panel Derecho: Explorador */}
                    <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col overflow-hidden">
                        {/* Barra de herramientas del explorador */}
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
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                            {loading ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                                    {[1,2,3,4,5,6].map(i => (
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
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
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

                    {/* Panel de Detalles (Lateral) */}
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
                                                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Texto Alt (SEO)</label>
                                            <input 
                                                type="text"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500"
                                                placeholder="Ej: Cureta de sinus quirúrgica..."
                                                value={editFormData.default_alt_text}
                                                onChange={(e) => setEditFormData({...editFormData, default_alt_text: e.target.value})}
                                            />
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Leyenda / Caption</label>
                                            <textarea 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-emerald-500 resize-none"
                                                rows={3}
                                                value={editFormData.default_caption}
                                                onChange={(e) => setEditFormData({...editFormData, default_caption: e.target.value})}
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
                </div>

            </main>

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
