"use client";
import { RotateCcw } from "lucide-react";

export default function ConsignacionDevoluciones({ devoluciones, isAprobandoDev, onAprobarDevolucion }) {
  if (!devoluciones || devoluciones.length === 0) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <p className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-xs italic">
          No hay retornos registrados para esta salida.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 gap-4">
        {devoluciones.map((dev) => (
          <div key={dev.id} className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${dev.estado === 'APROBADO' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-500'}`}>
                <RotateCcw size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Devolución #{dev.id}</p>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${dev.estado === 'APROBADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{dev.estado}</span>
                </div>
                <h4 className="font-black text-slate-800">Vuelve a: {dev.deposito_destino_nombre}</h4>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-bold text-slate-400">{new Date(dev.fecha_devolucion).toLocaleString()}</p>
                  <span className="text-[10px] text-slate-300">•</span>
                  <p className="text-[10px] font-black text-blue-500 uppercase">{dev.usuario_nombre}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase">Items devueltos</p>
                <div className="flex -space-x-2">
                  {dev.items.map((it, idx) => (
                    <div key={idx} className="w-8 h-8 rounded-full bg-white border-2 border-slate-50 flex items-center justify-center text-[10px] font-black text-slate-600 shadow-sm" title={`${it.variante_nombre}: ${it.cantidad_devuelta}u.`}>
                      {it.cantidad_devuelta}
                    </div>
                  ))}
                </div>
              </div>
              {dev.estado === 'BORRADOR' && (
                <button
                  onClick={() => onAprobarDevolucion(dev.id)}
                  disabled={isAprobandoDev}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAprobandoDev ? "Aprobando..." : "Aprobar Ingreso"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
