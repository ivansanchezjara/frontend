import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

/**
 * Unified header for all pages.
 * - Con breadcrumbs: páginas de movimientos (Ingresos, Bajas, Transferencias, Ajustes, Consignaciones)
 * - Solo title: páginas estáticas (login, about, etc.)
 *
 * @param {string}   title        - Título simple (alternativa a breadcrumbs)
 * @param {Object[]} breadcrumbs  - Array of { label, href? }. El último item se renderiza como activo.
 * @param {string}   subtitle     - Texto helper debajo del título/breadcrumbs.
 * @param {string}   subtitleClassName - Clases CSS para el subtítulo (default: "text-blue-600")
 * @param {React.ReactNode} children    - Contenido derecho (botones, stats, etc.)
 * @param {string}   className    - Clases extra para el tag header.
 */
export default function PageHeader({ title, breadcrumbs = [], subtitle, subtitleClassName = "text-blue-600", children, className = '' }) {
    const hasBreadcrumbs = breadcrumbs.length > 0;
    const hasTitle = title && !hasBreadcrumbs;

    return (
        <header
            className={`bg-white border-b border-slate-200 px-10 py-4 shrink-0 z-10 flex items-center justify-between gap-6 no-print ${className}`}
        >
            {/* Left: Title / Breadcrumbs + Subtitle */}
            <div className="min-w-0">
                {/* Título simple (sin breadcrumbs) */}
                {hasTitle && (
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                        {title}
                    </h2>
                )}

                {/* Breadcrumbs */}
                {hasBreadcrumbs && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 flex-wrap">
                        {breadcrumbs.map((crumb, i) => {
                            const isLast = i === breadcrumbs.length - 1;
                            return (
                                <span key={i} className="flex items-center gap-2">
                                    {i > 0 && <ChevronRight size={12} className="text-slate-300" />}
                                    {isLast || !crumb.href ? (
                                        <span className={isLast ? 'text-slate-700' : ''}>{crumb.label}</span>
                                    ) : (
                                        <Link
                                            href={crumb.href}
                                            className="hover:text-blue-600 transition-colors"
                                        >
                                            {crumb.label}
                                        </Link>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Subtítulo */}
                {subtitle && (
                    <p className={`text-[10px] font-bold uppercase flex items-center gap-1.5 mt-0.5 ${subtitleClassName}`}>
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Right: Actions / Stats */}
            {children && (
                <div className="flex items-center gap-6 shrink-0">
                    {children}
                </div>
            )}
        </header>
    );
}
