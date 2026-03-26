"use client";
import Link from 'next/link';

export default function DashboardPage() {
    return (
        <>
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Dashboard General</h2>
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 border border-slate-200">
                        IS
                    </div>
                </div>
            </header>

            <div className="p-10 max-w-6xl">
                <div className="mb-10">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">Bienvenido, Iván</h3>
                    <p className="text-slate-500 font-medium">Gestioná los recursos de tu empresa desde un solo lugar.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Link href="/inventario" className="group">
                        <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-300 relative overflow-hidden h-full cursor-pointer">
                            <div className="relative z-10">
                                <span className="inline-block p-4 bg-blue-50 text-blue-600 rounded-2xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors text-2xl">
                                    📦
                                </span>
                                <h4 className="text-2xl font-black text-slate-900">Control de Inventario</h4>
                                <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-[280px]">
                                    Administrá stock, categorías y variantes de productos en tiempo real.
                                </p>
                            </div>
                        </div>
                    </Link>

                    <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm opacity-60 flex flex-col justify-center">
                        <span className="inline-block p-4 bg-slate-100 text-slate-400 rounded-2xl mb-6 text-2xl w-fit">
                            🔄
                        </span>
                        <h4 className="text-2xl font-black text-slate-400">Movimientos</h4>
                        <p className="text-slate-400 mt-2 text-sm leading-relaxed">
                            Próximamente: Salidas provisorias, consignaciones y devoluciones.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}