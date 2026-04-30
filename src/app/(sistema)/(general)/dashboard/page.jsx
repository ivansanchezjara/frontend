"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUser } from '@/services/auth';
import { modulosActivos, modulosFuturos } from '@/config/navigation';

// 1. DICCIONARIO DE FAMILIAS (Colores, etiquetas y divisorias)
const colorStyles = {
    emerald: {
        label: 'Comercial y Ventas',
        borderHover: 'hover:border-emerald-500',
        bg: 'bg-emerald-50',
        text: 'text-emerald-600',
        groupHoverBg: 'group-hover:bg-emerald-600',
        line: 'bg-emerald-200'
    },
    blue: {
        label: 'Operaciones y Logística',
        borderHover: 'hover:border-blue-500',
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        groupHoverBg: 'group-hover:bg-blue-600',
        line: 'bg-blue-200'
    },
    purple: {
        label: 'Finanzas y Control',
        borderHover: 'hover:border-purple-500',
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        groupHoverBg: 'group-hover:bg-purple-600',
        line: 'bg-purple-200'
    },
    amber: {
        label: 'Equipo y Administración',
        borderHover: 'hover:border-amber-500',
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        groupHoverBg: 'group-hover:bg-amber-600',
        line: 'bg-amber-200'
    }
};

// Array para forzar el orden en el que queremos que aparezcan las familias
const ordenFamilias = ['emerald', 'blue', 'purple', 'amber'];

export default function DashboardPage() {
    const [nombreUsuario, setNombreUsuario] = useState('Usuario');

    useEffect(() => {
        const user = getUser();
        if (user) {
            let nombreCompleto = user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.first_name || user.username || 'Usuario';

            setNombreUsuario(nombreCompleto);
        }
    }, []);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
            {/* Header de Bienvenida */}
            <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    Bienvenido, <span className="text-blue-600">{nombreUsuario}</span>
                </h3>
                <p className="text-slate-500 font-medium mt-1">Panel de control del sistema.</p>
            </div>

            {/* Renderizado dinámico por Familias */}
            <div className="space-y-12">
                {ordenFamilias.map((colorKey) => {
                    const style = colorStyles[colorKey];

                    // Filtramos qué módulos pertenecen a esta familia
                    const activos = modulosActivos.filter(m => m.color === colorKey);
                    const futuros = modulosFuturos.filter(m => m.color === colorKey);

                    // Si no hay ningún módulo en esta familia, no renderizamos la sección
                    if (activos.length === 0 && futuros.length === 0) return null;

                    return (
                        <div key={colorKey} className="space-y-6">
                            {/* Divisoria de la Familia */}
                            <div className="flex items-center gap-3">
                                <h4 className={`text-[10px] font-black ${style.text} uppercase tracking-[0.3em]`}>
                                    {style.label}
                                </h4>
                                <span className={`h-px flex-1 ${style.line}`}></span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* 1. Renderizamos los Activos primero */}
                                {activos.map((mod) => (
                                    <Link key={mod.href} href={mod.href} className="group h-full">
                                        <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full ${style.borderHover}`}>
                                            <span className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 group-hover:text-white transition-colors text-2xl ${style.bg} ${style.text} ${style.groupHoverBg}`}>
                                                {mod.icon}
                                            </span>
                                            <h5 className="font-black text-slate-900 text-sm uppercase tracking-tight">{mod.title}</h5>
                                            <p className="text-slate-500 text-[11px] mt-1 font-medium">{mod.desc}</p>
                                        </div>
                                    </Link>
                                ))}

                                {/* 2. Renderizamos los Futuros de esta misma familia */}
                                {futuros.map((mod) => (
                                    <div key={mod.title} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 border-dashed flex flex-col grayscale opacity-60 h-full relative overflow-hidden">
                                        <span className="text-2xl mb-4">{mod.icon}</span>
                                        <h5 className="font-black text-slate-700 text-sm uppercase tracking-tight">{mod.title}</h5>
                                        <p className="text-slate-500 text-[11px] mt-1 font-medium">{mod.desc}</p>

                                        {/* Badge de Próximamente */}
                                        <div className="absolute top-4 right-4 bg-slate-200 text-slate-500 text-[9px] font-bold px-2 py-1 rounded-md uppercase tracking-wider">
                                            Pronto
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}