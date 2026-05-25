"use client";
import { getFullImageUrl, toggleProductoField } from '@/services/apis/catalogo';
import { useRouter } from 'next/navigation';
import { Text, useToast } from '@/components/ui';
import { ChevronRight, Globe, Star } from 'lucide-react';
import { useState } from 'react';

function InlineToggle({ checked, onChange, loading, icon: Icon, activeColor = 'emerald' }) {
    const colorMap = {
        emerald: {
            bg: 'bg-emerald-100',
            text: 'text-emerald-600',
            ring: 'ring-emerald-200',
        },
        amber: {
            bg: 'bg-amber-100',
            text: 'text-amber-600',
            ring: 'ring-amber-200',
        },
    };
    const colors = colorMap[activeColor];

    return (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                if (!loading) onChange(!checked);
            }}
            disabled={loading}
            className={`
                w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer
                ${loading ? 'opacity-50 cursor-wait' : ''}
                ${checked
                    ? `${colors.bg} ${colors.text} ring-1 ${colors.ring}`
                    : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-400'
                }
            `}
            title={checked ? 'Activo — clic para desactivar' : 'Inactivo — clic para activar'}
        >
            <Icon className="w-4 h-4" />
        </button>
    );
}

export default function ProductoRow({ producto, onToggle }) {
    const router = useRouter();
    const { showToast } = useToast();
    const { nombre_general, general_code, brand, imagen_principal_url, variants, slug, featured, is_published } = producto;

    const cantidadVariantes = variants?.length ?? 0;
    const imagenUrl = getFullImageUrl(imagen_principal_url);

    const [localPublished, setLocalPublished] = useState(is_published);
    const [localFeatured, setLocalFeatured] = useState(featured);
    const [loadingPublished, setLoadingPublished] = useState(false);
    const [loadingFeatured, setLoadingFeatured] = useState(false);

    const handleToggle = async (field, currentValue, setLocal, setLoading) => {
        const newValue = !currentValue;
        setLoading(true);
        setLocal(newValue); // Optimistic update
        try {
            await toggleProductoField(slug, field, newValue);
            const label = field === 'is_published' ? 'Publicación web' : 'Destacado';
            showToast(`${label} ${newValue ? 'activado' : 'desactivado'}`, 'success', 3000);
            if (onToggle) onToggle(slug, field, newValue);
        } catch {
            setLocal(currentValue); // Revert on error
            showToast('Error al actualizar el producto', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <tr
            onClick={() => router.push(`/catalogo/${slug}`)}
            className="border-t border-slate-100 hover:bg-emerald-50/50 transition-colors cursor-pointer group"
        >

            {/* Imagen + Nombre */}
            <td className="py-3 pl-6 pr-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden">
                        {imagenUrl ? (
                            <img src={imagenUrl} alt={nombre_general} className="w-full h-full object-contain p-1" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300 text-lg">📦</div>
                        )}
                    </div>
                    <div>
                        <Text variant="bodySm" className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight">
                            {nombre_general}
                        </Text>
                        <Text variant="mono" className="leading-none">{general_code}</Text>
                    </div>
                </div>
            </td>

            {/* Marca */}
            <td className="py-3 px-4 whitespace-nowrap">
                <Text variant="bodySm">
                    {brand}
                </Text>
            </td>

            {/* Web (Publicado) */}
            <td className="py-3 px-4 text-center hidden md:table-cell">
                <div className="flex justify-center">
                    <InlineToggle
                        checked={localPublished}
                        onChange={() => handleToggle('is_published', localPublished, setLocalPublished, setLoadingPublished)}
                        loading={loadingPublished}
                        icon={Globe}
                        activeColor="emerald"
                    />
                </div>
            </td>

            {/* Destacado */}
            <td className="py-3 px-4 text-center hidden md:table-cell">
                <div className="flex justify-center">
                    <InlineToggle
                        checked={localFeatured}
                        onChange={() => handleToggle('featured', localFeatured, setLocalFeatured, setLoadingFeatured)}
                        loading={loadingFeatured}
                        icon={Star}
                        activeColor="amber"
                    />
                </div>
            </td>

            {/* Variantes */}
            <td className="py-3 px-4 text-center">
                <Text variant="bodySmBold">
                    {cantidadVariantes}
                </Text>
            </td>

            {/* Flecha */}
            <td className="py-3 pr-6 pl-4 text-right">
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all inline-block" />
            </td>
        </tr>
    );
}
