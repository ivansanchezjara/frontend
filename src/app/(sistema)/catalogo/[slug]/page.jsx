// src/app/(sistema)/catalogo/[slug]/page.jsx
"use client";
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import {
    getProducto, getCategorias,
    actualizarProducto,
    crearVariante, actualizarVariante, eliminarVariante,
} from '@/services/api';
import LoadingScreen from '@/components/ui/LoadingScreen';
import TagsInput from '@/components/catalogo/TagsInput';

// ─── Mini componentes de formulario ──────────────────────────────

function Section({ title, subtitle, children }) {
    return (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">{title}</h2>
                    {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
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

// ─── Modal de Variante ────────────────────────────────────────────

function VarianteModal({ variante, productoId, onClose, onSave }) {
    const isNew = !variante?.id;
    const autoSlugify = (text) =>
        text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const [form, setForm] = useState({
        nombre_variante: variante?.nombre_variante || '',
        product_code: variante?.product_code || '',
        sub_slug: variante?.sub_slug || '',
    });
    const [slugTouched, setSlugTouched] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleNombre = (value) => {
        setForm(prev => ({
            ...prev,
            nombre_variante: value,
            sub_slug: !slugTouched ? autoSlugify(value) : prev.sub_slug,
        }));
    };

    const handleSubmit = async () => {
        setSaving(true);
        setError(null);
        try {
            const payload = isNew ? { ...form, producto_padre: productoId } : form;
            const result = isNew
                ? await crearVariante(payload)
                : await actualizarVariante(variante.id, form);
            onSave(result, isNew);
        } catch (err) {
            const msg = typeof err === 'object'
                ? Object.entries(err).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')
                : 'Error al guardar.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const canSubmit = form.nombre_variante.trim() && form.product_code.trim() && !saving;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md z-10">
                {/* Header */}
                <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                    <h3 className="text-lg font-black text-slate-900">
                        {isNew ? 'Nueva Variante' : 'Editar Variante'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Los precios se gestionan desde <strong>Inventario y Precios</strong>.
                    </p>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-xs font-medium">
                            {error}
                        </div>
                    )}

                    <Field label="Nombre de la Variante">
                        <input
                            autoFocus
                            className={inputClass}
                            placeholder="Ej: #1 Mini Extra-Flex"
                            value={form.nombre_variante}
                            onChange={(e) => handleNombre(e.target.value)}
                        />
                    </Field>

                    <Field label="Código SKU" hint="Debe ser único en todo el catálogo.">
                        <input
                            className={`${inputClass} font-mono`}
                            placeholder="Ej: TH-CU-001"
                            value={form.product_code}
                            onChange={(e) => setForm(p => ({ ...p, product_code: e.target.value.toUpperCase() }))}
                        />
                    </Field>

                    <Field label="Sub-Slug (URL)" hint="Se auto-genera desde el nombre. Podés editarlo manualmente.">
                        <input
                            className={`${inputClass} font-mono`}
                            placeholder="Ej: 1-mini-extra-flex"
                            value={form.sub_slug}
                            onChange={(e) => { setSlugTouched(true); setForm(p => ({ ...p, sub_slug: e.target.value })); }}
                        />
                    </Field>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex gap-3">
                    <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm cursor-pointer">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {saving ? 'Guardando...' : isNew ? 'Crear Variante' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Página principal ─────────────────────────────────────────────

export default function FichaProductoPage() {
    const { slug } = useParams();

    const [producto, setProducto] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    // Formulario
    const [formData, setFormData] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Variantes
    const [varianteModal, setVarianteModal] = useState(null); // null | 'new' | {variante}
    const [deletingId, setDeletingId] = useState(null);

    // ── Carga inicial ──
    useEffect(() => {
        async function fetch() {
            try {
                const [prod, cats] = await Promise.all([getProducto(slug), getCategorias()]);
                if (!prod) { setNotFound(true); return; }
                setProducto(prod);
                setFormData({
                    nombre_general: prod.nombre_general || '',
                    general_code: prod.general_code || '',
                    brand: prod.brand || '',
                    categoria_id: prod.categoria?.id ?? '',
                    sub_category: prod.sub_category || '',
                    professional_area: prod.professional_area || '',
                    description: prod.description || '',
                    long_description: prod.long_description || '',
                    featured: prod.featured ?? false,
                    is_published: prod.is_published ?? false,
                    tags: prod.tags || [],
                });
                setCategorias(cats);
            } catch {
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        }
        fetch();
    }, [slug]);

    // ── Helpers de formulario ──
    const field = (key) => (value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
        setIsDirty(true);
        setSaveError(null);
        setSaveSuccess(false);
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError(null);
        try {
            const updated = await actualizarProducto(slug, formData);
            setProducto(updated);
            setIsDirty(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            const msg = typeof err === 'object'
                ? Object.entries(err).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ')
                : 'Error al guardar.';
            setSaveError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleVarianteSaved = (guardada, isNew) => {
        setProducto(prev => ({
            ...prev,
            variants: isNew
                ? [...prev.variants, guardada]
                : prev.variants.map(v => v.id === guardada.id ? guardada : v),
        }));
        setVarianteModal(null);
    };

    const handleDeleteVariante = async (id) => {
        if (!confirm('¿Eliminar esta variante? Esta acción no se puede deshacer.')) return;
        setDeletingId(id);
        try {
            await eliminarVariante(id);
            setProducto(prev => ({ ...prev, variants: prev.variants.filter(v => v.id !== id) }));
        } catch {
            alert('No se pudo eliminar la variante.');
        } finally {
            setDeletingId(null);
        }
    };

    // ── Estados de carga / error ──
    if (loading) return <LoadingScreen texto="Cargando ficha del producto..." />;

    if (notFound) return (
        <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
                <p className="text-5xl mb-4">🔍</p>
                <h2 className="text-xl font-black text-slate-900">Producto no encontrado</h2>
                <p className="text-slate-400 mt-2 text-sm">El producto "{slug}" no existe en el catálogo.</p>
                <Link href="/catalogo" className="mt-6 inline-block bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors">
                    ← Volver al Catálogo
                </Link>
            </div>
        </div>
    );

    return (
        <>
            {/* Modal variante */}
            {varianteModal !== null && (
                <VarianteModal
                    variante={varianteModal === 'new' ? null : varianteModal}
                    productoId={producto.id}
                    onClose={() => setVarianteModal(null)}
                    onSave={handleVarianteSaved}
                />
            )}

            <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">

                {/* ── HEADER ── */}
                <header className="bg-white border-b border-slate-200 px-10 py-4 shrink-0 z-10 flex items-center justify-between gap-6">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <Link href="/catalogo" className="hover:text-emerald-600 transition-colors">Catálogo</Link>
                            <span>/</span>
                            <span className="text-slate-700 truncate">{producto.nombre_general}</span>
                        </div>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5 font-mono">{producto.slug}</p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        {saveSuccess && (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                                ✓ Cambios guardados
                            </span>
                        )}
                        {saveError && (
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-200 max-w-xs truncate" title={saveError}>
                                ✕ {saveError}
                            </span>
                        )}
                        <button
                            id="btn-guardar-producto"
                            onClick={handleSave}
                            disabled={!isDirty || saving}
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all shadow-lg active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </header>

                {/* ── CONTENIDO ── */}
                <main className="flex-1 overflow-y-auto p-8 min-w-0">
                    <div className="max-w-4xl mx-auto space-y-6">

                        {/* ── Datos generales ── */}
                        <Section title="Datos Generales">
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2">
                                    <Field label="Nombre del Producto">
                                        <input className={inputClass} value={formData.nombre_general} onChange={(e) => field('nombre_general')(e.target.value)} placeholder="Ej: Cureta Sinus" />
                                    </Field>
                                </div>

                                <Field label="Código General">
                                    <input className={`${inputClass} font-mono uppercase`} value={formData.general_code} onChange={(e) => field('general_code')(e.target.value)} placeholder="Ej: TH-CU-SIN" />
                                </Field>

                                <Field label="Marca">
                                    <input className={inputClass} value={formData.brand} onChange={(e) => field('brand')(e.target.value)} placeholder="Ej: Thalys" />
                                </Field>

                                <Field label="Categoría">
                                    <select
                                        className={inputClass}
                                        value={formData.categoria_id}
                                        onChange={(e) => field('categoria_id')(e.target.value)}
                                    >
                                        <option value="">Sin categoría</option>
                                        {categorias.map(c => (
                                            <option key={c.id} value={c.id}>{c.nombre}</option>
                                        ))}
                                    </select>
                                </Field>

                                <Field label="Sub-Categoría">
                                    <input className={inputClass} value={formData.sub_category} onChange={(e) => field('sub_category')(e.target.value)} placeholder="Ej: Micro-cirugía" />
                                </Field>

                                <div className="md:col-span-2">
                                    <Field label="Área Profesional">
                                        <input className={inputClass} value={formData.professional_area} onChange={(e) => field('professional_area')(e.target.value)} placeholder="Ej: Odontología, Cirugía general..." />
                                    </Field>
                                </div>
                            </div>
                        </Section>

                        {/* ── Visibilidad ── */}
                        <Section title="Visibilidad y Atributos">
                            <div className="p-6 space-y-4">
                                <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Slug:</span>
                                    <code className="text-xs font-mono font-bold text-blue-600">{producto.slug}</code>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <Toggle checked={formData.featured} onChange={field('featured')} label="Producto Destacado" description="Aparece resaltado en el catálogo." />
                                    <Toggle checked={formData.is_published} onChange={field('is_published')} label="Publicado en Web" description={formData.is_published ? 'Visible en la tienda online.' : 'No visible al público.'} />
                                </div>
                            </div>
                        </Section>

                        {/* ── Descripción ── */}
                        <Section title="Descripción y Tags">
                            <div className="p-6 space-y-5">
                                <Field label="Descripción Corta" hint={`${formData.description.length}/500 caracteres`}>
                                    <textarea className={`${inputClass} resize-none`} rows={3} maxLength={500} value={formData.description} onChange={(e) => field('description')(e.target.value)} placeholder="Descripción breve del producto..." />
                                </Field>

                                <Field label="Descripción Detallada">
                                    <textarea className={`${inputClass} resize-none`} rows={6} value={formData.long_description} onChange={(e) => field('long_description')(e.target.value)} placeholder="Descripción completa, indicaciones clínicas, materiales, etc..." />
                                </Field>

                                <Field label="Tags" hint="Enter o coma para agregar. Backspace para eliminar el último.">
                                    <TagsInput tags={formData.tags} onChange={field('tags')} />
                                </Field>
                            </div>
                        </Section>

                        {/* ── Variantes ── */}
                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest">Variantes del Producto</h2>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Precios y costos → <strong>Inventario y Precios</strong></p>
                                </div>
                                <button
                                    id="btn-nueva-variante"
                                    onClick={() => setVarianteModal('new')}
                                    className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-emerald-600 transition-all active:scale-95 cursor-pointer"
                                >
                                    + Nueva Variante
                                </button>
                            </div>

                            {producto.variants.length === 0 ? (
                                <div className="p-12 text-center">
                                    <p className="text-4xl mb-3">📦</p>
                                    <p className="text-sm font-bold text-slate-400">Este producto no tiene variantes todavía.</p>
                                    <button onClick={() => setVarianteModal('new')} className="mt-4 text-xs font-bold text-blue-600 hover:underline cursor-pointer">
                                        + Agregar primera variante
                                    </button>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-400">
                                            <th className="py-3 pl-6 pr-4 text-[11px] font-black uppercase tracking-widest">Nombre</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest">Código SKU</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest hidden md:table-cell">Sub-Slug</th>
                                            <th className="py-3 px-4 text-[11px] font-black uppercase tracking-widest text-right">Stock</th>
                                            <th className="py-3 pr-5 pl-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {producto.variants.map(v => {
                                            const stock = v.stock ?? 0;
                                            const stockColor = stock === 0
                                                ? 'text-red-600 bg-red-50'
                                                : stock < 10
                                                    ? 'text-amber-700 bg-amber-50'
                                                    : 'text-emerald-700 bg-emerald-50';
                                            return (
                                                <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                    <td className="py-3.5 pl-6 pr-4 text-sm font-bold text-slate-800">{v.nombre_variante}</td>
                                                    <td className="py-3.5 px-4">
                                                        <code className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded-lg">{v.product_code}</code>
                                                    </td>
                                                    <td className="py-3.5 px-4 hidden md:table-cell">
                                                        <span className="text-xs text-slate-400 font-mono">{v.sub_slug}</span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-right">
                                                        <span className={`text-xs font-black px-2.5 py-1 rounded-full ${stockColor}`}>
                                                            {stock === 0 ? 'Sin stock' : `${stock} u.`}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 pr-5 pl-4">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => setVarianteModal(v)}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                                                                title="Editar variante"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteVariante(v.id)}
                                                                disabled={deletingId === v.id}
                                                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 cursor-pointer"
                                                                title="Eliminar variante"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </section>

                    </div>
                </main>
            </div>
        </>
    );
}
