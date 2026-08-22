"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Modal, Input, Field, Button, SearchBar, useToast } from "@/components/ui";
import { getGastos } from "@/services/apis/finanzas";
import { vincularPagoOrden } from "@/services/apis/compras";

function formatUSD(v) {
  if (v == null) return "—";
  return `US$ ${Number(v).toLocaleString("es-PY", { minimumFractionDigits: 2 })}`;
}

function formatFecha(f) {
  if (!f) return "—";
  return new Date(f).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Modal para vincular un gasto existente (ya registrado en Egresos) a una OC.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - ordenId: number
 * - pagosVinculados: array de pagos existentes (para excluir del search)
 * - onSuccess: () => void
 */
export default function VincularPagoModal({ open, onClose, ordenId, pagosVinculados = [], onSuccess }) {
  const { showToast } = useToast();
  const [gastoSeleccionado, setGastoSeleccionado] = useState(null);
  const [pagoData, setPagoData] = useState({ tipo_costo: "mercaderia", concepto_pago: "" });
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const timeout = useRef(null);

  // Búsqueda con debounce
  useEffect(() => {
    if (!open) return;
    if (!busqueda.trim()) { setResultados([]); return; }
    setBuscando(true);
    clearTimeout(timeout.current);
    timeout.current = setTimeout(async () => {
      try {
        const res = await getGastos({ search: busqueda, estado: "pagado" });
        const lista = res.results || res;
        const idsVinculados = pagosVinculados.map((p) => p.gasto_id);
        setResultados(lista.filter((g) => !idsVinculados.includes(g.id)));
      } catch { setResultados([]); }
      finally { setBuscando(false); }
    }, 350);
    return () => clearTimeout(timeout.current);
  }, [busqueda, open, pagosVinculados]);

  const handleVincular = async () => {
    if (!gastoSeleccionado) { showToast("Seleccioná un gasto", "error"); return; }
    if (!pagoData.concepto_pago || !pagoData.tipo_costo) { showToast("Completá tipo y concepto", "error"); return; }
    try {
      await vincularPagoOrden(ordenId, {
        gasto_id: gastoSeleccionado.id,
        tipo_costo: pagoData.tipo_costo,
        concepto_pago: pagoData.concepto_pago,
      });
      showToast("Pago vinculado", "success");
      handleClose();
      onSuccess?.();
    } catch (e) { showToast(e.message || "Error", "error"); }
  };

  const handleClose = () => {
    setGastoSeleccionado(null);
    setBusqueda("");
    setResultados([]);
    setPagoData({ tipo_costo: "mercaderia", concepto_pago: "" });
    onClose();
  };

  return (
    <Modal open={open} title="Vincular Pago Existente" size="lg" onClose={handleClose}>
      <div className="space-y-4 p-4">
        <Field label="Buscar Gasto (de Egresos)">
          <SearchBar value={busqueda} onChange={setBusqueda} placeholder="Buscar por concepto..." />
        </Field>

        {gastoSeleccionado && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
            <div>
              <p className="text-sm font-medium text-blue-900">{gastoSeleccionado.concepto}</p>
              <p className="text-xs text-blue-600">{formatUSD(gastoSeleccionado.monto_usd)} · {formatFecha(gastoSeleccionado.fecha_gasto)}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setGastoSeleccionado(null)}>Cambiar</Button>
          </div>
        )}

        {!gastoSeleccionado && busqueda.trim() && (
          <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
            {buscando ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" />Buscando...
              </div>
            ) : resultados.length > 0 ? (
              resultados.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGastoSeleccionado(g)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{g.concepto}</p>
                    <p className="text-xs text-slate-500">{formatFecha(g.fecha_gasto)}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 ml-3">{formatUSD(g.monto_usd)}</span>
                </button>
              ))
            ) : (
              <div className="py-6 text-center text-sm text-slate-400">Sin resultados.</div>
            )}
          </div>
        )}

        <Field label="Tipo de Costo">
          <select
            value={pagoData.tipo_costo}
            onChange={(e) => setPagoData((p) => ({ ...p, tipo_costo: e.target.value }))}
            className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
          >
            <option value="mercaderia">Mercadería (FOB)</option>
            <option value="flete">Flete Internacional</option>
            <option value="seguro">Seguro</option>
            <option value="aduana">Aduana / Despacho</option>
            <option value="flete_interno">Flete Interno</option>
            <option value="otro">Otros</option>
          </select>
        </Field>
        <Field label="Concepto">
          <Input
            value={pagoData.concepto_pago}
            onChange={(e) => setPagoData((p) => ({ ...p, concepto_pago: e.target.value }))}
            placeholder="Detalle del pago..."
          />
        </Field>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleVincular} disabled={!gastoSeleccionado}>Vincular</Button>
        </div>
      </div>
    </Modal>
  );
}
