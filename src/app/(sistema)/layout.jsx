"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout, getUser } from '@/services/apis/auth.js';
import { Menu, X, ChevronLeft, ChevronRight, ChevronDown, LogOut, Settings } from 'lucide-react';
import { navItems, familyStyles } from '@/config/navigation.js';
import { BrandMark, Text } from '@/components/ui';

export default function SistemaLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [expandedParents, setExpandedParents] = useState({});
    const [user, setUser] = useState(null);

    useEffect(() => {
        // Solo se ejecuta en el cliente
        const userData = getUser();
        setUser(userData);

        const handleUserUpdate = () => {
            setUser(getUser());
        };
        window.addEventListener('user-updated', handleUserUpdate);
        return () => {
            window.removeEventListener('user-updated', handleUserUpdate);
        };
    }, []);

    const initials = user
        ? ((user.first_name?.[0] || '') + (user.last_name?.[0] || '') || user.username?.substring(0, 2) || '?').toUpperCase()
        : '?';

    // 2. FILTRADO POR ROLES Y AGRUPACIÓN
    const hasPermission = (item) => {
        // Si el item no tiene restricciones, pasa directo
        if (!item.roles || item.roles.length === 0) return true;

        // Si no hay usuario cargado todavía (primer milisegundo de renderizado), ocultamos
        if (!user) return false;

        // Si es superusuario, ve todo
        if (user.is_superuser) return true;

        const userGroups = user.groups || [];

        return item.roles.some(role => {
            // CASO A: Si Django envía un array de textos ["gestorDeCatalogo"]
            if (typeof userGroups[0] === 'string') {
                return userGroups.includes(role);
            }

            // CASO B: Si Django envía un array de objetos [{ id: 1, name: "gestorDeCatalogo" }]
            if (typeof userGroups[0] === 'object') {
                return userGroups.some(g => g.name === role);
            }

            return false;
        });
    };

    const categoriasOrdenadas = [];
    const itemsAgrupados = {};

    navItems.forEach(item => {
        if (!hasPermission(item)) return;

        const cat = item.category || 'General';
        if (!itemsAgrupados[cat]) {
            itemsAgrupados[cat] = [];
            categoriasOrdenadas.push(cat);
        }
        itemsAgrupados[cat].push(item);
    });

    // Auto-expand parents whose children match the current path
    useEffect(() => {
        const newExpanded = {};
        navItems.forEach(item => {
            if (item.children) {
                const isChildActive = item.children.some(child =>
                    pathname === child.href || (child.href !== '/dashboard' && pathname.startsWith(child.href))
                );
                if (isChildActive) {
                    newExpanded[item.label] = true;
                }
            }
        });
        setExpandedParents(prev => ({ ...prev, ...newExpanded }));
    }, [pathname]);

    const toggleParent = (label) => {
        setExpandedParents(prev => ({ ...prev, [label]: !prev[label] }));
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] flex flex-col md:flex-row">
            {/* Header Móvil */}
            <header className="md:hidden bg-slate-900 border-b border-slate-800 p-3 sticky top-0 z-50 flex items-center justify-between shadow-md">
                <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                    <BrandMark size="sm" tone="light" textClassName="tracking-tighter" />
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
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => setIsMobileOpen(false)}
                        title={(!isExpanded && !isMobileOpen) ? "Panel Principal" : undefined}
                    >
                        <BrandMark
                            size="md"
                            tone="light"
                            showText={isExpanded || isMobileOpen}
                            textClassName="tracking-tighter animate-in fade-in slide-in-from-left-2 duration-300"
                        />
                    </Link>
                </div>

                {/* Navigation Items (Agrupados por Familias) */}
                <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide pb-2">
                    {categoriasOrdenadas.map((categoria, catIdx) => (
                        <div key={categoria} className={`${catIdx > 0 ? 'mt-5' : ''}`}>

                            {/* Título de Categoría o Divisoria */}
                            {(isExpanded || isMobileOpen) ? (
                                <Text as="h4" variant="label" className="mb-1.5 px-2 text-[9px] text-slate-500 animate-in fade-in duration-300">
                                    {categoria}
                                </Text>
                            ) : (
                                <div className="w-full flex justify-center mb-1.5 mt-3">
                                    <div className="w-6 h-px bg-slate-800"></div>
                                </div>
                            )}

                            {/* Items de la Categoría */}
                            <div className="space-y-0.5">
                                {itemsAgrupados[categoria].map((item, idx) => {
                                    // Item con submódulos (children)
                                    if (item.children) {
                                        const isParentExpanded = expandedParents[item.label];
                                        const isChildActive = item.children.some(child =>
                                            pathname === child.href || (child.href !== '/dashboard' && pathname.startsWith(child.href))
                                        );
                                        const activeClass = familyStyles[item.color]?.activeNav || familyStyles.blue.activeNav;

                                        return (
                                            <div key={idx}>
                                                <button
                                                    onClick={() => toggleParent(item.label)}
                                                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-all w-full ${isChildActive ? activeClass : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                                    title={(!isExpanded && !isMobileOpen) ? item.label : undefined}
                                                >
                                                    <span className="text-base shrink-0">{item.icon}</span>
                                                    {(isExpanded || isMobileOpen) && (
                                                        <>
                                                            <span className="truncate flex-1 text-left animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>
                                                            <ChevronDown size={14} className={`shrink-0 transition-transform duration-200 ${isParentExpanded ? 'rotate-180' : ''}`} />
                                                        </>
                                                    )}
                                                </button>
                                                {isParentExpanded && (isExpanded || isMobileOpen) && (
                                                    <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-800 pl-2 animate-in slide-in-from-top-1 duration-200">
                                                        {item.children.map((child, childIdx) => {
                                                            if (!hasPermission(child)) return null;
                                                            const isActive = pathname === child.href || (child.href !== '/dashboard' && pathname.startsWith(child.href + '/'));
                                                            return (
                                                                <Link
                                                                    key={childIdx}
                                                                    href={child.href}
                                                                    onClick={() => { setIsMobileOpen(false); setIsExpanded(false); }}
                                                                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${isActive ? 'text-white bg-white/10' : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
                                                                >
                                                                    <span className="text-sm shrink-0">{child.icon}</span>
                                                                    <span className="truncate">{child.label}</span>
                                                                </Link>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    // Item simple (sin children)
                                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.includes(item.href));
                                    const activeClass = familyStyles[item.color]?.activeNav || familyStyles.blue.activeNav;

                                    return item.type === 'active' ? (
                                        <Link
                                            key={idx}
                                            href={item.href}
                                            onClick={() => { setIsMobileOpen(false); setIsExpanded(false); }}
                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-bold transition-all ${isActive ? activeClass : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                            title={(!isExpanded && !isMobileOpen) ? item.label : undefined}
                                        >
                                            <span className="text-base shrink-0">{item.icon}</span>
                                            {(isExpanded || isMobileOpen) && <span className="truncate animate-in fade-in slide-in-from-left-2 duration-300">{item.label}</span>}
                                        </Link>
                                    ) : (
                                        <div
                                            key={idx}
                                            className={`flex items-center gap-2.5 px-3 py-2 opacity-30 cursor-not-allowed grayscale text-sm font-bold ${(!isExpanded && !isMobileOpen) ? 'md:justify-center px-0' : ''}`}
                                            title={(!isExpanded && !isMobileOpen) ? `${item.label} (No disponible)` : undefined}
                                        >
                                            <span className="text-base shrink-0">{item.icon}</span>
                                            {(isExpanded || isMobileOpen) && <span className="text-slate-400 whitespace-nowrap truncate animate-in fade-in duration-300">{item.label}</span>}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Area de Configuración y Logout en Sidebar */}
                <div className="w-full px-2 mt-auto pt-4 mb-2 space-y-1 bg-slate-900 border-t border-slate-800/50 mt-4">
                    {/* Botón Configuración (link directo al hub) */}
                    <Link
                        href="/configuraciones"
                        onClick={() => { setIsMobileOpen(false); setIsExpanded(false); }}
                        className={`flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/5 transition-all text-left w-full ${(!isExpanded && !isMobileOpen) ? 'md:justify-center px-0' : ''} ${pathname.startsWith('/configuraciones') || pathname === '/perfil' || pathname === '/empresa' ? 'bg-white/5 text-white' : 'text-slate-400'}`}
                        title={(!isExpanded && !isMobileOpen) ? "Configuración" : undefined}
                    >
                        <div className="w-8 h-8 flex items-center justify-center shrink-0">
                            <Settings size={16} />
                        </div>
                        {(isExpanded || isMobileOpen) && (
                            <span className="text-xs font-bold truncate flex-1">Configuración</span>
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
            <main className={`flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300 ${isExpanded ? 'md:ml-[280px]' : 'md:ml-16'}`}>
                <div className="flex-1 overflow-hidden flex flex-col min-w-0">
                    {children}
                </div>
            </main>

        </div>
    );
}
