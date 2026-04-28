// src/app/(sistema)/catalogo/nuevo/page.jsx
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { crearProducto, getCategorias, crearCategoria } from '@/services/api';
import LoadingScreen from '@/components/ui/LoadingScreen';
import TagsInput from '@/components/catalogo/TagsInput';
import FilerModal from '@/components/ui/FilerModal';
import AttributesEditor from '@/components/catalogo/AttributesEditor';
import { getFullImageUrl } from '@/services/api';
import { FileJson } from 'lucide-react';

// ─── Mini componentes de formulario (idénticos a [slug]/page.jsx) ──

function Section({ title, subtitle, children }) {
    return (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">{title}</h2>
                {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            {children}
        </section>
    );
}

function Field({ label, hint, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block">{label}</label>
            {children}
            {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
        </div>
    );
}

const inputClass = "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400";

function Toggle({ checked, onChange, label, description }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`relative flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left w-full ${checked ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'}`}
        >
            <div className={`w-10 h-6 rounded-full transition-all flex-shrink-0 relative ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${checked ? 'left-5' : 'left-1'}`} />
            </div>
            <div>
                <p className={`text-sm font-black ${checked ? 'text-emerald-700' : 'text-slate-600'}`}>{label}</p>
                {description && <p className={`text-xs mt-0.5 ${checked ? 'text-emerald-500' : 'text-slate-400'}`}>{description}</p>}
            </div>
        </button>
    );
}

// ─── Página ───────────────────────────────────────────────────────

const FORM_INICIAL = {
    nombre_general: '',
    general_code: '',
    brand: '',
    categoria_id: '',
    sub_category: '',
    professional_area: '',
    description: '',
    long_description: '',
    featured: false,
    is_published: false,
    tags: [],
    imagen_principal: null,
    atributos: {},
};

