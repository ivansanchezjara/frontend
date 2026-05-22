import { getFullImageUrl } from '@/services/apis/catalogo';
import Link from 'next/link';
import { Badge, Heading, Text } from '@/components/ui';

export default function ProductoCard({ producto }) {
    const { nombre_general, general_code, brand, imagen_principal_url, variants, slug, featured } = producto;
    const cantidadVariantes = variants?.length ?? 0;
    const imagenUrl = getFullImageUrl(imagen_principal_url);

    return (
        <Link href={`/catalogo/${slug}`} className="group block h-full">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col">

                {/* Imagen */}
                <div className="relative h-44 bg-slate-100 overflow-hidden shrink-0">
                    {imagenUrl ? (
                        <img
                            src={imagenUrl}
                            alt={nombre_general}
                            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-slate-300">
                            📦
                        </div>
                    )}

                    {/* Badge featured */}
                    {featured && (
                        <Badge variant="warning" className="absolute top-2 left-2 text-[10px]">
                            ⭐ Destacado
                        </Badge>
                    )}
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                    <div className="flex-1">
                        <Text variant="caption">{general_code}</Text>
                        <Heading level={5} className="text-sm mt-0.5 group-hover:text-emerald-600 transition-colors line-clamp-2 h-9 leading-tight">
                            {nombre_general}
                        </Heading>
                        <Text variant="bodySm" className="mt-0.5">{brand}</Text>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100">
                        <Text variant="bodySm" className="text-[11px] font-bold text-slate-500">
                            {cantidadVariantes} {cantidadVariantes === 1 ? 'variante' : 'variantes'}
                        </Text>
                    </div>
                </div>
            </div>
        </Link>
    );
}
