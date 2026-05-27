import { PageHeader, Heading, Text } from '@/components/ui';
import Link from 'next/link';
import {
    ArrowRight, Settings2, TrendingUp, Edit3, Shuffle, ClipboardList
} from 'lucide-react';

export default function AjustesHubPage() {
    const subModulos = [
        {
            href: '/movimientos/ajustes/altas-bajas',
            icon: <TrendingUp size={32} />,
            title: 'Altas y Bajas',
            desc: 'Ajustes rápidos para sumar o restar stock por roturas o mermas.',
        },
        {
            href: '/movimientos/ajustes/editar-lote',
            icon: <Edit3 size={32} />,
            title: 'Editar Lote',
            desc: 'Corrección de datos, nombres o fechas de vencimiento sin afectar cantidades.',
        },
        {
            href: '/movimientos/ajustes/reclasificar',
            icon: <Shuffle size={32} />,
            title: 'Reclasificar',
            desc: 'Transferir o mover cantidades de un lote erróneo a otro.',
        },
        {
            href: '/movimientos/ajustes/auditoria-stock',
            icon: <ClipboardList size={32} />,
            title: 'Auditoría de Stock',
            desc: 'Recuentos masivos, conciliación y ajuste de diferencias de stock.',
        },
    ];

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            <PageHeader
                breadcrumbs={[
                    { label: "Gestión de Movimientos", href: "/movimientos" },
                    { label: "Ajustes de Inventario" },
                ]}
                subtitle={
                    <>
                        <Settings2 size={12} />
                        Correcciones, auditorías y mantenimiento de stock
                    </>
                }
            />

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1600px] mx-auto">
                    <div className="mb-10">
                        <Heading level={2} className="text-slate-900 tracking-tight">Seleccioná una ajuste</Heading>
                        <Text className="text-slate-500 font-medium">Elegí el tipo de ajuste que necesitás realizar sobre el inventario.</Text>
                    </div>

                    <div className="space-y-2 md:space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {subModulos.map((mod) => (
                            <Link
                                key={mod.href}
                                href={mod.href}
                                className="group block bg-white p-3 md:p-4 rounded-xl md:rounded-[28px] border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden relative"
                            >
                                <div className="flex items-center gap-3 md:gap-6 relative z-10">
                                    {/* Icono */}
                                    <div className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg md:rounded-[22px] group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
                                        {mod.icon}
                                    </div>

                                    {/* Contenido */}
                                    <div className="flex-1 min-w-0">
                                        <Heading level={4} className="md:text-xl text-slate-900 tracking-tight mb-0.5 md:mb-1 group-hover:text-blue-600 transition-colors">
                                            {mod.title}
                                        </Heading>
                                        <Text variant="bodySm" className="text-slate-500 font-medium leading-relaxed max-w-2xl hidden md:block">
                                            {mod.desc}
                                        </Text>
                                    </div>

                                    {/* Acción */}
                                    <div className="shrink-0">
                                        <div className="flex items-center gap-1 px-3 md:px-6 py-1.5 md:py-3 bg-slate-50 text-slate-400 rounded-lg md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm whitespace-nowrap">
                                            Gestionar <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform hidden md:block" />
                                        </div>
                                    </div>
                                </div>

                                {/* Decoración sutil */}
                                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-all"></div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
