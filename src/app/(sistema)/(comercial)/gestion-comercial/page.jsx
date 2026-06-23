import { PageHeader, Heading, Text } from '@/components/ui';
import Link from 'next/link';
import {
  DollarSign, TrendingUp, BarChart3, ClipboardList, Target, ArrowRight, Briefcase
} from 'lucide-react';

export default function GestionComercialHubPage() {
  const secciones = [
    {
      href: '/gestion-comercial/precios',
      icon: <DollarSign size={32} />,
      title: 'Gestión de Precios',
      desc: 'Lista de precios, costos FOB/Landed, promociones por volumen, combos e historial de cambios.',
      color: 'emerald',
    },
    {
      href: '/gestion-comercial/rendimiento',
      icon: <TrendingUp size={32} />,
      title: 'Rendimiento de Vendedores',
      desc: 'Ranking de vendedores, montos vendidos, cantidad de pedidos y ticket promedio por período.',
      color: 'emerald',
    },
    {
      href: '/gestion-comercial/analisis',
      icon: <BarChart3 size={32} />,
      title: 'Análisis de Ventas',
      desc: 'Productos más vendidos, tendencias por período, margen bruto y comparativas.',
      color: 'emerald',
    },
    {
      href: '/gestion-comercial/seguimiento',
      icon: <ClipboardList size={32} />,
      title: 'Seguimiento de Pedidos',
      desc: 'Estado del pipeline de ventas: borradores, confirmados, cobrados y entregados.',
      color: 'emerald',
    },
    {
      href: '#',
      icon: <Target size={32} />,
      title: 'Metas y Objetivos',
      desc: 'Definición y seguimiento de metas de venta por vendedor y equipo.',
      color: 'emerald',
      proximamente: true,
    },
  ];

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        title="Gestión Comercial"
        subtitle={
          <>
            <Briefcase size={12} />
            Precios, rendimiento, análisis y seguimiento comercial
          </>
        }
      />

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-10">
            <Heading level={2} className="text-slate-900 tracking-tight">Centro de Gestión Comercial</Heading>
            <Text className="text-slate-500 font-medium">Seleccioná la sección que deseás consultar o gestionar.</Text>
          </div>

          <div className="space-y-2 md:space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {secciones.map((sec) => (
              <Link
                key={sec.title}
                href={sec.href}
                className={`group block bg-white p-3 md:p-4 rounded-xl md:rounded-[28px] border border-slate-200 shadow-sm transition-all duration-300 overflow-hidden relative ${
                  sec.proximamente
                    ? 'opacity-60 pointer-events-none'
                    : 'hover:shadow-lg hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3 md:gap-6 relative z-10">
                  {/* Icono */}
                  <div className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg md:rounded-[22px] group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
                    {sec.icon}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Heading level={4} className="md:text-xl text-slate-900 tracking-tight mb-0.5 md:mb-1 group-hover:text-emerald-600 transition-colors">
                        {sec.title}
                      </Heading>
                      {sec.proximamente && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          Próximamente
                        </span>
                      )}
                    </div>
                    <Text variant="bodySm" className="text-slate-500 font-medium leading-relaxed max-w-2xl hidden md:block">
                      {sec.desc}
                    </Text>
                  </div>

                  {/* Acción */}
                  {!sec.proximamente && (
                    <div className="shrink-0">
                      <div className="flex items-center gap-1 px-3 md:px-6 py-1.5 md:py-3 bg-slate-50 text-slate-400 rounded-lg md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm whitespace-nowrap">
                        Gestionar <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform hidden md:block" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Decoración sutil */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all"></div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
