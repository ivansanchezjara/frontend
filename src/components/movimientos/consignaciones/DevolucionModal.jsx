"use client";
import { useState } from "react";

export default function DevolucionModal({ consignacion, depositos, onClose, onConfirm, isSubmitting }) {
  const [depositoDestino, setDepositoDestino] = useState(depositos[0]?.id || "");
  const [itemsDevolver, setItemsDevolver] = useState([]);

  const handleItemChange = (itemSalidaId, val) => {
    setItemsDevolver((prev) => {
      const idx = prev.findIndex((it) => it.item_salida === itemSalidaId);
      if (idx > -1) {
        const newItems = [...prev];
        newItems[idx].cantidad_devuelta = val;
        return newItems;
      }
      return [...prev, { item_salida: itemSalidaId, cantidad_devuelta: val }];
    });
  };

  const handleConfirm = () => {
    const validItems = itemsDevolver.filter((it) => it.cantidad_devuelta > 0);
    if (validItems.length === 0) return alert("Ingresa cantidades a devolver");
    
    onConfirm({
      salida_original: consignacion.id,
      deposito_destino: depositoDestino,
      items: validItems,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              Retorno de Mercadería
            </h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Registrar ingreso a depósito
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
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Depósito de Destino
            </label>
            <select
              className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              onChange={(e) => setDepositoDestino(e.target.value)}
              value={depositoDestino}
            >
              {depositos.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Items a devolver
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
                    <p className="text-[9px] font-black text-blue-500 uppercase">
                      {item.lote_codigo}
                    </p>
                    <p className="text-sm font-black text-slate-800">
                      {item.variante_nombre}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400">
                      Pendiente: {pendiente} u.
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
            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Procesando..." : "Confirmar Retorno"}
          </button>
        </div>
      </div>
    </div>
  );
}
