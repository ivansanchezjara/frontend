"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUser } from '@/services/auth';

export default function DashboardPage() {
    const [nombreUsuario, setNombreUsuario] = useState('Usuario');
    const [iniciales, setIniciales] = useState('??');

    useEffect(() => {
        const user = getUser();
        if (user) {
            // 1. Armamos el nombre completo usando first_name y last_name si existen
            let nombreCompleto = 'Usuario';

            if (user.first_name && user.last_name) {
                nombreCompleto = `${user.first_name} ${user.last_name}`;
            } else if (user.first_name) {
                nombreCompleto = user.first_name;
            } else if (user.username) {
                nombreCompleto = user.username;
            }

            setNombreUsuario(nombreCompleto);

            // 2. Generar iniciales (Ej: "Ivan Sanchez" -> "IS")
            const words = nombreCompleto.trim().split(' ');
            let letters = words[0][0]; // Primera letra del nombre

            if (words.length > 1) {
                letters += words[words.length - 1][0]; // Primera letra del último apellido
            } else if (nombreCompleto.length > 1) {
                letters += nombreCompleto[1]; // Si solo tiene un nombre, toma la 2da letra
            }

            setIniciales(letters.toUpperCase());
        }
    }, []);

    return (
        <>
            <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 sticky top-0 z-10">
                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Dashboard General</h2>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end hidden sm:flex">
                        <span className="text-xs font-black text-slate-900">{nombreUsuario}</span>
                        <span className="text-[9px] font-bold text-blue-500 uppercase">Usuario</span>
                    </div>
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-600 border border-slate-200 shadow-sm">
                        {iniciales}
                    </div>
                </div>
            </header>

            <div className="p-10 max-w-6xl">
                <div className="mb-10 animate-in fade-in duration-700">
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                        Bienvenido, <span className="text-blue-600">{nombreUsuario}</span>
                    </h3>
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