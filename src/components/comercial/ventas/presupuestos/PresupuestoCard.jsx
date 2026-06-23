"use client";
import {
  FileText, Send, Check, X, RefreshCw, ExternalLink, Loader2,
  Clock, CalendarDays, StickyNote, Copy, Download,
} from "lucide-react";
import { Button, Badge, Text } from "@/components/ui";
import { useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  ESTADO_BADGE, formatMonto, formatFechaCorta, calcVigencia,
} from "./presupuesto-utils";
import { getTextoPresupuesto, descargarPdfPresupuesto } from "@/services/apis/ventas";

/**
 * Card de presupuesto (historial, no editable).
 * Muestra versión, estado, líneas resumidas, notas y acciones según estado/etapa.
 */
export default function PresupuestoCard({
  presupuesto,
  actionLoading,
  onEnviar,
  onAceptar,
  onRechazar,
  onNuevaVersion,
  etapaActual,
}) {
  const {
    id, version, estado, moneda, total, lineas, notas,
    venta_id, created_at, enviado_at, respondido_at, vigencia_dias,
  } = presupuesto;

  const estadoBadge = ESTADO_BADGE[estado] || ESTADO_BADGE.borrador;
  const isLoading = actionLoading && actionLoading.includes(String(id));
  const vigencia = estado === "enviado" ? calcVigencia(enviado_at, vigencia_dias) : null;

  return (
    <div className={cn(
      "border rounded-xl overflow-hidden transition-all",
      estado === "aceptado" && "border-emerald-200 bg-emerald-50/30",
      estado === "rechazado" && "border-red-100",
      estado === "vencido" && "border-amber-200 bg-amber-50/20",
      estado === "enviado" && "border-blue-100",
      estado === "borrador" && "border-slate-200",
    )}>
      {/* Header */}
      <CardHeader
        version={version}
        estadoBadge={estadoBadge}
        vigencia={vigencia}
        created_at={created_at}
        enviado_at={enviado_at}
        respondido_at={respondido_at}
        vigencia_dias={vigencia_dias}
        estado={estado}
      />

      {/* Líneas */}
      {lineas && lineas.length > 0 && (
        <CardLineas lineas={lineas} moneda={moneda} />
      )}

      {/* Notas */}
      {notas && (
        <div className="px-4 py-2 border-t border-slate-100 bg-amber-50/30">
          <div className="flex items-start gap-2">
            <StickyNote className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
            <Text variant="bodyXs" className="text-slate-600 whitespace-pre-line">
              {notas}
            </Text>
          </div>
        </div>
      )}

      {/* Footer */}
      <CardFooter
        id={id}
        estado={estado}
        total={total}
        moneda={moneda}
        lineasCount={lineas?.length || 0}
        venta_id={venta_id}
        etapaActual={etapaActual}
        isLoading={isLoading}
        actionLoading={actionLoading}
        onEnviar={onEnviar}
        onAceptar={onAceptar}
        onRechazar={onRechazar}
        onNuevaVersion={onNuevaVersion}
      />
    </div>
  );
}

// ─── Sub-componentes internos ───────────────────────────────────

function CardHeader({ version, estadoBadge, vigencia, created_at, enviado_at, respondido_at, vigencia_dias, estado }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-50/80 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <FileText className="w-4 h-4 text-slate-400" />
        <Text variant="bodySmBold" as="span">
          Versión {version}
        </Text>
        <Badge variant={estadoBadge.variant} className="text-[10px]">
          {estadoBadge.label}
        </Badge>
        {vigencia && !vigencia.vencido && vigencia.diasRestantes <= 5 && (
          <Badge variant="warning" className="text-[9px]">
            Vence en {vigencia.diasRestantes}d
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3 text-[11px] text-slate-400">
        {created_at && (
          <span className="flex items-center gap-1">
            <CalendarDays className="w-3 h-3" />
            {formatFechaCorta(created_at)}
          </span>
        )}
        {enviado_at && (
          <span className="flex items-center gap-1">
            <Send className="w-3 h-3" />
            {formatFechaCorta(enviado_at)}
          </span>
        )}
        {respondido_at && (
          <span className="flex items-center gap-1">
            {estado === "aceptado"
              ? <Check className="w-3 h-3 text-emerald-500" />
              : <X className="w-3 h-3 text-red-400" />}
            {formatFechaCorta(respondido_at)}
          </span>
        )}
        {vigencia_dias && estado === "enviado" && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {vigencia_dias}d
          </span>
        )}
      </div>
    </div>
  );
}

