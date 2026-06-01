"use client";
import { useState, useMemo } from "react";
import { Button, Field } from "@/components/ui";
import { useToast } from "@/components/ui";
import { emitirNotaCredito } from "@/services/apis/caja";
import { X, FileText, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EmitirNotaCreditoModal({ factura, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [motivo, setMotivo] = useState("");
  const [lineas, setLineas] = useState(() =>
    (factura?.lineas || []).map((l) => ({
      variante_id: l.variante || l.variante_id,
      variante_nombre: l.variante_nombre || l.descripcion || "",
      cantidad: l.cantidad,
      precio_unitario: l.precio_unitario,
      incluida: true,
    }))
  );
  const [submitting, setSubmitting] = useState(false);

  // Calcular saldo pendiente: total factura - sum de NCs previas
  const saldoPendiente = useMemo(() => {
    const totalNcPrevias = (factura?.notas_credito || []).reduce(
      (sum, nc) => sum + (nc.total || 0),
      0
    );
    return (factura?.total || 0) - totalNcPrevias;
  }, [factura]);

  // Calcular total de la NC actual
  const totalNC = useMemo(() => {
    return lineas.reduce((sum, l) => {
      if (!l.incluida) return sum;
      return sum + l.cantidad * l.precio_unitario;
    }, 0);
  }, [lineas]);

  const excedeSaldo = totalNC > saldoPendiente;
  const sinLineas = lineas.filter((l) => l.incluida).length === 0;

  const handleCantidadChange = (index, value) => {
    const nuevasLineas = [...lineas];
    const parsed = parseInt(value, 10);
    nuevasLineas[index] = {
      ...nuevasLineas[index],
      cantidad: isNaN(parsed) || parsed < 0 ? 0 : parsed,
    };
    setLineas(nuevasLineas);
  };

  const handlePrecioChange = (index, value) => {
    const nuevasLineas = [...lineas];
    const parsed = parseInt(value, 10);
    nuevasLineas[index] = {
      ...nuevasLineas[index],
      precio_unitario: isNaN(parsed) || parsed < 0 ? 0 : parsed,
    };
    setLineas(nuevasLineas);
  };

  const handleToggleLinea = (index) => {
    const nuevasLineas = [...lineas];
    nuevasLineas[index] = {
      ...nuevasLineas[index],
      incluida: !nuevasLineas[index].incluida,
    };
    setLineas(nuevasLineas);
  };

  const handleSubmit = async () => {
    if (!motivo.trim()) {
      showToast("Debe ingresar un motivo para la nota de crédito", "error");
      return;
    }
    if (sinLineas) {
      showToast("Debe incluir al menos una línea", "error");
      return;
    }
    if (excedeSaldo) {
      showToast("El monto total excede el saldo pendiente de la factura", "error");
      return;
    }
    if (totalNC <= 0) {
      showToast("El monto total debe ser mayor a cero", "error");
      return;
    }

    setSubmitting(true);
    try {
      const lineasPayload = lineas
        .filter((l) => l.incluida && l.cantidad > 0)
        .map((l) => ({
          variante_id: l.variante_id,
          cantidad: l.cantidad,
          precio_unitario: l.precio_unitario,
        }));

      await emitirNotaCredito({
        factura_original: factura.id,
        lineas: lineasPayload,
        motivo: motivo.trim(),
      });

      showToast("Nota de crédito emitida exitosamente", "success");
      onSuccess?.();
      onClose?.();
    } catch (error) {
      showToast(
        error?.message || "Error al emitir la nota de crédito",
        "error"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formatMonto = (monto) => {
    return new Intl.NumberFormat("es-PY").format(monto);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white max-w-2xl w-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 shrink-0 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <FileText size={18} className="text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Emitir Nota de Crédito
              </h3>
              <p className="text-xs text-slate-500">
                Factura: {factura?.numero_completo}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Datos de factura original */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Datos de Factura Original
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">Número</p>
                <p className="text-sm font-bold text-slate-800">
                  {factura?.numero_completo}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Factura</p>
                <p className="text-sm font-bold text-slate-800">
                  ₲ {formatMonto(factura?.total || 0)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Saldo Pendiente</p>
                <p className="text-sm font-bold text-emerald-700">
                  ₲ {formatMonto(saldoPendiente)}
                </p>
              </div>
            </div>
          </div>

          {/* Motivo */}
          <div>
            <Field label="Motivo de la Nota de Crédito *">
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Describa el motivo de la nota de crédito..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 resize-none"
              />
            </Field>
          </div>

          {/* Líneas */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Líneas a Devolver / Corregir
            </p>
            <div className="space-y-2">
              {lineas.map((linea, index) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border transition-all",
                    linea.incluida
                      ? "bg-white border-slate-200"
                      : "bg-slate-50 border-slate-100 opacity-50"
                  )}
                >
                  {/* Toggle inclusión */}
                  <button
                    type="button"
                    onClick={() => handleToggleLinea(index)}
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                      linea.incluida
                        ? "bg-blue-600 border-blue-600 text-white"
                        : "border-slate-300 bg-white"
                    )}
                  >
                    {linea.incluida && (
                      <svg
                        width="10"
                        height="8"
                        viewBox="0 0 10 8"
                        fill="none"
                      >
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Nombre variante */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {linea.variante_nombre}
                    </p>
                  </div>

                  {/* Cantidad */}
                  <div className="w-20">
                    <input
                      type="number"
                      min="0"
                      value={linea.cantidad}
                      onChange={(e) =>
                        handleCantidadChange(index, e.target.value)
                      }
                      disabled={!linea.incluida}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-center font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
                      placeholder="Cant."
                    />
                  </div>

                  {/* Precio unitario */}
                  <div className="w-28">
                    <input
                      type="number"
                      min="0"
                      value={linea.precio_unitario}
                      onChange={(e) =>
                        handlePrecioChange(index, e.target.value)
                      }
                      disabled={!linea.incluida}
                      className="w-full px-2 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm text-right font-medium text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all disabled:opacity-50"
                      placeholder="Precio"
                    />
                  </div>

                  {/* Subtotal */}
                  <div className="w-28 text-right">
                    <p className="text-sm font-bold text-slate-700">
                      ₲ {formatMonto(linea.incluida ? linea.cantidad * linea.precio_unitario : 0)}
                    </p>
                  </div>
                </div>
              ))}

              {lineas.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <p className="text-sm">
                    No hay líneas disponibles en la factura original.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Total NC y validación */}
          <div
            className={cn(
              "rounded-xl p-4 border",
              excedeSaldo
                ? "bg-red-50 border-red-200"
                : "bg-blue-50 border-blue-200"
            )}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">
                Total Nota de Crédito
              </p>
              <p
                className={cn(
                  "text-lg font-bold",
                  excedeSaldo ? "text-red-600" : "text-blue-700"
                )}
              >
                ₲ {formatMonto(totalNC)}
              </p>
            </div>
            {excedeSaldo && (
              <div className="flex items-center gap-2 mt-2">
                <AlertCircle size={14} className="text-red-500 shrink-0" />
                <p className="text-xs text-red-600">
                  El monto excede el saldo pendiente de ₲{" "}
                  {formatMonto(saldoPendiente)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={
              submitting || excedeSaldo || sinLineas || !motivo.trim() || totalNC <= 0
            }
            icon={FileText}
          >
            {submitting ? "Emitiendo..." : "Emitir Nota de Crédito"}
          </Button>
        </div>
      </div>
    </div>
  );
}
