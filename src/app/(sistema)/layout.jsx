"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Importamos useRouter
import { logout } from '@/services/auth';

export default function SistemaLayout({ children }) {
    const pathname = usePathname();
    const router = useRouter(); // Inicializamos el router

    const handleLogout = () => {
        logout(); // Llama a la función que borra las cookies
        router.push('/'); // Te manda al nuevo login en la raíz
    };

    return (
        <div className="min-h-screen bg-[#f1f5f9] flex">
            {/* BARRA LATERAL */}
            <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col p-6 fixed h-full z-20 shadow-2xl">
                <div className="mb-10 px-2 flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-black text-white">
                        E
                    </div>
                    <h1 className="text-xl font-black tracking-tighter">
                        ERP<span className="text-blue-500">.</span>CORE
                    </h1>
                </div>

                <nav className="flex-1 space-y-2 text-sm">
                    <div className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 px-2">
                        Navegación
                    </div>

                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold ${pathname === '/dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        🏠 Panel Principal
                    </Link>

                    <Link
                        href="/inventario"
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all font-bold ${pathname.includes('/inventario') ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                        📦 Inventario
                    </Link>
                </nav>

                {/* BOTÓN DE CIERRE DE SESIÓN CORREGIDO */}
                <button
                    onClick={handleLogout}
                    className="mt-auto flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl font-bold transition-all text-sm w-full cursor-pointer"
                >
                    🚪 Cerrar Sesión
                </button>
            </aside>

            {/* CONTENIDO PRINCIPAL */}
            <main className="flex-1 ml-64 flex flex-col min-h-screen text-slate-900">
                {children}
            </main>
        </div>
    );
}