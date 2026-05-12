"use client";
import { useState } from "react";

export default function LiquidacionModal({ consignacion, onClose, onConfirm, isSubmitting }) {
  const [motivo, setMotivo] = useState("VENTA");
  const [comprobante, setComprobante] = useState("");
  const [itemsLiquidar, setItemsLiquidar] = useState([]);

  const handleItemChange = (itemSalidaId, val) => {
    setItemsLiquidar((prev) => {
      const idx = prev.findIndex((it) => it.item_salida === itemSalidaId);
      if (idx > -1) {
        const newItems = [...prev];
        newItems[idx].cantidad_liquidada = val;
        return newItems;
      }
      return [...prev, { item_salida: itemSalidaId, cantidad_liquidada: val }];
    });
  };

  const handleConfirm = () => {
    const validItems = itemsLiquidar.filter((it) => it.cantidad_liquidada > 0);
    if (validItems.length === 0) return alert("Ingresa cantidades a liquidar");
    
    onConfirm({
      salida_original: consignacion.id,
      motivo: motivo,
      comprobante_venta: comprobante,
      items: validItems,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Liquidar Stock
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Ventas y cierres parciales
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all"
          >
            ✕
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Motivo
              </label>
              <select
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                onChange={(e) => setMotivo(e.target.value)}
                value={motivo}
              >
                <option value="VENTA">Venta / Consumo</option>
                <option value="PERDIDA">Pérdida / Rotura</option>
                <option value="MUESTRA">Muestra Médica</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Comprobante
              </label>
              <input
                type="text"
                placeholder="Nro Factura/Recibo"
                className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                onChange={(e) => setComprobante(e.target.value)}
                value={comprobante}
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Items a liquidar
            </label>
            {consignacion.items.map((item, i) => {
              const pendiente =
                item.cantidad -
                (item.cantidad_devuelta + item.cantidad_liquidada);
              if (pendiente <= 0) return null;
              
              return (
                <div
                  key={i}
                  className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between"
                >
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-800">
                      {item.variante_nombre}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      Restan: {pendiente} u.
                    </p>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min="0"
                      max={pendiente}
                      placeholder="0"
                      className="w-full h-10 bg-white border border-slate-200 rounded-xl text-center font-black text-blue-600 outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        handleItemChange(item.id, val);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Procesando..." : "Confirmar Liquidación"}
          </button>
        </div>
      </div>
    </div>
  );
}
