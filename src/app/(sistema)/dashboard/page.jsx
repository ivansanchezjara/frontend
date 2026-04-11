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
            let nombreCompleto = user.first_name && user.last_name
                ? `${user.first_name} ${user.last_name}`
                : user.first_name || user.username || 'Usuario';

            setNombreUsuario(nombreCompleto);

            const words = nombreCompleto.trim().split(' ');
            let letters = words[0][0];
            if (words.length > 1) {
                letters += words[words.length - 1][0];
            } else if (nombreCompleto.length > 1) {
                letters += nombreCompleto[1];
            }
            setIniciales(letters.toUpperCase());
        }
    }, []);

    const modulosActivos = [
        { href: '/inventario/stock', icon: '📖', title: 'Catálogo Master', desc: 'Gestión de productos, fotos y descripciones de Thalys.', color: 'emerald' },
        { href: '/inventario', icon: '📦', title: 'Stock y Disponibilidad', desc: 'Consulta rápida de existencias, vencimientos y ubicaciones.', color: 'blue' },
        { href: '/inventario/movimientos', icon: '🏢', title: 'Gestión de Movimientos', desc: 'Carga de ingresos, consignaciones y ajustes comerciales.' },
    ];

    const modulosFuturos = [
        { icon: '🤝', title: 'Ventas y CRM', desc: 'Seguimiento de clientes, cotizaciones y persecución comercial.' },
        { icon: '💵', title: 'Caja y Ventas Diarias', desc: 'Apertura, cierre y facturación en mostrador.' },
        { icon: '💳', title: 'Cobranzas', desc: 'Gestión de cuentas por cobrar y conciliación de clientes.' },
        { icon: '📊', title: 'Finanzas y Gastos', desc: 'Flujo de caja, gastos fijos y rentabilidad macro.' },
        { icon: '🔧', title: 'Asistencia Técnica', desc: 'Servicio post-venta y reparaciones de equipos.' },
        { icon: '👥', title: 'Recursos Humanos', desc: 'Legajos, asistencia y gestión de equipo.' },
    ];

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
            {/* Header de Bienvenida */}
            <div className="animate-in fade-in slide-in-from-left-4 duration-700">
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">
                    Bienvenido, <span className="text-blue-600">{nombreUsuario}</span>
                </h3>
                <p className="text-slate-500 font-medium mt-1">Torre de control para gestión integral.</p>
            </div>

            {/* Sección: Módulos Operativos */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-slate-200"></span>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Áreas Operativas</h4>
                    <span className="h-px flex-1 bg-slate-200"></span>
                </div>

                {/* Ahora usan la misma grilla y tamaño que los módulos futuros */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modulosActivos.map((mod) => (
                        <Link key={mod.href} href={mod.href} className="group h-full">
                            <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-${mod.color}-500 transition-all duration-300 flex flex-col h-full`}>
                                <span className={`inline-flex items-center justify-center w-12 h-12 bg-${mod.color}-50 text-${mod.color}-600 rounded-xl mb-4 group-hover:bg-${mod.color}-600 group-hover:text-white transition-colors text-2xl`}>
                                    {mod.icon}
                                </span>
                                <h5 className="font-black text-slate-900 text-sm uppercase tracking-tight">{mod.title}</h5>
                                <p className="text-slate-500 text-[11px] mt-1 font-medium">{mod.desc}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Sección: Roadmap Proyectado */}
            <div className="space-y-6 opacity-80">
                <div className="flex items-center gap-3">
                    <span className="h-px flex-1 bg-slate-200"></span>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Próximamente en ERP.CORE</h4>
                    <span className="h-px flex-1 bg-slate-200"></span>
                </div>

                {/* Grilla idéntica a la de arriba */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {modulosFuturos.map((mod) => (
                        <div key={mod.title} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 border-dashed flex flex-col grayscale opacity-60 h-full">
                            <span className="text-2xl mb-4">{mod.icon}</span>
                            <h5 className="font-black text-slate-700 text-sm uppercase tracking-tight">{mod.title}</h5>
                            <p className="text-slate-500 text-[11px] mt-1 font-medium">{mod.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}