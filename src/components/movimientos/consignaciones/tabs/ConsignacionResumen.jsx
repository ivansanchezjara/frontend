"use client";
import { Package } from "lucide-react";

export default function ConsignacionResumen({ items }) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
          Detalle de mercadería enviada
        </h3>
        <div className="grid grid-cols-1 gap-4">
          {items?.map((item, i) => {
            const pendiente = item.cantidad - (item.cantidad_devuelta + item.cantidad_liquidada);
            return (
              <div
                key={i}
                className="p-5 bg-slate-50 border border-slate-100 rounded-[28px] flex items-center justify-between group transition-all hover:bg-white hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <Package size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                        {item.lote_codigo}
                      </p>
                      {pendiente <= 0 && (
                        <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">
                          CERRADO
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-slate-800">
                      {item.variante_nombre}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Origen: {item.deposito_nombre}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Enviado</p>
                    <p className="text-sm font-black text-slate-600">{item.cantidad} u.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-emerald-500 uppercase">Retornado</p>
                    <p className="text-sm font-black text-emerald-600">{item.cantidad_devuelta} u.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-blue-500 uppercase">Liquidado</p>
                    <p className="text-sm font-black text-blue-600">{item.cantidad_liquidada} u.</p>
                  </div>
                  <div className="text-right min-w-[80px] bg-white px-4 py-2 rounded-xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase">Pendiente</p>
                    <p className={`text-lg font-black ${pendiente > 0 ? "text-amber-600" : "text-slate-300"}`}>
                      {pendiente} <span className="text-[10px]">u.</span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
