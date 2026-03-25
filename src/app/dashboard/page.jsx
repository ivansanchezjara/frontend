"use client";
import Link from 'next/link';
import { logout } from '@/services/auth';

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            {/* Barra Superior */}
            <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
                <h1 className="text-xl font-black text-slate-900 tracking-tighter">
                    ERP<span className="text-blue-600">.</span>SYSTEM
                </h1>
                <button
                    onClick={logout}
                    className="text-sm font-bold text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition"
                >
                    CERRAR SESIÓN
                </button>
            </nav>

            <main className="max-w-6xl mx-auto p-12">
                <header className="mb-12">
                    <h2 className="text-4xl font-extrabold text-slate-900">Panel de Control</h2>
                    <p className="text-slate-500 mt-2 text-lg">Bienvenido al sistema de gestión integral.</p>
                </header>

                {/* Módulos del ERP */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Módulo Inventario */}
                    <Link href="/inventario" className="group">
                        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm hover:shadow-2xl hover:border-blue-500 transition-all duration-300 h-full flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center text-4xl mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                📦
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800">Inventario</h3>
                            <p className="text-slate-500 mt-3 text-sm">Control de stock, lotes, ingresos y salidas en consignación.</p>
                        </div>
                    </Link>

                    {/* Módulo Ventas (Placeholder) */}
                    <div className="bg-slate-100 p-10 rounded-3xl border border-dashed border-slate-300 opacity-60 flex flex-col items-center text-center grayscale">
                        <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center text-4xl mb-6">
                            💰
                        </div>
                        <h3 className="text-2xl font-bold text-slate-400">Ventas</h3>
                        <p className="text-slate-400 mt-3 text-sm">Facturación, cobranzas y notas de crédito.</p>
                    </div>

                    {/* Módulo Reportes (Placeholder) */}
                    <div className="bg-slate-100 p-10 rounded-3xl border border-dashed border-slate-300 opacity-60 flex flex-col items-center text-center grayscale">
                        <div className="w-20 h-20 bg-slate-200 rounded-2xl flex items-center justify-center text-4xl mb-6">
                            📊
                        </div>
                        <h3 className="text-2xl font-bold text-slate-400">Reportes</h3>
                        <p className="text-slate-400 mt-3 text-sm">Estadísticas de stock y movimientos comerciales.</p>
                    </div>

                </div>
            </main>
        </div>
    );
}