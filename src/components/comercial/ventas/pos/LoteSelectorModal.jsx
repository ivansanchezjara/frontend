"use client";
import { useState, useEffect, useMemo } from "react";
import { Package, Calendar, AlertTriangle, Check, RotateCcw, Warehouse } from "lucide-react";
import Modal from "@/components/ui/feedback/Modal";
import { Button, Badge } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { getLotesPorVarianteId } from "@/services/apis/inventario";

/**
 * Modal para seleccionar/reasignar lotes a una línea de venta.
 * Muestra TODOS los lotes disponibles (de todos los depósitos) con columna de depósito.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - variante: { variante_id, nombre, nombre_variante, product_code }
 * - cantidadRequerida: number — cantidad total que debe cubrirse
 * - asignacionesActuales: [{ lote: id, cantidad }] — asignaciones existentes
 * - onConfirmar: (asignaciones: [{ lote, lote_codigo, vencimiento, deposito_nombre, cantidad }]) => void
 */
export default function LoteSelectorModal({
  open,
  onClose,
  variante,
  cantidadRequerida,
  asignacionesActuales = [],
  onConfirmar,
}) {
  const { data: lotesRaw, loading, execute: fetchLotes } = useApi(getLotesPorVarianteId);
  const [asignaciones, setAsignaciones] = useState({});

  // Cargar lotes al abrir (todos los depósitos)
  useEffect(() => {
    if (open && variante?.variante_id) {
      fetchLotes(variante.variante_id);
    }
  }, [open, variante?.variante_id, fetchLotes]);

  // Inicializar asignaciones con las actuales
  useEffect(() => {
    if (open) {
      const map = {};
      asignacionesActuales.forEach((a) => {
        map[a.lote] = a.cantidad;
      });
      setAsignaciones(map);
    }
  }, [open, asignacionesActuales]);

  const lotes = useMemo(() => {
    const items = Array.isArray(lotesRaw) ? lotesRaw : (lotesRaw?.results || []);
    // Solo lotes con stock > 0, ordenados por vencimiento (FEFO)
    return items
      .filter((l) => l.cantidad > 0)
      .sort((a, b) => {
        if (!a.vencimiento) return 1;
        if (!b.vencimiento) return -1;
        return a.vencimiento.localeCompare(b.vencimiento);
      });
  }, [lotesRaw]);

  const totalAsignado = useMemo(
    () => Object.values(asignaciones).reduce((s, v) => s + (v || 0), 0),
    [asignaciones]
  );

  const faltante = cantidadRequerida - totalAsignado;

  // ─── Handlers ─────────────────────────────────────────────────

  const handleCantidadChange = (loteId, value, maxStock) => {
    const num = Math.max(0, Math.min(parseInt(value, 10) || 0, maxStock));
    setAsignaciones((prev) => {
      const next = { ...prev };
      if (num === 0) {
        delete next[loteId];
      } else {
        next[loteId] = num;
      }
      return next;
    });
  };

  const handleAutoFEFO = () => {
    let restante = cantidadRequerida;
    const nuevas = {};
    for (const lote of lotes) {
      if (restante <= 0) break;
      if (isVencido(lote.vencimiento)) continue;
      const asignar = Math.min(restante, lote.cantidad);
      nuevas[lote.id] = asignar;
      restante -= asignar;
    }
    setAsignaciones(nuevas);
  };

  const handleConfirmar = () => {
    const resultado = Object.entries(asignaciones)
      .filter(([, cant]) => cant > 0)
      .map(([loteId, cantidad]) => {
        const lote = lotes.find((l) => l.id === Number(loteId));
        return {
          lote: Number(loteId),
          lote_codigo: lote?.lote_codigo || "",
          vencimiento: lote?.vencimiento || null,
          deposito_nombre: lote?.deposito_nombre || "",
          cantidad,
        };
      });
    onConfirmar(resultado);
    onClose();
  };

  const formatFecha = (fecha) => {
    if (!fecha) return "Sin vencimiento";
    return new Date(fecha + "T00:00:00").toLocaleDateString("es-PY", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const isVencido = (fecha) => {
    if (!fecha) return false;
    return new Date(fecha) < new Date();
  };

  return (
    <Modal open={open} onClose={onClose} title="Seleccionar Lotes" size="xl">
      <div className="p-6 space-y-4">
        {/* Info del producto */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <Package size={16} className="text-slate-400" />
          <div>
            <p className="text-sm font-semibold text-slate-800">
              {variante?.nombre}
              {variante?.nombre_variante && (
                <span className="text-slate-500 font-normal ml-1">
                  · {variante.nombre_variante}
                </span>
              )}
            </p>
            <p className="text-xs text-slate-400 font-mono">{variante?.product_code}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-400">Cantidad requerida</p>
            <p className="text-lg font-bold text-slate-800">{cantidadRequerida}</p>
          </div>
        </div>

        {/* Indicador de estado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {faltante === 0 ? (
              <Badge variant="success" className="text-xs">
                <Check size={12} className="mr-1" />
                Asignación completa
              </Badge>
            ) : faltante > 0 ? (
              <Badge variant="warning" className="text-xs">
                <AlertTriangle size={12} className="mr-1" />
                Faltan {faltante} unidades
              </Badge>
            ) : (
              <Badge variant="danger" className="text-xs">
                <AlertTriangle size={12} className="mr-1" />
                Exceso de {Math.abs(faltante)} unidades
              </Badge>
            )}
          </div>
          <Button
            variant="secondary"
            size="xs"
            icon={RotateCcw}
            onClick={handleAutoFEFO}
          >
            Auto FEFO
          </Button>
        </div>

        {/* Lista de lotes */}
        {loading ? (
          <div className="py-8 text-center">
            <Text variant="bodySm" className="text-slate-400">
              Cargando lotes disponibles...
            </Text>
          </div>
        ) : lotes.length === 0 ? (
          <div className="py-8 text-center">
            <Text variant="bodySm" className="text-slate-400">
              No hay lotes con stock disponible para este producto.
            </Text>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-100">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr>
                  <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-500 tracking-wide">
                    Lote
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-500 tracking-wide">
                    Depósito
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-500 tracking-wide">
                    Vencimiento
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-500 tracking-wide text-center">
                    Disponible
                  </th>
                  <th className="py-2.5 px-3 text-[10px] font-black uppercase text-slate-500 tracking-wide text-center">
                    Asignar
                  </th>
                </tr>
              </thead>
              <tbody>
                {lotes.map((lote) => {
                  const vencido = isVencido(lote.vencimiento);
                  const asignado = asignaciones[lote.id] || 0;
                  return (
                    <tr
                      key={lote.id}
                      className={`border-t border-slate-50 transition-colors ${
                        asignado > 0 ? "bg-emerald-50/50" : "hover:bg-slate-50/50"
                      } ${vencido ? "opacity-60" : ""}`}
                    >
                      <td className="py-2.5 px-3">
                        <span className="text-sm font-mono font-semibold text-slate-700">
                          {lote.lote_codigo}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          <Warehouse size={11} className="text-slate-400" />
                          <span className="text-xs font-medium text-slate-600">
                            {lote.deposito_nombre}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className={vencido ? "text-red-400" : "text-slate-400"} />
                          <span className={`text-sm ${vencido ? "text-red-600 font-semibold" : "text-slate-600"}`}>
                            {formatFecha(lote.vencimiento)}
                          </span>
                          {vencido && (
                            <Badge variant="danger" className="text-[9px] px-1.5 py-0">
                              Vencido
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="text-sm font-semibold text-slate-700">
                          {lote.cantidad}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          max={lote.cantidad}
                          value={asignado || ""}
                          onChange={(e) => handleCantidadChange(lote.id, e.target.value, lote.cantidad)}
                          placeholder="0"
                          className="w-16 text-center text-sm font-semibold border border-slate-200 rounded-lg py-1 px-2 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none transition-all"
                          disabled={vencido}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="success"
            size="sm"
            onClick={handleConfirmar}
            disabled={faltante !== 0}
          >
            Confirmar asignación
          </Button>
        </div>
      </div>
    </Modal>
  );
}
