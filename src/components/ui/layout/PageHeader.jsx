import { cn } from "@/lib/utils";
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Text } from '@/components/ui/basics/Typography';

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
            className={cn("bg-white border-b border-slate-200 px-10 py-4 shrink-0 z-10 flex items-center justify-between gap-6 no-print", className)}
        >
            {/* Left: Title / Breadcrumbs + Subtitle */}
            <div className="min-w-0">
                {/* Título simple (sin breadcrumbs) */}
                {hasTitle && (
                    <Text variant="label" as="h2" className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                        {title}
                    </Text>
                )}

                {/* Breadcrumbs */}
                {hasBreadcrumbs && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {breadcrumbs.length > 2 ? (
                            <>
                                <span className="flex items-center gap-2">
                                    <Text as="span" variant="mutedXs">...</Text>
                                    <ChevronRight size={12} className="text-slate-300" />
                                </span>
                                <span className="flex items-center gap-2">
                                    {breadcrumbs[breadcrumbs.length - 2].href ? (
                                        <Link href={breadcrumbs[breadcrumbs.length - 2].href} className="hover:text-blue-600 transition-colors">
                                            <Text as="span" variant="mutedXs">{breadcrumbs[breadcrumbs.length - 2].label}</Text>
                                        </Link>
                                    ) : (
                                        <Text as="span" variant="mutedXs">{breadcrumbs[breadcrumbs.length - 2].label}</Text>
                                    )}
                                    <ChevronRight size={12} className="text-slate-300" />
                                </span>
                                <span className="flex items-center gap-2">
                                    <Text as="span" variant="bodyXsBold" className="text-slate-700">{breadcrumbs[breadcrumbs.length - 1].label}</Text>
                                </span>
                            </>
                        ) : (
                            breadcrumbs.map((crumb, i) => {
                                const isLast = i === breadcrumbs.length - 1;
                                return (
                                    <span key={i} className="flex items-center gap-2">
                                        {i > 0 && <ChevronRight size={12} className="text-slate-300" />}
                                        {isLast || !crumb.href ? (
                                            <Text as="span" variant={isLast ? "bodyXsBold" : "mutedXs"} className={isLast ? "text-slate-700" : ""}>
                                                {crumb.label}
                                            </Text>
                                        ) : (
                                            <Link href={crumb.href} className="hover:text-blue-600 transition-colors">
                                                <Text as="span" variant="mutedXs">{crumb.label}</Text>
                                            </Link>
                                        )}
                                    </span>
                                );
                            })
                        )}
                    </div>
                )}

                {/* Subtítulo */}
                {subtitle && (
                    <div className={cn("text-[10px] font-bold uppercase flex items-center gap-1.5 mt-1", subtitleClassName)}>
                        {subtitle}
                    </div>
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
