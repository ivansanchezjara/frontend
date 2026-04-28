"use client";
import { useState, useEffect, useRef } from 'react';
import { getFolders, getImages, uploadImage, createFolder } from '@/services/media';
import { getFullImageUrl } from '@/services/api';
import { Folder, Image as ImageIcon, Upload, ChevronRight, Home, Link as LinkIcon, Plus, Search } from 'lucide-react';
import Pagination from '@/components/ui/Pagination';
import { useDebounce } from '@/hooks/useDebounce';

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
        const name = prompt("Nombre de nueva carpeta:");
        if (!name) return;
        
        try {
            await createFolder(name, currentFolder === 'root' ? null : currentFolder);
            loadContents(currentFolder);
        } catch(e) {
            alert("Error creando carpeta");
        }
    };

    const handleUploadClick = () => {
        if(fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            await uploadImage(file, currentFolder);
            loadContents(currentFolder);
        } catch(e) {
            alert("Error subiendo imagen");
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
            <div className="bg-white max-w-5xl w-full h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 shrink-0 bg-slate-50">
                    <div>
                        <h2 className="text-lg font-black text-slate-800">Media Manager</h2>
                        <div className="flex gap-2 items-center text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                            {breadcrumbs.map((b, idx) => (
                                <div key={b.id} className="flex gap-2 items-center">
                                    <button 
                                        className="hover:text-emerald-600 transition-colors cursor-pointer"
                                        onClick={() => navigateToFolder(b)}
                                    >
                                        {b.id === 'root' ? <Home size={12} /> : b.nombre}
                                    </button>
                                    {idx < breadcrumbs.length - 1 && <ChevronRight size={10} />}
                                </div>
                            ))}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-700 cursor-pointer">
                        ✕
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 flex gap-3 border-b border-slate-100 shrink-0 bg-white items-center">
                    <div className="relative w-64 mr-2">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar en esta carpeta..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition-all"
                        />
                    </div>

                    <button 
                        onClick={handleCreateFolder} 
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
                    >
                        + Nueva Carpeta
                    </button>
                    <div className="h-6 w-px bg-slate-100 ml-2"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {count} imágenes · {folders.length} carpetas
                    </p>

                    <button 
                        onClick={handleUploadClick} 
                        disabled={uploading} 
                        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-slate-900/10 hover:bg-slate-800 ml-auto disabled:opacity-50 active:scale-95 transition-all flex items-center gap-2"
                    >
                        {uploading ? 'Subiendo...' : <><Upload size={14} /> Subir Archivo</>}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                            <p className="text-xs font-black uppercase tracking-widest">Cargando contenido...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
                            {folders.map(f => (
                                <button 
                                    key={f.id} 
                                    onClick={() => navigateToFolder(f)}
                                    className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer aspect-square shadow-sm group"
                                >
                                    <Folder size={40} className="text-emerald-400 fill-emerald-500/10 group-hover:scale-110 transition-transform" />
                                    <span className="text-[11px] font-bold text-slate-700 truncate w-full text-center leading-tight">{f.name}</span>
                                </button>
                            ))}

                            {images.map(img => (
                                <div 
                                    key={img.id} 
                                    className="group relative bg-white border border-slate-200 rounded-2xl overflow-hidden aspect-square cursor-pointer flex flex-col items-center justify-between hover:ring-4 hover:ring-emerald-500/20 hover:border-emerald-500 transition-all shadow-sm"
                                    onClick={() => {
                                        onSelectImage(img);
                                        onClose();
                                    }}
                                >
                                    <div className="flex-1 w-full relative overflow-hidden bg-slate-100/30">
                                        <img src={getFullImageUrl(img.url)} alt={img.name} className="absolute inset-0 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" />
                                        {img.usage?.length > 0 && (
                                            <div className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm z-10">
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
                                        <p className="text-[10px] font-bold text-slate-700 truncate w-full text-center leading-tight">
                                            {img.name}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {folders.length === 0 && images.length === 0 && (
                                <div className="col-span-full py-20 flex flex-col items-center text-slate-400 bg-white border-2 border-dashed border-slate-200 rounded-3xl w-full max-w-sm mx-auto">
                                    <ImageIcon size={48} className="mb-4 opacity-20" />
                                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Carpeta vacía</p>
                                    <p className="text-[11px] text-slate-400 mt-1">Usa el botón de arriba para subir imágenes.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Pagination */}
                {count > pageSize && (
                    <div className="px-6 py-2 border-t border-slate-100 bg-white">
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
