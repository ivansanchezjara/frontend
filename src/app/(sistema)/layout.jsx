"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout, getUser } from '@/services/auth';
import { Menu, X, ChevronLeft, ChevronRight, LogOut, User } from 'lucide-react';
import { navItems, familyStyles } from '@/config/navigation';

export default function SistemaLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Solo se ejecuta en el cliente
        const userData = getUser();
        setUser(userData);
    }, []);

    const initials = user
        ? ((user.first_name?.[0] || '') + (user.last_name?.[0] || '') || user.username?.substring(0, 2) || '?').toUpperCase()
        : '?';

    // 2. AGRUPAMOS LOS ITEMS POR CATEGORÍA MANTENIENDO EL ORDEN
    const categoriasOrdenadas = [];
    const itemsAgrupados = {};

    navItems.forEach(item => {
        const cat = item.category || 'General';
        if (!itemsAgrupados[cat]) {
            itemsAgrupados[cat] = [];
            categoriasOrdenadas.push(cat);
        }
        itemsAgrupados[cat].push(item);
    });

    return (
        <div className="min-h-screen bg-[#f1f5f9] flex flex-col md:flex-row">
            {/* Header Móvil */}
            <header className="md:hidden bg-slate-900 border-b border-slate-800 p-3 sticky top-0 z-50 flex items-center justify-between shadow-md">
                <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                    <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center font-black text-white text-sm shadow-lg shadow-blue-500/20">E</div>
                    <h1 className="text-base font-black tracking-tighter text-white">ERP<span className="text-blue-500">.</span>CORE</h1>
                </Link>
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                    aria-label="Abrir menú"
                >
                    <Menu size={20} />
                </button>
            </header>

            {/* Sidebar Overlay (Móvil) */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar (w-[280px] y w-16 para hacerlo más delgado al cerrarlo) */}
            <aside className={`bg-slate-900 text-white flex flex-col fixed h-full z-50 shadow-2xl transition-all duration-300 ${isExpanded ? 'w-[280px]' : 'w-[280px] md:w-16'} p-3 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

                {/* Botón de Toggle */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="hidden md:flex absolute -right-2.5 top-10 w-5 h-5 bg-blue-600 text-white rounded-full items-center justify-center shadow-lg hover:scale-110 transition-all z-50 border-[1.5px] border-slate-900 cursor-pointer"
                    title={isExpanded ? "Colapsar menú" : "Expandir menú"}
                >
                    {isExpanded ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
                </button>

                {/* Close Button (Móvil) */}
                <button
                    onClick={() => setIsMobileOpen(false)}
                    className="md:hidden absolute top-3 right-3 p-1.5 text-slate-400 hover:text-white bg-slate-800/50 rounded-md transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Logo Section */}
                <div className={`mb-6 flex items-center gap-2.5 transition-all duration-300 ${(!isExpanded && !isMobileOpen) ? 'md:flex-col md:gap-3' : 'justify-between'}`}>
                    <Link href="/dashboard" className="flex items-center gap-2.5 hover:scale-105 transition-transform cursor-pointer" onClick={() => setIsMobileOpen(false)}>
                        <div className="w-7 h-7 bg-blue-500 rounded-md flex items-center justify-center font-black text-white text-sm shrink-0 shadow-lg shadow-blue-500/20">E</div>
                        {(isExpanded || isMobileOpen) && <h1 className="text-lg font-black tracking-tighter animate-in fade-in slide-in-from-left-2 duration-300">ERP<span className="text-blue-500">.</span>CORE</h1>}
                    </Link>
                </div>

                {/* Navigation Items (Agrupados por Familias) */}
                <nav className="flex-1 overflow-y-auto scrollbar-hide pb-2">
                    {categoriasOrdenadas.map((categoria, catIdx) => (
                        <div key={categoria} className={`${catIdx > 0 ? 'mt-5' : ''}`}>

                            {/* Título de Categoría o Divisoria */}
                            {(isExpanded || isMobileOpen) ? (
                                <h4 className="px-2 mb-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest animate-in fade-in duration-300">
                                    {categoria}
                                </h4>
                            ) : (
                                <div className="w-full flex justify-center mb-1.5 mt-3">
                                    <div className="w-6 h-px bg-slate-800"></div>
                                </div>
                            )}

                            {/* Items de la Categoría */}
                            <div className="space-y-0.5">
                                {itemsAgrupados[categoria].map((item, idx) => {
                                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.includes(item.href));

                                    // AQUÍ ESTÁ LA MAGIA: Leemos directamente desde el archivo central
                                    const activeClass = familyStyles[item.color]?.activeNav || familyStyles.blue.activeNav;

                                    return item.type === 'active' ? (
                                        <Link
                                            key={idx}
                                            href={item.href}
                                            onClick={() => setIsMobileOpen(false)}
                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-all ${isActive ? activeClass : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                        >
                                            <span className="text-base shrink-0">{item.icon}</span>
                                            {(isExpanded || isMobileOpen) && <span className="truncate animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
                                        </Link>
                                    ) : (
                                        <div key={idx} className={`flex items-center gap-2.5 px-3 py-2 opacity-30 cursor-not-allowed grayscale text-sm font-bold ${(!isExpanded && !isMobileOpen) ? 'md:justify-center px-0' : ''}`}>
                                            <span className="text-base shrink-0">{item.icon}</span>
                                            {(isExpanded || isMobileOpen) && <span className="text-slate-400 whitespace-nowrap truncate animate-in fade-in duration-300">{item.label}</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Area de Perfil y Logout en Sidebar */}
                <div className="w-full px-2 mt-auto pt-4 mb-2 space-y-1 bg-slate-900 border-t border-slate-800/50 mt-4">
                    <Link href="/perfil" className={`flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-all text-left w-full ${(!isExpanded && !isMobileOpen) ? 'md:justify-center px-0' : ''}`}>
                        <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-300 font-black text-xs shrink-0 border border-slate-700/50 shadow-inner">
                            {initials}
                        </div>
                        {(isExpanded || isMobileOpen) && (
                            <div className="truncate flex-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Tu Cuenta</p>
                                <p className="text-xs font-bold text-white leading-none truncate">
                                    {user?.first_name} {user?.last_name || (user?.first_name ? '' : user?.username)}
                                </p>
                            </div>
                        )}
                    </Link>

                    <button
                        onClick={() => { logout(); router.push('/'); }}
                        className={`p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg text-xs font-bold flex items-center gap-2.5 w-full transition-all shrink-0 ${(!isExpanded && !isMobileOpen) ? 'md:justify-center px-0' : ''}`}
                        title="Cerrar Sesión"
                    >
                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                            <LogOut size={16} />
                        </div>
                        {(isExpanded || isMobileOpen) && <span className="uppercase tracking-wide">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${isExpanded ? 'md:ml-[280px]' : 'md:ml-16'}`}>
                <div className=" flex-1 overflow-hidden flex flex-col">
                    {children}
                </div>
            </main>

        </div>
    );
}