export default function NuevoProductoPage() {
    const router = useRouter();
    const [categorias, setCategorias] = useState([]);
    const [loadingCats, setLoadingCats] = useState(true);

    const [formData, setFormData] = useState(FORM_INICIAL);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Estado para nueva categoría
    const [isCreatingCat, setIsCreatingCat] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [savingCat, setSavingCat] = useState(false);

    // Estado del modal Filer 
    const [isFilerOpen, setIsFilerOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null); // guardamos el objeto entero para mostrar miniatura

    // Estado para Importación JSON
    const [isJSONModalOpen, setIsJSONModalOpen] = useState(false);
    const [jsonInput, setJsonInput] = useState('');

    useEffect(() => {
        getCategorias().then(cats => {
            setCategorias(cats || []);
            setLoadingCats(false);
        });
    }, []);

    const field = (key) => (value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setError(null);
    };

    const handleCrearCategoriaConfirm = async () => {
        if (!newCatName.trim()) return;
        setSavingCat(true);
        try {
            const nuevaCat = await crearCategoria(newCatName.trim());
            setCategorias([...categorias, nuevaCat]);
            field('categoria_id')(nuevaCat.id);
            setIsCreatingCat(false);
            setNewCatName('');
        } catch (err) {
            alert("Error al crear la categoría. Probá de nuevo.");
        } finally {
            setSavingCat(false);
        }
    };

    const handleJSONImport = () => {
        try {
            const data = JSON.parse(jsonInput);
            setFormData({
                ...FORM_INICIAL,
                ...data,
                categoria_id: data.categoria_id?.toString() || ''
            });
            setIsJSONModalOpen(false);
            setJsonInput('');
            alert("Datos cargados correctamente.");
        } catch (err) {
            alert("Error: El formato JSON no es válido.");
        }
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError(null);
        try {
            const nuevo = await crearProducto(formData);
            // Redirigir a la ficha del producto recién creado
            router.push(`/catalogo/${nuevo.slug}`);
        } catch (err) {
            const msg = typeof err === 'object'
                ? Object.entries(err).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')
                : 'Error al crear el producto.';
            setError(msg);
            setSaving(false);
        }
    };

    const canSubmit = formData.nombre_general.trim() !== '' && formData.general_code.trim() !== '' && !saving;

    if (loadingCats) return <LoadingScreen texto="Preparando formulario..." />;

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">

            {/* ── HEADER ── */}
            <header className="bg-white border-b border-slate-200 px-10 py-4 shrink-0 z-10 flex items-center justify-between gap-6">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Link href="/catalogo" className="hover:text-emerald-600 transition-colors">Catálogo</Link>
                        <span>/</span>
                        <span className="text-slate-700">Nuevo Producto</span>
                    </div>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5">
                        Podés agregar variantes después de crear el producto.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {error && (
                        <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200 max-w-xs truncate" title={error}>
                            ✕ {error}
                        </span>
                    )}
                    <button
                        onClick={() => setIsJSONModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all active:scale-95"
                    >
                        <FileJson size={14} /> CARGAR JSON
                    </button>
                    <Link
                        href="/catalogo"
                        className="px-4 py-2.5 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        id="btn-crear-producto"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {saving ? 'Creando...' : 'Crear Producto'}
                    </button>
                </div>
            </header>

            {/* ── CONTENIDO ── */}
            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* ── Datos generales ── */}
                    <Section title="Datos Generales">
                        <div className="p-6 grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8">

                            {/* CAJA LATERAL DE IMAGEN PRINCIPAL */}
                            <div className="flex flex-col items-center">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 w-full lg:text-left text-center">Imagen Principal</label>
                                <div className="w-full max-w-[180px] lg:max-w-none">
                                    {selectedImage ? (
                                        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square bg-white">
                                            <img src={getFullImageUrl(selectedImage.url)} className="w-full h-full object-contain" />
                                            <div className="absolute inset-x-0 bottom-0 p-3 flex justify-center bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setIsFilerOpen(true)}
                                                    className="bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm w-full hover:bg-emerald-50 transition-colors"
                                                >
                                                    Cambiar
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setIsFilerOpen(true)}
                                            className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-slate-400 hover:text-emerald-500"
                                        >
                                            <span className="text-3xl">🏜️</span>
                                            <span className="text-xs font-bold mt-1">Elegir</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* CAMPOS DE TEXTO */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
                                <div className="md:col-span-2">
                                    <Field label="Nombre del Producto *">
                                        <input
                                            autoFocus
                                            className={inputClass}
                                            value={formData.nombre_general}
                                            onChange={(e) => field('nombre_general')(e.target.value)}
                                            placeholder="Ej: Cureta Sinus"
                                        />
                                    </Field>
                                </div>

                                <Field label="Código General *" hint="Debe ser único en todo el catálogo.">
                                    <input
                                        className={`${inputClass} font-mono uppercase`}
                                        value={formData.general_code}
                                        onChange={(e) => field('general_code')(e.target.value.toUpperCase())}
                                        placeholder="Ej: TH-CU-SIN"
                                    />
                                </Field>

                                <Field label="Marca">
                                    <input
                                        className={inputClass}
                                        value={formData.brand}
                                        onChange={(e) => field('brand')(e.target.value)}
                                        placeholder="Ej: Thalys"
                                    />
                                </Field>

                                <Field label="Categoría">
                                    {!isCreatingCat ? (
                                        <div className="flex gap-2">
                                            <select
                                                className={`${inputClass} flex-1`}
                                                value={formData.categoria_id}
                                                onChange={(e) => field('categoria_id')(e.target.value)}
                                            >
                                                <option value="">Sin categoría</option>
                                                {categorias.map(c => (
                                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setIsCreatingCat(true)}
                                                className="px-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xl rounded-xl border border-emerald-200"
                                                title="Nueva Categoría"
                                            >+</button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                autoFocus
                                                placeholder="Nombre de nueva categoría..."
                                                className={`${inputClass} flex-1`}
                                                value={newCatName}
                                                onChange={e => setNewCatName(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleCrearCategoriaConfirm()}
                                            />
                                            <button
                                                type="button"
                                                disabled={savingCat}
                                                onClick={handleCrearCategoriaConfirm}
                                                className="px-3 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm rounded-xl"
                                            >
                                                ✓
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setIsCreatingCat(false); setNewCatName(''); }}
                                                className="px-3 bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold text-sm rounded-xl"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </Field>

                                <Field label="Sub-Categoría">
                                    <input
                                        className={inputClass}
                                        value={formData.sub_category}
                                        onChange={(e) => field('sub_category')(e.target.value)}
                                        placeholder="Ej: Micro-cirugía"
                                    />
                                </Field>

                                <div className="md:col-span-2">
                                    <Field label="Área Profesional">
                                        <input
                                            className={inputClass}
                                            value={formData.professional_area}
                                            onChange={(e) => field('professional_area')(e.target.value)}
                                            placeholder="Ej: Odontología, Cirugía general..."
                                        />
                                    </Field>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* ── Visibilidad ── */}
                    <Section title="Visibilidad y Atributos">
                        <div className="p-6">
                            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-xs font-medium text-blue-700 mb-4">
                                💡 El slug URL se genera automáticamente desde el nombre del producto.
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Toggle
                                    checked={formData.featured}
                                    onChange={field('featured')}
                                    label="Producto Destacado"
                                    description="Aparece resaltado en el catálogo."
                                />
                                <Toggle
                                    checked={formData.is_published}
                                    onChange={field('is_published')}
                                    label="Publicado en Web"
                                    description={formData.is_published ? 'Visible en la tienda online.' : 'No visible al público.'}
                                />
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-4 italic">
                                    ⚙️ Especificaciones Técnicas (JSON)
                                </label>
                                <AttributesEditor
                                    attributes={formData.atributos}
                                    onChange={field('atributos')}
                                />
                            </div>
                        </div>
                    </Section>

                    {/* ── Descripción ── */}
                    <Section title="Descripción y Tags">
                        <div className="p-6 space-y-5">
                            <Field label="Descripción Corta" hint={`${formData.description.length}/500 caracteres`}>
                                <textarea
                                    className={`${inputClass} resize-none`}
                                    rows={3}
                                    maxLength={500}
                                    value={formData.description}
                                    onChange={(e) => field('description')(e.target.value)}
                                    placeholder="Descripción breve del producto..."
                                />
                            </Field>

                            <Field label="Descripción Detallada">
                                <textarea
                                    className={`${inputClass} resize-none`}
                                    rows={6}
                                    value={formData.long_description}
                                    onChange={(e) => field('long_description')(e.target.value)}
                                    placeholder="Descripción completa, indicaciones clínicas, materiales, etc..."
                                />
                            </Field>

                            <Field label="Tags" hint="Enter o coma para agregar. Backspace para eliminar el último.">
                                <TagsInput tags={formData.tags} onChange={field('tags')} />
                            </Field>
                        </div>
                    </Section>

                    {/* ── Info variantes ── */}
                    <div className="bg-slate-100 border border-slate-200 rounded-2xl px-6 py-5 flex items-start gap-4">
                        <span className="text-2xl">📦</span>
                        <div>
                            <p className="text-sm font-black text-slate-700">¿Dónde agrego las variantes?</p>
                            <p className="text-xs text-slate-500 mt-1">
                                Las variantes (tallas, versiones, SKUs) se agregan <strong>después de crear el producto</strong>, desde la ficha individual. Al hacer clic en <em>"Crear Producto"</em> vas a ser redirigido directamente ahí.
                            </p>
                        </div>
                    </div>

                </div>
            </main>

            <FilerModal
                isOpen={isFilerOpen}
                onClose={() => setIsFilerOpen(false)}
                initialSearch={formData.general_code}
                onSelectImage={(img) => {
                    setSelectedImage(img);
                    field('imagen_principal')(img.id);
                    setIsFilerOpen(false);
                }}
            />

            {/* Modal de Importación JSON */}
            {isJSONModalOpen && (
                <div className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-100 bg-slate-50">
                            <h3 className="text-lg font-black text-slate-900">Importar desde JSON</h3>
                            <p className="text-xs text-slate-500 mt-1">Pegá el objeto JSON para rellenar los campos automáticamente.</p>
                        </div>
                        <div className="p-6">
                            <textarea
                                className="w-full h-64 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                                placeholder='{ "nombre_general": "Producto Ejemplo", "brand": "Marca", ... }'
                                value={jsonInput}
                                onChange={(e) => setJsonInput(e.target.value)}
                            />
                        </div>
                        <div className="px-6 pb-6 flex gap-3">
                            <button 
                                onClick={() => { setIsJSONModalOpen(false); setJsonInput(''); }}
                                className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleJSONImport}
                                className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-blue-600 transition-colors"
                            >
                                Cargar Datos
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
