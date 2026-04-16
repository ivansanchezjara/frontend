import Link from 'next/link';
import Header from '@/components/ui/Header';

export default function MovimientosHubPage() {
    // Definimos las tarjetas de movimientos
    const movimientos = [
        {
            href: '/movimientos/ingresos',
            icon: '📥',
            title: 'Ingresos de Mercadería',
            desc: 'Registrar la entrada de stock, remitos y actualizar costos de compra.',
            color: 'emerald'
        },
        {
            href: '/movimientos/bajas',
            icon: '📤',
            title: 'Bajas de Inventario',
            desc: 'Registrar pérdidas, mermas, productos vencidos o roturas.',
            color: 'rose' // rose es un rojo suave
        },
        {
            href: '/movimientos/transferencias',
            icon: '🔄',
            title: 'Transferencias Internas',
            desc: 'Mover stock entre distintos depósitos o sucursales de la empresa.',
            color: 'blue'
        },
        {
            href: '/movimientos/ajustes',
            icon: '📊',
            title: 'Ajustes Comerciales',
            desc: 'Modificar costos de compra y precios de venta de forma auditada.',
            color: 'violet'
        },
        {
            href: '/movimientos/consignaciones',
            icon: '🚚',
            title: 'Salidas Provisorias (Consignación)',
            desc: 'Mercadería enviada a clientes o vendedores de forma temporal.',
            color: 'purple'
        }
    ];

    return (
        <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
            {/* HEADER */}
            <Header
                title="Gestión de Movimientos"
                subtitle="📦 Operaciones de Inventario"
            >
            </Header>

            <main className="flex-1 overflow-y-auto p-8 min-w-0">
                <div className="max-w-7xl mx-auto space-y-6">
                    <p className="text-slate-500 font-medium mb-4">Seleccioná el tipo de operación que deseás realizar sobre el stock.</p>

                    {/* Grid de opciones */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                        {movimientos.map((mov) => (
                            <Link key={mov.href} href={mov.href} className="group flex flex-col h-full bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">

                                {/* Decoración de fondo */}
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-${mov.color}-500/5 rounded-bl-[100px] -z-0 transition-transform group-hover:scale-110`}></div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className={`w-14 h-14 flex items-center justify-center text-3xl bg-${mov.color}-50 text-${mov.color}-600 rounded-2xl mb-5 group-hover:scale-110 group-hover:bg-${mov.color}-600 group-hover:text-white transition-all duration-300 shadow-sm`}>
                                        {mov.icon}
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight mb-2 group-hover:text-blue-600 transition-colors">
                                        {mov.title}
                                    </h2>
                                    <p className="text-slate-500 text-sm font-medium leading-relaxed flex-grow">
                                        {mov.desc}
                                    </p>

                                    {/* Flecha indicadora */}
                                    <div className="mt-6 flex items-center text-sm font-bold text-slate-400 group-hover:text-blue-600 transition-colors">
                                        Iniciar Operación <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
