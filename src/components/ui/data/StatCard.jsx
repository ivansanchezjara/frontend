import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Text } from "@/components/ui/basics/Typography";
import { cn } from "@/lib/utils";

/**
 * Tarjeta de estadística compacta con icono, valor principal y subtexto.
 * Opcionalmente enlaza a una página de detalle.
 *
 * @param {React.ElementType} icon - Componente de icono (lucide-react)
 * @param {string} iconBg - Clase de fondo del contenedor del icono (e.g. "bg-emerald-50")
 * @param {string} iconColor - Clase de color del icono (e.g. "text-emerald-600")
 * @param {string} label - Etiqueta superior (texto pequeño)
 * @param {string|number} value - Valor principal destacado
 * @param {string} [subtext] - Texto secundario al lado del valor
 * @param {string} [href] - URL destino (convierte la tarjeta en enlace)
 * @param {string} [className] - Clases adicionales
 */
export default function StatCard({ icon: Icon, iconBg, iconColor, label, value, subtext, href, className }) {
  const Wrapper = href ? Link : "div";
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm",
        href && "hover:border-emerald-200 hover:shadow-md transition-all group cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className={cn("inline-flex h-10 w-10 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-5 w-5", iconColor)} />
        </span>
        <div className="flex-1 min-w-0">
          <Text variant="label" as="span" className="text-slate-400">
            {label}
          </Text>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-black text-slate-800">{value}</span>
            {subtext && (
              <Text variant="bodyXs" as="span" className="text-slate-500 truncate">
                {subtext}
              </Text>
            )}
          </div>
        </div>
        {href && (
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
        )}
      </div>
    </Wrapper>
  );
}
