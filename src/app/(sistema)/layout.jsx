"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/services/auth';

export default function SistemaLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();

    // Estado para el menú en escritorio
    const [isExpanded, setIsExpanded] = useState(true);
    // NUEVO: Estado para el menú en móviles
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] flex flex-col md:flex-row">

            {/* 📱 HEADER PARA MÓVIL (Aparece cuando la pantalla es chica) */}
            <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
                <span className="font-black tracking-tighter">ERP.CORE</span>
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="p-2 bg-slate-800 rounded-lg active:scale-95 transition-all"
                >
                    {isMobileOpen ? '✕' : '☰'}
                </button>
            </div>

            {/* 🖥️ BARRA LATERAL (SIDEBAR) */}
            <aside
                className={`bg-slate-900 text-white flex flex-col fixed h-full z-40 shadow-2xl transition-all duration-300 ease-in-out 
                    /* Manejo de ancho en escritorio */
                    ${isExpanded ? 'md:w-64 p-6' : 'md:w-20 p-4 md:items-center'}
                    /* Manejo de visibilidad en móvil (Desliza desde la izquierda) */
                    ${isMobileOpen ? 'translate-x-0 w-64 p-6' : '-translate-x-full md:translate-x-0'}
                `}
            >
                {/* BOTÓN TOGGLE (Solo visible en computadoras) */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="hidden md:flex absolute -right-3 top-10 bg-blue-600 w-6 h-6 rounded-full items-center justify-center border-2 border-white hover:bg-blue-500 transition-colors z-30 shadow-lg cursor-pointer"
                >
                    <span className={`text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>➜</span>
                </button>

                {/* LOGO (Restaurado al original) */}
                <div className={`mb-10 flex items-center gap-3 transition-all ${!isExpanded && 'md:justify-center'} ${isMobileOpen && 'px-2'}`}>
                    <div className="w-8 h-8 min-w-[32px] bg-blue-500 rounded-lg flex items-center justify-center font-black text-white shadow-lg shadow-blue-500/20">
                        E
                    </div>
                    {(isExpanded || isMobileOpen) && (
                        <h1 className="text-xl font-black tracking-tighter whitespace-nowrap animate-in fade-in duration-500">
                            ERP<span className="text-blue-500">.</span>CORE
                        </h1>
                    )}
                </div>

                {/* NAVEGACIÓN */}
                <nav className="flex-1 space-y-2 text-sm w-full">
                    <Link
                        href="/dashboard"
                        onClick={() => setIsMobileOpen(false)} // Cierra el menú al hacer click en móvil
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold ${pathname === '/dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'} ${(!isExpanded && !isMobileOpen) ? 'md:justify-center' : ''}`}
                    >
                        <span className="text-lg">🏠</span>
                        {(isExpanded || isMobileOpen) && <span className="whitespace-nowrap">Panel Principal</span>}
                    </Link>

                    <Link
                        href="/inventario"
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold ${pathname.includes('/inventario') ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'} ${(!isExpanded && !isMobileOpen) ? 'md:justify-center' : ''}`}
                    >
                        <span className="text-lg">📦</span>
                        {(isExpanded || isMobileOpen) && <span className="whitespace-nowrap">Inventario</span>}
                    </Link>
                </nav>

                <button
                    onClick={handleLogout}
                    className={`mt-auto flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl font-bold transition-all text-sm w-full cursor-pointer ${(!isExpanded && !isMobileOpen) ? 'md:justify-center' : ''}`}
                >
                    <span className="text-lg">🚪</span>
                    {(isExpanded || isMobileOpen) && <span className="whitespace-nowrap">Cerrar Sesión</span>}
                </button>
            </aside>

            {/* 🌫️ OVERLAY PARA MÓVIL (Oscurece el fondo al abrir el menú) */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 md:hidden animate-in fade-in duration-300"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* 🚀 CONTENIDO PRINCIPAL (CORREGIDO) */}
            <main
                className={`flex-1 flex flex-col min-h-screen text-slate-900 transition-all duration-300 ease-in-out min-w-0
                /* El margen solo existe en escritorio (md:) */
                ${isExpanded ? 'md:ml-64' : 'md:ml-20'} 
                /* En móvil el margen es 0 */
                ml-0`}
            >
                {children}
            </main>
        </div>
    );
}