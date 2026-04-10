"use client";
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/services/auth';

export default function SistemaLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const navItems = [
        { href: '/dashboard', icon: '🏠', label: 'Panel Principal', type: 'active' },
        { href: '/catalogo', icon: '📖', label: 'Catálogo Master', type: 'active', color: 'emerald' },
        { href: '/inventario', icon: '📦', label: 'Inventario y Precios', type: 'active' },
        { label: 'Gestión de Depósito', icon: '🏢', type: 'future' },
        { label: 'Ventas y CRM', icon: '🤝', type: 'future' },
        { label: 'Caja y Facturación', icon: '💵', type: 'future' },
        { label: 'Cobranzas', icon: '💳', type: 'future' },
        { label: 'Finanzas y Gastos', icon: '📊', type: 'future' },
        { label: 'Asistencia Técnica', icon: '🔧', type: 'future' },
        { label: 'Recursos Humanos', icon: '👥', type: 'future' },
    ];

    return (
        <div className="min-h-screen bg-[#f1f5f9] flex flex-col md:flex-row">
            {/* Sidebar Desktop */}
            <aside className={`bg-slate-900 text-white flex flex-col fixed h-full z-40 shadow-2xl transition-all duration-300 ${isExpanded ? 'md:w-64 p-4' : 'md:w-20 p-4'} ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                {/* Logo Section */}
                <div className={`mb-8 flex items-center gap-3 ${!isExpanded && 'md:justify-center'}`}>
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-black text-white">E</div>
                    {isExpanded && <h1 className="text-xl font-black tracking-tighter">ERP<span className="text-blue-500">.</span>CORE</h1>}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 space-y-1 text-sm overflow-y-auto scrollbar-hide">
                    {navItems.map((item, idx) => (
                        item.type === 'active' ? (
                            <Link key={idx} href={item.href} className={`flex items-center gap-3 p-3 rounded-xl font-bold transition-all ${pathname.includes(item.href) ? (item.color === 'emerald' ? 'bg-emerald-600 shadow-lg' : 'bg-blue-600 shadow-lg') : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                                <span className="text-lg">{item.icon}</span>
                                {isExpanded && <span>{item.label}</span>}
                            </Link>
                        ) : (
                            <div key={idx} className={`flex items-center gap-3 p-3 opacity-30 cursor-not-allowed grayscale font-bold ${!isExpanded && 'md:justify-center'}`}>
                                <span className="text-lg">{item.icon}</span>
                                {isExpanded && <span className="text-slate-400 whitespace-nowrap">{item.label}</span>}
                            </div>
                        )
                    ))}
                </nav>

                {/* Logout */}
                <button onClick={() => { logout(); router.push('/'); }} className="mt-4 p-3 text-red-400 hover:bg-red-500/10 rounded-xl font-bold flex items-center gap-3 w-full border-t border-slate-800 pt-4">
                    <span className="text-lg">🚪</span>
                    {isExpanded && <span>Cerrar Sesión</span>}
                </button>
            </aside>

            {/* Main Content Area */}
            <main className={`flex-1 min-h-screen transition-all duration-300 ${isExpanded ? 'md:ml-64' : 'md:ml-20'}`}>
                {children}
            </main>
        </div>
    );
}