import Link from "next/link";
import { Button } from "@/components/ui";

/**
 * Enlace rápido estilizado como botón outline con icono.
 * Ideal para barras de accesos rápidos en dashboards.
 *
 * @param {string} href - URL destino
 * @param {React.ElementType} icon - Componente de icono (lucide-react)
 * @param {string} label - Texto del enlace
 * @param {string} [className] - Clases adicionales
 */
export default function QuickLink({ href, icon, label, className }) {
  return (
    <Button
      as={Link}
      href={href}
      variant="outline"
      size="sm"
      icon={icon}
      className={className || "border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700"}
    >
      {label}
    </Button>
  );
}
