import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';
import { 
    ArrowDownCircle, ArrowUpCircle, 
    RefreshCcw, BarChart3, Truck, ArrowRight 
} from 'lucide-react';

export default function MovimientosHubPage() {
    const movimientos = [
        {
            href: '/movimientos/ingresos',
            icon: <ArrowDownCircle size={32} />,
            title: 'Ingresos de Mercadería',
            desc: 'Registrar la entrada de stock, remitos y actualizar costos de compra.',
            color: 'blue'
        },
        {
            href: '/movimientos/bajas',
            icon: <ArrowUpCircle size={32} />,
            title: 'Bajas de Inventario',
            desc: 'Registrar pérdidas, mermas, productos vencidos o roturas.',
            color: 'blue'
        },
        {
            href: '/movimientos/transferencias',
            icon: <RefreshCcw size={32} />,
            title: 'Transferencias Internas',
            desc: 'Mover stock entre distintos depósitos o sucursales de la empresa.',
            color: 'blue'
        },
        {
            href: '/movimientos/ajustes',
            icon: <BarChart3 size={32} />,
            title: 'Ajustes Comerciales',
            desc: 'Modificar costos de compra y precios de venta de forma auditada.',
            color: 'blue'
        },
        {
            href: '/movimientos/consignaciones',
            icon: <Truck size={32} />,
            title: 'Salidas Provisorias (Consignación)',
            desc: 'Mercadería enviada a clientes o vendedores de forma temporal.',
            color: 'blue'
        }
    ];

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            {/* HEADER */}
            <PageHeader
                title="Gestión de Movimientos"
                subtitle="Operaciones y Logística de Inventario"
                subtitleClassName="text-blue-600"
            />

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-[1600px] mx-auto">
                    <div className="mb-10">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Centro de Operaciones</h2>
                        <p className="text-slate-500 font-medium">Seleccioná el tipo de operación que deseás realizar sobre el stock.</p>
                    </div>

                    {/* Lista de operaciones */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {movimientos.map((mov) => (
                            <Link 
                                key={mov.href} 
                                href={mov.href} 
                                className="group block bg-white p-5 rounded-[28px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 overflow-hidden relative"
                            >
                                <div className="flex items-center gap-6 relative z-10">
                                    {/* Icono */}
                                    <div className="w-20 h-20 flex items-center justify-center bg-blue-50 text-blue-600 rounded-[22px] group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
                                        {mov.icon}
                                    </div>

                                    {/* Contenido */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight mb-1 group-hover:text-blue-600 transition-colors">
                                            {mov.title}
                                        </h3>
                                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-2xl">
                                            {mov.desc}
                                        </p>
                                    </div>

                                    {/* Acción */}
                                    <div className="pr-4 shrink-0">
                                        <div className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                            Gestionar <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
