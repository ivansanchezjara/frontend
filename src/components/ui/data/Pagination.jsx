"use client";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from '../basics/Button';
import { Text } from '../basics/Typography';

/**
 * Componente Pagination estandarizado para las tablas del ERP.
 * Proporciona controles de paginación interactivos e información de registros
 * utilizando los componentes atómicos del sistema (Button, Typography).
 * 
 * @param {Object} props
 * @param {Number} props.count - Total de registros disponibles en la base de datos
 * @param {Number} props.pageSize - Cantidad de registros mostrados por página
 * @param {Number} props.currentPage - Índice de la página actual (1-indexed)
 * @param {Function} props.onPageChange - Callback llamado al cambiar de página
 */
export default function Pagination({ count, pageSize, currentPage, onPageChange }) {
    const totalPages = Math.ceil(count / pageSize);

    if (totalPages <= 1) return null;

    // Calcular límites para el mensaje informativo
    const from = Math.min((currentPage - 1) * pageSize + 1, count);
    const to = Math.min(currentPage * pageSize, count);

    const getPages = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 w-full select-none">
            {/* Info de registros en formato atómico */}
            <Text variant="bodyXs" className="text-slate-500 font-semibold">
                Mostrando <span className="font-extrabold text-slate-800">{from}</span> al <span className="font-extrabold text-slate-800">{to}</span> de <span className="font-extrabold text-slate-800">{count}</span> registros
            </Text>

            {/* Controles de paginación */}
            <div className="flex items-center gap-1.5">
                {/* Botón Anterior */}
                <Button
                    variant="outline"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    icon={ChevronLeft}
                    className="w-10 h-10 p-0 rounded-xl hover:border-emerald-200 hover:text-emerald-600 transition-all shadow-sm active:scale-90 shrink-0"
                    title="Página anterior"
                />

                {/* Primera página */}
                {getPages()[0] > 1 && (
                    <>
                        <Button
                            variant={currentPage === 1 ? 'success' : 'outline'}
                            onClick={() => onPageChange(1)}
                            className={`w-10 h-10 p-0 rounded-xl font-bold text-xs transition-all ${
                                currentPage === 1 
                                    ? 'shadow-lg shadow-emerald-500/20' 
                                    : 'text-slate-600 hover:border-emerald-200 hover:text-emerald-600 hover:bg-slate-50'
                            }`}
                        >
                            1
                        </Button>
                        {getPages()[0] > 2 && (
                            <span className="text-slate-300 text-xs px-1 font-extrabold select-none">
                                ...
                            </span>
                        )}
                    </>
                )}

                {/* Páginas del grupo central */}
                {getPages().map(page => (
                    <Button
                        key={page}
                        variant={currentPage === page ? 'success' : 'outline'}
                        onClick={() => onPageChange(page)}
                        className={`w-10 h-10 p-0 rounded-xl font-bold text-xs transition-all ${
                            currentPage === page 
                                ? 'shadow-lg shadow-emerald-500/20' 
                                : 'text-slate-600 hover:border-emerald-200 hover:text-emerald-600 hover:bg-slate-50'
                        }`}
                    >
                        {page}
                    </Button>
                ))}

                {/* Última página */}
                {getPages()[getPages().length - 1] < totalPages && (
                    <>
                        {getPages()[getPages().length - 1] < totalPages - 1 && (
                            <span className="text-slate-300 text-xs px-1 font-extrabold select-none">
                                ...
                            </span>
                        )}
                        <Button
                            variant={currentPage === totalPages ? 'success' : 'outline'}
                            onClick={() => onPageChange(totalPages)}
                            className={`w-10 h-10 p-0 rounded-xl font-bold text-xs transition-all ${
                                currentPage === totalPages 
                                    ? 'shadow-lg shadow-emerald-500/20' 
                                    : 'text-slate-600 hover:border-emerald-200 hover:text-emerald-600 hover:bg-slate-50'
                            }`}
                        >
                            {totalPages}
                        </Button>
                    </>
                )}

                {/* Botón Siguiente */}
                <Button
                    variant="outline"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    icon={ChevronRight}
                    className="w-10 h-10 p-0 rounded-xl hover:border-emerald-200 hover:text-emerald-600 transition-all shadow-sm active:scale-90 shrink-0"
                    title="Página siguiente"
                />
            </div>
        </div>
    );
}
