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
        <div className="flex flex-col items-center justify-center gap-4 pt-8 w-full select-none">

            {/* Controles de paginación tipo píldora */}
            <div className="flex items-center gap-1 bg-white p-1.5 rounded-full shadow-sm border border-slate-200/60">

                {/* Botón Anterior */}
                <Button
                    variant="ghost"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    icon={ChevronLeft}
                    className="w-9 h-9 p-0 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50 transition-all shrink-0"
                    title="Página anterior"
                />

                {/* Primera página */}
                {getPages()[0] > 1 && (
                    <>
                        <Button
                            onClick={() => onPageChange(1)}
                            className={`w-9 h-9 p-0 rounded-full font-bold text-xs transition-all ${currentPage === 1
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                        >
                            1
                        </Button>
                        {getPages()[0] > 2 && (
                            <span className="text-slate-300 text-xs px-1 font-bold">...</span>
                        )}
                    </>
                )}

                {/* Páginas del grupo central */}
                {getPages().map(page => (
                    <Button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`w-9 h-9 p-0 rounded-full font-bold text-xs transition-all ${currentPage === page
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                    >
                        {page}
                    </Button>
                ))}

                {/* Última página */}
                {getPages()[getPages().length - 1] < totalPages && (
                    <>
                        {getPages()[getPages().length - 1] < totalPages - 1 && (
                            <span className="text-slate-300 text-xs px-1 font-bold">...</span>
                        )}
                        <Button
                            onClick={() => onPageChange(totalPages)}
                            className={`w-9 h-9 p-0 rounded-full font-bold text-xs transition-all ${currentPage === totalPages
                                    ? 'bg-slate-900 text-white shadow-md'
                                    : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                        >
                            {totalPages}
                        </Button>
                    </>
                )}

                {/* Botón Siguiente */}
                <Button
                    variant="ghost"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    icon={ChevronRight}
                    className="w-9 h-9 p-0 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50 transition-all shrink-0"
                    title="Página siguiente"
                />
            </div>

            {/* Info de registros centrada abajo */}
            <Text variant="bodyXs" className="text-slate-400 font-medium">
                Mostrando <span className="font-bold text-slate-700">{from}</span> al <span className="font-bold text-slate-700">{to}</span> de <span className="font-bold text-slate-700">{count}</span> registros
            </Text>

        </div>
    );
}
