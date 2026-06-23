"use client";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

const ESTADO_BADGE_MAP = {
  borrador: { variant: "default", label: "Borrador" },
  enviado: { variant: "info", label: "Enviado" },
  aceptado: { variant: "success", label: "Aceptado" },
  rechazado: { variant: "danger", label: "Rechazado" },
  vencido: { variant: "warning", label: "Vencido" },
};

const TIPO_BADGE_MAP = {
  pipeline: { className: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "Pipeline" },
  directo: { className: "bg-amber-50 text-amber-700 border-amber-200", label: "Directo" },
};

function formatMonto(monto, moneda = "USD") {
  if (!monto || Number(monto) === 0) return "—";
  const num = Number(monto);
  if (moneda === "PYG") return num.toLocaleString("es-PY") + " ₲";
  return "USD " + num.toLocaleString("en-US", { minimumFractionDigits: 2 });
}

function diasRestantes(enviado_at, vigencia_dias) {
  if (!enviado_at || !vigencia_dias) return null;
  const enviado = new Date(enviado_at);
  const vence = new Date(enviado.getTime() + vigencia_dias * 24 * 60 * 60 * 1000);
  return Math.ceil((vence - new Date()) / (1000 * 60 * 60 * 24));
}

function VigenciaChip({ enviado_at, vigencia_dias, estado }) {
  if (estado !== "enviado") return <span className="text-xs text-slate-300">—</span>;
  const dias = diasRestantes(enviado_at, vigencia_dias);
  if (dias === null) return <span className="text-xs text-slate-300">—</span>;

  const vencido = dias < 0;
  const urgente = dias >= 0 && dias <= 3;

  return (
    <span
      className={cn(
        "text-xs font-semibold px-2 py-0.5 rounded-full",
        vencido ? "bg-red-50 text-red-600" :
        urgente ? "bg-amber-50 text-amber-600" :
        "bg-slate-100 text-slate-500"
      )}
    >
      {vencido ? `Venció hace ${Math.abs(dias)}d` : `${dias}d restantes`}
    </span>
  );
}

/**
 * Tabla de presupuestos. Cada fila navega a la página dedicada del presupuesto.
 */
export default function PresupuestosTable({ presupuestos }) {
  const router = useRouter();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 text-slate-500">
            {[
              { label: "Oportunidad", className: "py-3 pl-6 pr-4" },
              { label: "Cliente", className: "py-3 px-4" },
              { label: "Tipo", className: "py-3 px-4 text-center" },
              { label: "Versión", className: "py-3 px-4 text-center" },
              { label: "Estado", className: "py-3 px-4 text-center" },
              { label: "Total", className: "py-3 px-4 text-right" },
              { label: "Vendedor", className: "py-3 px-4 hidden md:table-cell" },
              { label: "Vigencia", className: "py-3 px-4 hidden lg:table-cell" },
              { label: "Fecha", className: "py-3 pr-6 pl-4" },
            ].map(({ label, className }) => (
              <th key={label} className={cn("text-[11px] font-black uppercase tracking-widest", className)}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {presupuestos.map((p) => {
            const estadoBadge = ESTADO_BADGE_MAP[p.estado] || { variant: "default", label: p.estado };
            const tipoBadge = TIPO_BADGE_MAP[p.tipo] || TIPO_BADGE_MAP.pipeline;

            return (
              <tr
                key={p.id}
                onClick={() => router.push(`/ventas-crm/presupuestos/${p.id}`)}
                className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <td className="py-3 pl-6 pr-4">
                  {p.tipo === "directo" ? (
                    <span className="text-sm text-slate-500">Venta directa</span>
                  ) : p.oportunidad ? (
                    <a
                      href={`/ventas-crm/oportunidades/${p.oportunidad}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      {p.oportunidad_titulo || `Oportunidad #${p.oportunidad}`}
                    </a>
                  ) : (
                    <span className="text-sm text-slate-500">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-slate-600">{p.cliente_razon_social}</span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                      tipoBadge.className
                    )}
                  >
                    {tipoBadge.label}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    v{p.version}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm font-semibold text-slate-800">
                    {formatMonto(p.total, p.moneda)}
                  </span>
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  <span className="text-sm text-slate-600">{p.vendedor_nombre || "—"}</span>
                </td>
                <td className="py-3 px-4 hidden lg:table-cell">
                  <VigenciaChip
                    enviado_at={p.enviado_at}
                    vigencia_dias={p.vigencia_dias}
                    estado={p.estado}
                  />
                </td>
                <td className="py-3 pr-6 pl-4">
                  <span className="text-xs text-slate-400">
                    {p.created_at
                      ? new Date(p.created_at).toLocaleDateString("es-PY", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })
                      : "—"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