function CardLineas({ lineas, moneda }) {
  const hayDescuentoExtra = lineas.some(
    (l) => l.descuento_extra_tipo && l.descuento_extra_tipo !== "ninguno" && Number(l.descuento_extra_valor) > 0
  );

  return (
    <div className="px-4 py-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] text-slate-400 uppercase tracking-wide">
            <th className="pb-2 font-bold">Producto</th>
            <th className="pb-2 font-bold text-center">Cant.</th>
            <th className="pb-2 font-bold text-right">Precio</th>
            <th className="pb-2 font-bold text-center">Desc. Tier</th>
            {hayDescuentoExtra && (
              <th className="pb-2 font-bold text-center">Desc. Extra</th>
            )}
            <th className="pb-2 font-bold text-right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {lineas.map((linea) => {
            const tieneExtra = linea.descuento_extra_tipo && linea.descuento_extra_tipo !== "ninguno" && Number(linea.descuento_extra_valor) > 0;
            const precioPublico = Number(linea.precio_publico) || 0;
            const precioUnit = Number(linea.precio_unitario) || 0;
            const tieneDescuento = precioPublico > 0 && precioUnit < precioPublico;

            return (
              <tr key={linea.id} className="border-t border-slate-50">
                <td className="py-2">
                  <span className="text-slate-700 font-medium">
                    {linea.producto_nombre}
                  </span>
                  {linea.variante_nombre && (
                    <span className="text-slate-400 ml-1 text-xs">
                      — {linea.variante_nombre}
                    </span>
                  )}
                  {linea.notas && (
                    <p className="text-[11px] text-amber-600 mt-0.5 italic">
                      {linea.notas}
                    </p>
                  )}
                </td>
                <td className="py-2 text-center text-slate-600">
                  {linea.cantidad}
                </td>
                <td className="py-2 text-right font-mono">
                  {tieneDescuento ? (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="line-through text-slate-400 text-xs">
                        {formatMonto(precioPublico, moneda)}
                      </span>
                      <span className="font-semibold text-emerald-700">
                        {formatMonto(precioUnit, moneda)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-600">
                      {formatMonto(precioPublico > 0 ? precioPublico : precioUnit, moneda)}
                    </span>
                  )}
                </td>
                <td className="py-2 text-center text-slate-500">
                  {Number(linea.descuento_porcentaje) > 0
                    ? <Badge variant="success" className="text-[9px]">-{linea.descuento_porcentaje}%</Badge>
                    : "—"}
                </td>
                {hayDescuentoExtra && (
                  <td className="py-2 text-center text-slate-500">
                    {tieneExtra ? (
                      <Badge variant="warning" className="text-[9px]">
                        -{linea.descuento_extra_valor}{linea.descuento_extra_tipo === "porcentaje" ? "%" : "$"}
                      </Badge>
                    ) : "—"}
                  </td>
                )}
                <td className="py-2 text-right font-mono font-semibold text-slate-700">
                  {formatMonto(linea.subtotal, moneda)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CardFooter({
  id, estado, total, moneda, lineasCount, venta_id,
  etapaActual, isLoading, actionLoading,
  onEnviar, onAceptar, onRechazar, onNuevaVersion,
}) {
  const { showToast } = useToast();

  const handleWhatsApp = async () => {
    try {
      const data = await getTextoPresupuesto(id);
      await navigator.clipboard.writeText(data.texto);
      showToast("Texto copiado al portapapeles", "success");
    } catch {
      showToast("Error al copiar texto", "error");
    }
  };

  const handlePdf = async () => {
    try {
      await descargarPdfPresupuesto(id);
    } catch {
      showToast("Error al descargar PDF", "error");
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-50/50 border-t border-slate-100">
      <div>
        <Text variant="mutedXs" as="span" className="mr-2">Total:</Text>
        <span className="text-base font-bold text-slate-800">
          {formatMonto(total, moneda)}
        </span>
        <Text variant="mutedXs" as="span" className="ml-2">
          ({lineasCount} línea{lineasCount !== 1 ? "s" : ""})
        </Text>
      </div>

      <div className="flex items-center gap-2">
        {/* Compartir — siempre visible si tiene líneas */}
        {estado !== "borrador" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              icon={Copy}
              onClick={handleWhatsApp}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              title="Copiar texto para WhatsApp"
            >
              Copiar texto
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={Download}
              onClick={handlePdf}
              className="text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              title="Descargar PDF"
            >
              PDF
            </Button>
          </>
        )}

        {estado === "borrador" && (
          <Button
            variant="primary"
            size="sm"
            icon={isLoading ? Loader2 : Send}
            onClick={() => onEnviar(id)}
            disabled={!!actionLoading || Number(total) === 0}
            className={isLoading ? "[&_svg]:animate-spin" : ""}
          >
            Enviar
          </Button>
        )}

        {estado === "enviado" && etapaActual === "negociacion" && (
          <>
            <Button
              variant="success"
              size="sm"
              icon={isLoading ? Loader2 : Check}
              onClick={() => onAceptar(id)}
              disabled={!!actionLoading}
              className={isLoading ? "[&_svg]:animate-spin" : ""}
            >
              Aceptar
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={X}
              onClick={() => onRechazar(id)}
              disabled={!!actionLoading}
            >
              Rechazar
            </Button>
          </>
        )}

        {(estado === "rechazado" || estado === "vencido") && etapaActual === "negociacion" && (
          <Button
            variant="secondary"
            size="sm"
            icon={isLoading ? Loader2 : RefreshCw}
            onClick={() => onNuevaVersion(id)}
            disabled={!!actionLoading}
            className={isLoading ? "[&_svg]:animate-spin" : ""}
          >
            Nueva versión
          </Button>
        )}

        {estado === "aceptado" && venta_id && (
          <a
            href={`/ventas-crm/ventas/${venta_id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ver venta generada
          </a>
        )}
      </div>
    </div>
  );
}
