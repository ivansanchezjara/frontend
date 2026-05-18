import { getFullImageUrl } from '@/services/apis/catalogo';
import { useRouter } from 'next/navigation';
import { Badge, Text } from '@/components/ui';

export default function ProductoRow({ producto }) {
    const router = useRouter();
    const { nombre_general, general_code, brand, categoria, imagen_principal_url, variants, slug, featured } = producto;

    const cantidadVariantes = variants?.length ?? 0;
    const imagenUrl = getFullImageUrl(imagen_principal_url);

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
                            {featured && <span className="ml-2 text-amber-500 text-xs">⭐</span>}
                        </Text>
                        <Text variant="caption" className=" font-mono text-slate-400 lowercase leading-none">{general_code}</Text>
                    </div>
                </div>
            </td>

            {/* Marca */}
            <td className="py-3 px-4 whitespace-nowrap">
                <Text variant="bodySm" className="font-medium text-slate-600">
                    {brand}
                </Text>
            </td>

            {/* Categoría */}
            <td className="py-3 px-4">
                {categoria ? (
                    <Badge variant="default" className="normal-case tracking-normal">
                        {categoria.nombre}
                    </Badge>
                ) : (
                    <Text variant="bodySm" className="text-slate-300">—</Text>
                )}
            </td>

            {/* Variantes */}
            <td className="py-3 px-4 text-center">
                <Text variant="bodySm" className="font-bold text-slate-700">
                    {cantidadVariantes}
                </Text>
            </td>

            {/* Flecha */}
            <td className="py-3 pr-6 pl-4 text-right">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                    className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all inline-block">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
            </td>
        </tr>
    );
}
