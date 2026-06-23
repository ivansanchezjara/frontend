import { PageHeader, Heading, Text } from '@/components/ui';
import Link from 'next/link';
import { User, Building2, ArrowRight, Settings } from 'lucide-react';

export default function ConfiguracionesHubPage() {
  const secciones = [
    {
      href: '/configuraciones/perfil',
      icon: <User size={32} />,
      title: 'Mi Cuenta',
      desc: 'Datos personales, correo electrónico y foto de perfil.',
    },
    {
      href: '/configuraciones/empresa',
      icon: <Building2 size={32} />,
      title: 'Mi Empresa',
      desc: 'Datos fiscales, logo, contacto y preferencias de visualización.',
      superuserOnly: true,
    },
  ];

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        title="Configuraciones"
        subtitle={
          <>
            <Settings size={12} />
            Cuenta y preferencias del sistema
          </>
        }
      />

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-10">
            <Heading level={2} className="text-slate-900 tracking-tight">Centro de Configuración</Heading>
            <Text className="text-slate-500 font-medium">Seleccioná la sección que deseás gestionar.</Text>
          </div>

          <div className="space-y-2 md:space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {secciones.map((sec) => (
              <Link
                key={sec.href}
                href={sec.href}
                className="group block bg-white p-3 md:p-4 rounded-xl md:rounded-[28px] border border-slate-200 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all duration-300 overflow-hidden relative"
              >
                <div className="flex items-center gap-3 md:gap-6 relative z-10">
                  {/* Icono */}
                  <div className="w-14 h-14 md:w-20 md:h-20 flex items-center justify-center bg-slate-100 text-slate-600 rounded-lg md:rounded-[22px] group-hover:bg-slate-700 group-hover:text-white transition-all duration-300 shadow-sm shrink-0">
                    {sec.icon}
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 min-w-0">
                    <Heading level={4} className="md:text-xl text-slate-900 tracking-tight mb-0.5 md:mb-1 group-hover:text-slate-700 transition-colors">
                      {sec.title}
                    </Heading>
                    <Text variant="bodySm" className="text-slate-500 font-medium leading-relaxed max-w-2xl hidden md:block">
                      {sec.desc}
                    </Text>
                  </div>

                  {/* Acción */}
                  <div className="shrink-0">
                    <div className="flex items-center gap-1 px-3 md:px-6 py-1.5 md:py-3 bg-slate-50 text-slate-400 rounded-lg md:rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest group-hover:bg-slate-700 group-hover:text-white transition-all shadow-sm whitespace-nowrap">
                      Gestionar <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform hidden md:block" />
                    </div>
                  </div>
                </div>

                {/* Decoración sutil */}
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-slate-500/5 rounded-full blur-2xl group-hover:bg-slate-500/10 transition-all"></div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
