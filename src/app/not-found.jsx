"use client";
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-8">
                <div className="inline-block bg-slate-900 text-white p-4 rounded-3xl shadow-2xl shadow-blue-500/20 mb-6">
                    <span className="text-5xl font-black">404</span>
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
                    Página no encontrada
                </h1>
                <p className="text-slate-500 font-medium max-w-sm mx-auto">
                    Lo sentimos, la ruta que buscas no existe o fue movida a otra sección del sistema.
                </p>
            </div>

            <div className="flex gap-4">
                <Link
                    href="/dashboard"
                    className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    VOLVER AL PANEL
                </Link>

            </div>

            <div className="mt-16 text-slate-300 font-bold text-[10px] uppercase tracking-[0.3em]">
                ERP.CORE Security System
            </div>
        </div>
    );
}