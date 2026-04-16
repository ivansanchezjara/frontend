"use client";
import { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import { getFullImageUrl } from '@/services/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

function authHeaders() {
    return { 'Authorization': `Bearer ${Cookies.get('token')}` };
}

export default function FilerModal({ isOpen, onClose, onSelectImage }) {
    const [currentFolder, setCurrentFolder] = useState('root');
    const [folders, setFolders] = useState([]);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Navigation breadcrumbs
    const [breadcrumbs, setBreadcrumbs] = useState([{ id: 'root', name: 'Media Raíz' }]);

    const loadContents = async (folderId) => {
        setLoading(true);
        try {
            const fRes = await fetch(`${API_URL}/api/filer/folders/?parent=${folderId}`, { headers: authHeaders() });
            const fData = await fRes.json();
            setFolders(fData.results || fData);

            const iRes = await fetch(`${API_URL}/api/filer/images/?folder=${folderId}`, { headers: authHeaders() });
            const iData = await iRes.json();
            setImages(iData.results || iData);
        } catch (e) {
            console.error("Error loading filer contents", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadContents(currentFolder);
        }
    }, [isOpen, currentFolder]);

    const handleCreateFolder = async () => {
        const name = prompt("Nombre de nueva carpeta:");
        if (!name) return;
        
        try {
            await fetch(`${API_URL}/api/filer/folders/`, {
                method: 'POST',
                headers: { ...authHeaders(), 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, parent: currentFolder === 'root' ? null : currentFolder })
            });
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

        const formData = new FormData();
        formData.append('file', file);
        if (currentFolder !== 'root') {
            formData.append('folder', currentFolder);
        }

        setUploading(true);
        try {
            await fetch(`${API_URL}/api/filer/images/`, {
                method: 'POST',
                headers: authHeaders(),
                body: formData
            });
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
            setBreadcrumbs([...breadcrumbs, { id: folder.id, name: folder.name }]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
            <div className="bg-white max-w-5xl w-full h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 shrink-0 bg-slate-50">
                    <div>
                        <h2 className="text-lg font-black text-slate-800">Media Manager</h2>
                        <div className="flex gap-2 items-center text-xs font-semibold text-slate-500 mt-1">
                            {breadcrumbs.map((b, idx) => (
                                <div key={b.id} className="flex gap-2 items-center">
                                    <button 
                                        className="hover:text-emerald-600 transition-colors cursor-pointer"
                                        onClick={() => navigateToFolder(b)}
                                    >
                                        {b.name}
                                    </button>
                                    {idx < breadcrumbs.length - 1 && <span>/</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-700 cursor-pointer">
                        ✕
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 flex gap-3 border-b border-slate-100 shrink-0 bg-white">
                    <button onClick={handleCreateFolder} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 cursor-pointer">
                        + Nueva Carpeta
                    </button>
                    <button onClick={handleUploadClick} disabled={uploading} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm shadow-emerald-600/20 hover:bg-emerald-700 ml-auto disabled:opacity-50 cursor-pointer">
                        {uploading ? 'Subiendo...' : 'Subir Archivo'}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {loading ? (
                        <div className="flex justify-center py-20 text-slate-400 font-bold">Cargando...</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
                            {folders.map(f => (
                                <button 
                                    key={f.id} 
                                    onClick={() => navigateToFolder(f)}
                                    className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 hover:bg-emerald-50 hover:border-emerald-300 transition-all cursor-pointer aspect-square shadow-sm"
                                >
                                    <span className="text-[3rem] leading-none block">📁</span>
                                    <span className="text-xs font-bold text-slate-600 truncate w-full text-center leading-tight">{f.name}</span>
                                </button>
                            ))}

                            {images.map(img => (
                                <div 
                                    key={img.id} 
                                    className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden aspect-square cursor-pointer flex flex-col items-center justify-center hover:ring-4 hover:ring-emerald-500/20 hover:border-emerald-500 transition-all shadow-sm"
                                    onClick={() => {
                                        onSelectImage(img);
                                        onClose();
                                    }}
                                >
                                    <img src={getFullImageUrl(img.url)} alt={img.name} className="absolute inset-0 w-full h-full object-contain transition-transform group-hover:scale-[1.02] duration-500 p-2" />
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end h-full">
                                        <button className="bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-4 py-2 rounded-lg mb-3 shadow-sm transition-colors w-full cursor-pointer">
                                            Seleccionar
                                        </button>
                                        <span className="text-[10px] text-white/90 truncate w-full text-center leading-tight px-1 font-medium">
                                            {img.name}
                                        </span>
                                    </div>
                                </div>
                            ))}

                            {folders.length === 0 && images.length === 0 && (
                                <div className="col-span-full py-20 flex flex-col items-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl w-full max-w-sm mx-auto">
                                    <span className="text-4xl mb-3 opacity-50">📭</span>
                                    <p className="text-sm font-bold text-slate-500">Carpeta vacía</p>
                                    <p className="text-xs text-slate-400 mt-1">Usa el botón de arriba para subir imágenes.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
