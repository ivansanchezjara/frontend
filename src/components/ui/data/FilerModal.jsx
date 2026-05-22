"use client";
import { useState, useEffect, useRef } from 'react';
import { getFolders, getImages, uploadImage, createFolder } from '@/services/apis/media.js';
import { getFullImageUrl } from '@/services/apis/catalogo.js';
import { Folder, Image as ImageIcon, Upload, ChevronRight, Home, Link as LinkIcon, Plus } from 'lucide-react';
import Pagination from './Pagination';
import SearchBar from './SearchBar';
import Button from '../basics/Button';
import { Text, Heading } from '../basics/Typography';
import { useDebounce } from '@/hooks/useDebounce';
import { useConfirm } from '../feedback/ConfirmContext';
import { useToast } from '../feedback/ToastContext';

/**
 * FilerModal estandarizado.
 * Modal de administración de medios y subida de archivos que reutiliza
 * los componentes atómicos del sistema (Button, Typography, SearchBar).
 */
export default function FilerModal({ isOpen, onClose, onSelectImage, initialSearch = '' }) {
    const [currentFolder, setCurrentFolder] = useState('root');
    const [folders, setFolders] = useState([]);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchTermDebounced = useDebounce(searchTerm, 400);
    const [page, setPage] = useState(1);
    const [count, setCount] = useState(0);
    const pageSize = 24;
    const fileInputRef = useRef(null);
    const { prompt: showPrompt } = useConfirm();
    const { showToast } = useToast();

    // Navigation breadcrumbs
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: 'root', nombre: 'Raíz' }]);

    const loadContents = async (folderId, pageNum = 1) => {
        setLoading(true);
        try {
            const params = { page: pageNum, search: searchTermDebounced };
            const [fData, iData] = await Promise.all([
                getFolders(folderId),
                getImages(folderId, params)
            ]);
            setFolders(fData.results || fData);
            setImages(iData.results || iData);
            setCount(iData.count || 0);
        } catch (e) {
            console.error("Error loading filer contents", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setSearchTerm(initialSearch);
            setPage(1);
        }
    }, [isOpen, initialSearch]);

    useEffect(() => {
        if (isOpen) {
            loadContents(currentFolder, page);
        }
    }, [isOpen, currentFolder, page, searchTermDebounced]);

    useEffect(() => {
        setPage(1);
    }, [currentFolder, searchTermDebounced]);

    const handleCreateFolder = async () => {
        const name = await showPrompt("Nombre de nueva carpeta:", "Nueva Carpeta", {
            placeholder: "Ej: Instrumental",
            confirmText: "Crear",
            cancelText: "Cancelar"
        });
        if (!name || !name.trim()) return;

        try {
            await createFolder(name.trim(), currentFolder === 'root' ? null : currentFolder);
            showToast("Carpeta creada con éxito", "success");
            loadContents(currentFolder);
        } catch (e) {
            showToast("Error creando carpeta", "error");
        }
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            await uploadImage(file, currentFolder);
            showToast("Imagen subida con éxito", "success");
            loadContents(currentFolder);
        } catch (e) {
            showToast("Error subiendo imagen", "error");
        } finally {
            setUploading(false);
            e.target.value = ''; // Reset
        }
    };

    const navigateToFolder = (folder) => {
        setCurrentFolder(folder.id);
        const idx = breadcrumbs.findIndex(b => b.id === folder.id);
        if (idx >= 0) {
            setBreadcrumbs(breadcrumbs.slice(0, idx + 1));
        } else {
            setBreadcrumbs([...breadcrumbs, { id: folder.id, nombre: folder.name || folder.nombre }]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white max-w-5xl w-full h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 shrink-0 bg-slate-50">
                    <div>
                        <Heading level={5} className="text-slate-800 leading-tight">
                            Media Manager
                        </Heading>
                        <div className="flex gap-2 items-center mt-1 select-none">
                            {breadcrumbs.map((b, idx) => (
                                <div key={b.id} className="flex gap-2 items-center">
                                    <button
                                        type="button"
                                        className="text-[10px] font-black text-slate-500 hover:text-emerald-600 uppercase tracking-widest transition-colors cursor-pointer flex items-center gap-1"
                                        onClick={() => navigateToFolder(b)}
                                    >
                                        {b.id === 'root' ? <Home size={11} className="shrink-0" /> : b.nombre}
                                    </button>
                                    {idx < breadcrumbs.length - 1 && <ChevronRight size={10} className="text-slate-300 shrink-0" />}
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onClose} 
                        className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                        title="Cerrar modal"
                    >
                        ✕
                    </Button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 flex gap-3 border-b border-slate-100 shrink-0 bg-white items-center flex-wrap sm:flex-nowrap">
                    {/* Search Bar Estandarizada */}
                    <SearchBar
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Buscar en esta carpeta..."
                        className="w-full sm:w-64"
                        inputClassName="bg-slate-50 border-slate-200 focus:border-emerald-500 text-xs py-2 focus:ring-emerald-500/10 focus:ring-4"
                    />

                    {/* Nueva Carpeta Button Estandarizado */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCreateFolder}
                        icon={Plus}
                        className="font-black text-[9px] uppercase tracking-widest rounded-xl px-4 h-9 whitespace-nowrap"
                    >
                        Nueva Carpeta
                    </Button>
                    
                    <div className="hidden sm:block h-6 w-px bg-slate-100 ml-2"></div>
                    
                    {/* Items Counters Estandarizados */}
                    <Text variant="label" className="text-[10px] font-black tracking-widest text-slate-400 uppercase hidden sm:block whitespace-nowrap">
                        {count} imágenes · {folders.length} carpetas
                    </Text>

                    {/* Subir Archivo Button Estandarizado */}
                    <Button
                        onClick={handleUploadClick}
                        disabled={uploading}
                        icon={uploading ? null : Upload}
                        className="bg-slate-900 hover:bg-slate-800 text-white border-none shadow-lg shadow-slate-900/10 ml-auto rounded-xl px-5 h-9.5 text-xs font-bold whitespace-nowrap shrink-0"
                    >
                        {uploading ? 'Subiendo...' : 'Subir Archivo'}
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                            <Text variant="label" className="text-slate-400 text-xs">
                                Cargando contenido...
                            </Text>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
                            {folders.map(f => (
                                <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => navigateToFolder(f)}
                                    className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 hover:bg-emerald-50/45 hover:border-emerald-300 transition-all cursor-pointer aspect-square shadow-sm group active:scale-[0.98]"
                                >
                                    <Folder size={40} className="text-emerald-400 fill-emerald-500/10 group-hover:scale-110 transition-transform duration-300" />
                                    <Text variant="bodyXsBold" as="span" className="text-slate-700 truncate w-full text-center leading-tight">
                                        {f.name}
                                    </Text>
                                </button>
                            ))}

                            {images.map(img => (
                                <div
                                    key={img.id}
                                    className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden aspect-square cursor-pointer flex flex-col items-center justify-between hover:ring-4 hover:ring-emerald-500/20 hover:border-emerald-500 transition-all shadow-sm active:scale-[0.98]"
                                    onClick={() => {
                                        onSelectImage(img);
                                        onClose();
                                    }}
                                >
                                    <div className="flex-1 w-full relative overflow-hidden bg-slate-100/30">
                                        <img src={getFullImageUrl(img.url)} alt={img.name} className="absolute inset-0 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
                                        {img.usage?.length > 0 && (
                                            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm z-10 select-none">
                                                <LinkIcon size={8} /> EN USO
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <div className="bg-white text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-lg shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
                                                ELEGIR
                                            </div>
                                        </div>
                                    </div>

                                    <div className="w-full p-2.5 bg-white border-t border-slate-100">
                                        <Text variant="bodyXsBold" className="text-slate-700 truncate w-full text-center leading-tight">
                                            {img.name}
                                        </Text>
                                    </div>
                                </div>
                            ))}

                            {folders.length === 0 && images.length === 0 && (
                                <div className="col-span-full py-20 flex flex-col items-center text-slate-400 bg-white border-2 border-dashed border-slate-200 rounded-3xl w-full max-w-sm mx-auto shadow-sm">
                                    <ImageIcon size={48} className="mb-4 opacity-20" />
                                    <Text variant="label" className="text-sm text-slate-500 mb-1">
                                        Carpeta vacía
                                    </Text>
                                    <Text variant="bodyXs" className="text-slate-400">
                                        Usa el botón de arriba para subir imágenes.
                                    </Text>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Pagination */}
                {count > pageSize && (
                    <div className="px-6 py-2 border-t border-slate-100 bg-white shrink-0">
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
    );
}
