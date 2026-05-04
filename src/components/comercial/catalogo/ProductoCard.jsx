import { getFullImageUrl } from '@/services/api';
import Link from 'next/link';

export default function ProductoCard({ producto }) {
    const { nombre_general, general_code, brand, categoria, imagen_principal_url, variants, slug, featured } = producto;
    const cantidadVariantes = variants?.length ?? 0;
    const imagenUrl = getFullImageUrl(imagen_principal_url);

    return (
        <Link href={`/catalogo/${slug}`} className="group block h-full">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col">

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
                        <span className="absolute top-2 left-2 bg-amber-400 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide">
                            ⭐ Destacado
                        </span>
                    )}

                    {/* Badge categoría */}
                    {categoria && (
                        <span className="absolute top-2 right-2 bg-white/90 backdrop-blur text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                            {categoria.nombre}
                        </span>
                    )}
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{general_code}</p>
                        <h3 className="text-sm font-black text-slate-900 leading-tight mt-0.5 group-hover:text-emerald-600 transition-colors line-clamp-2 h-9">
                            {nombre_general}
                        </h3>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">{brand}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-4 border-t border-slate-100">
                        <span className="text-[11px] font-bold text-slate-500">
                            {cantidadVariantes} {cantidadVariantes === 1 ? 'variante' : 'variantes'}
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
