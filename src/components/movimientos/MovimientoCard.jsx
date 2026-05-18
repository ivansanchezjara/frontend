"use client";
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    CheckCircle,
    XCircle,
    Clock,
    Edit3,
    Settings,
    X,
    Check,
    Loader2
} from 'lucide-react';

export default function MovimientoCard({
    id,
    estado,
    titulo,
    subtitulo,
    info = [], // Array of { icon: IconComponent, label: string }
    badges = [], // Array of { label: string, className: string }
    onClick,
    href,
    onApprove,
    onReject,
    onEditHref,
    isAprobando = false,
    isRechazando = false,
    approveLabel = "Aprobar",
    customIcon: CustomIcon,
    showActions = true
}) {
    const router = useRouter();
    const [showModal, setShowModal] = useState(false);

    // Colores según estado
    const statusConfig = {
        APROBADO: {
            bg: 'bg-emerald-50',
            text: 'text-emerald-600',
            border: 'border-emerald-100',
            badge: 'bg-emerald-100 text-emerald-700',
            icon: CheckCircle
        },
        RECHAZADO: {
            bg: 'bg-rose-50',
            text: 'text-rose-600',
            border: 'border-rose-100',
            badge: 'bg-rose-100 text-rose-700',
            icon: XCircle
        },
        BORRADOR: {
            bg: 'bg-amber-50',
            text: 'text-amber-600',
            border: 'border-amber-100',
            badge: 'bg-amber-100 text-amber-700',
            icon: Clock
        }
    };

    const config = statusConfig[estado] || statusConfig.BORRADOR;
    const StatusIcon = CustomIcon || config.icon;

    const CardWrapper = ({ children }) => {
        const className = "bg-white p-5 md:p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 group flex flex-col md:flex-row items-center gap-5 md:gap-6 cursor-pointer w-full text-left";

        const handleCardClick = (e) => {
            if (href) {
                router.push(href);
            } else if (onClick) {
                onClick(e);
            }
        };

        return (
            <div onClick={handleCardClick} className={className}>
                {children}
            </div>
        );
    };

    return (
        <>
            <CardWrapper>
                {/* Icono de Estado */}
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm border ${config.bg} ${config.text} ${config.border} transition-transform duration-300 group-hover:scale-105`}>
                    <StatusIcon size={24} className={estado === 'BORRADOR' && !CustomIcon ? 'animate-pulse' : ''} />
                </div>

                {/* Info Principal */}
                <div className="flex-1 min-w-0 text-center md:text-left w-full">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID #{id}</span>
                        <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${config.badge}`}>
                            {estado}
                        </span>
                        {badges.map((badge, idx) => (
                            <span key={idx} className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badge.className || 'bg-slate-100 text-slate-600'}`}>
                                {badge.label}
                            </span>
                        ))}
                    </div>

                    <h3 className="text-base md:text-lg font-bold text-slate-800 truncate tracking-tight group-hover:text-blue-600 transition-colors">
                        {titulo}
                    </h3>

                    {subtitulo && (
                        <p className="text-slate-500 text-xs font-normal mt-1 italic truncate max-w-2xl">
                            "{subtitulo}"
                        </p>
                    )}

                    <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-5 mt-2.5 text-slate-500 font-medium text-xs">
                        {info.map((item, idx) => (
                            <span key={idx} className="flex items-center gap-1.5">
                                {item.icon && <item.icon size={14} className="text-slate-400" />}
                                {item.label}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Acciones en la tarjeta (Botón para abrir Modal) */}
                {showActions && estado === 'BORRADOR' && (
                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-3 shrink-0 w-full md:w-auto mt-4 md:mt-0" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowModal(true);
                            }}
                            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-slate-800 border border-slate-200 rounded-xl transition-all duration-200 flex items-center gap-2 text-xs font-semibold shrink-0 shadow-sm group/btn"
                        >
                            <Settings size={14} className="text-slate-400 group-hover/btn:rotate-45 transition-transform duration-300" />
                            <span>Gestionar</span>
                        </button>
                    </div>
                )}
            </CardWrapper>

            {/* Modal de Acciones */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowModal(false);
                    }}
                >
                    <div
                        className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden transition-all duration-300 transform scale-100"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                    >
                        {/* Cabecera del Modal */}
                        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${config.bg} ${config.text} ${config.border}`}>
                                    <StatusIcon size={20} />
                                </div>
                                <div className="text-left">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ID #{id}</span>
                                    <h3 className="text-base font-bold text-slate-800">Gestionar Movimiento</h3>
                                </div>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowModal(false);
                                }}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Cuerpo del Modal */}
                        <div className="p-6 space-y-4 text-left">
                            <div className="flex flex-wrap gap-2">
                                <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${config.badge}`}>
                                    {estado}
                                </span>
                                {badges.map((badge, idx) => (
                                    <span key={idx} className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badge.className || 'bg-slate-100 text-slate-600'}`}>
                                        {badge.label}
                                    </span>
                                ))}
                            </div>

                            <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                                {titulo}
                            </h4>

                            {subtitulo && (
                                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Observaciones / Detalles</span>
                                    <p className="text-slate-600 text-xs font-normal italic">
                                        "{subtitulo}"
                                    </p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3.5 pt-2">
                                {info.map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-slate-500 font-medium text-xs bg-slate-50/50 p-2.5 rounded-xl border border-slate-100/50">
                                        {item.icon && <item.icon size={15} className="text-slate-400 shrink-0" />}
                                        <span className="truncate">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Pie del Modal (Acciones) */}
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-end gap-2.5">
                            {onEditHref && (
                                <Link
                                    href={onEditHref}
                                    onClick={() => setShowModal(false)}
                                    className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-xs font-semibold shrink-0 shadow-sm text-center"
                                >
                                    <Edit3 size={14} className="text-slate-500" />
                                    <span>Editar Borrador</span>
                                </Link>
                            )}

                            {onReject && (
                                <button
                                    onClick={(e) => {
                                        onReject(id, e);
                                        // Dejamos que el modal se actualice al cambiar el estado de la lista
                                    }}
                                    disabled={isAprobando || isRechazando}
                                    className="w-full sm:w-auto bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-600 border border-rose-100 hover:border-rose-200 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-xs font-semibold disabled:opacity-50 disabled:pointer-events-none shrink-0 px-4 py-2.5"
                                >
                                    {isRechazando ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Rechazando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <X size={14} className="stroke-[2.5]" />
                                            <span>Rechazar</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {onApprove && (
                                <button
                                    onClick={(e) => {
                                        onApprove(id, e);
                                        // Dejamos que el modal se actualice al cambiar el estado de la lista
                                    }}
                                    disabled={isAprobando || isRechazando}
                                    className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-5 py-2.5 border border-blue-600 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 text-xs font-semibold shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none shrink-0 w-full sm:w-[160px]"
                                >
                                    {isAprobando ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            <span>Aprobando...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={14} className="stroke-[2.5]" />
                                            <span>{approveLabel}</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
