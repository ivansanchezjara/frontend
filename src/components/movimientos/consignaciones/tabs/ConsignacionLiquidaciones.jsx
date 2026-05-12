"use client";
import { DollarSign } from "lucide-react";

export default function ConsignacionLiquidaciones({ liquidaciones }) {
  if (!liquidaciones || liquidaciones.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <p className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-xs italic">
          No hay liquidaciones registradas aún.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 gap-4">
        {liquidaciones.map((liq) => (
          <div key={liq.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <DollarSign size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Liquidación #{liq.id}</p>
                  <span className="text-[8px] font-black px-2 py-0.5 rounded-full uppercase bg-blue-100 text-blue-700">{liq.motivo}</span>
                </div>
                <h4 className="font-black text-slate-800">{liq.comprobante_venta || 'Sin Comprobante'}</h4>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold text-slate-400">{new Date(liq.fecha_liquidacion).toLocaleString()}</p>
                  <span className="text-[10px] text-slate-300">•</span>
                  <p className="text-[10px] font-black text-blue-500 uppercase">{liq.usuario_nombre}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase">Cantidad Liquidada</p>
              <div className="flex gap-2 justify-end">
                {liq.items.map((it, idx) => (
                  <span key={idx} className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-[10px] font-black">
                    {it.cantidad_liquidada}u.
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
