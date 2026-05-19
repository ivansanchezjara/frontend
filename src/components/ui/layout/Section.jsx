import { Text } from "../basics/Typography";

/**
 * Componente Section estandarizado.
 * Contenedor con cabecera unificada, bordes finos, sombra sutil y soporte
 * opcional para descripciones secundarias (subtitle) y botones de acción (action).
 */
export default function Section({ title, subtitle, action, children }) {
  return (
    <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 select-none">
        <div>
          <Text as="h2" variant="label" className="text-slate-500 font-black">
            {title}
          </Text>
          {subtitle && (
            <Text variant="bodySm" className="mt-0.5 text-[11px] text-slate-400">
              {subtitle}
            </Text>
          )}
        </div>
        {action && (
          <div className="flex items-center shrink-0">
            {action}
          </div>
        )}
      </div>
      {children}
    </section>
  );
}
