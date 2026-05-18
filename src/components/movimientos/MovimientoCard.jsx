import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Calendar, MapPin, User, Edit3 } from 'lucide-react';

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
        const className = "bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all group flex flex-col md:flex-row items-center gap-6 cursor-pointer w-full text-left";
        
        if (href) {
            return (
                <Link href={href} className={className}>
                    {children}
                </Link>
            );
        }
        
        return (
            <div onClick={onClick} className={className}>
                {children}
            </div>
        );
    };

    return (
        <CardWrapper>
            {/* Icono de Estado */}
            <div className={`w-16 h-16 rounded-[22px] flex items-center justify-center shrink-0 shadow-sm border ${config.bg} ${config.text} ${config.border}`}>
                <StatusIcon size={32} className={estado === 'BORRADOR' && !CustomIcon ? 'animate-pulse' : ''} />
            </div>

            {/* Info Principal */}
            <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID #{id}</span>
                    <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${config.badge}`}>
                        {estado}
                    </span>
                    {badges.map((badge, idx) => (
                        <span key={idx} className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${badge.className || 'bg-slate-100 text-slate-600'}`}>
                            {badge.label}
                        </span>
                    ))}
                </div>
                
                <h3 className="text-xl font-black text-slate-900 truncate tracking-tight group-hover:text-blue-600 transition-colors">
                    {titulo}
                </h3>
                
                {subtitulo && (
                    <p className="text-slate-500 text-[11px] font-medium mt-1 italic truncate">
                        "{subtitulo}"
                    </p>
                )}

                <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    {info.map((item, idx) => (
                        <span key={idx} className="flex items-center gap-2">
                            {item.icon && <item.icon size={14} />}
                            {item.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Acciones */}
            {showActions && estado === 'BORRADOR' && (
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                    {onEditHref && (
                        <Link
                            href={onEditHref}
                            className="px-6 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-2xl transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest border border-blue-100"
                        >
                            <Edit3 size={14} /> Editar
                        </Link>
                    )}
                    
                    {onApprove && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onApprove(id, e);
                            }}
                            disabled={isAprobando || isRechazando}
                            className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all border border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAprobando ? "Aprobando..." : approveLabel}
                        </button>
                    )}

                    {onReject && (
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                onReject(id, e);
                            }}
                            disabled={isAprobando || isRechazando}
                            className="bg-rose-50 text-rose-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isRechazando ? "Rechazando..." : "Rechazar"}
                        </button>
                    )}
                </div>
            )}
        </CardWrapper>
    );
}
