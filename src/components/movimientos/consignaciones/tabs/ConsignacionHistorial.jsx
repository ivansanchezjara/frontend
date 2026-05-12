"use client";

export default function ConsignacionHistorial({ consignacion, resumen }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="relative pl-8 border-l-2 border-slate-100 ml-4 space-y-12">
        {/* Hito: Salida */}
        <div className="relative">
          <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
          <div>
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Inicio Consignación</p>
            <p className="text-sm font-bold text-slate-700">Mercadería enviada a {consignacion.destino}</p>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-slate-400 font-bold">{new Date(consignacion.fecha_salida).toLocaleString()}</p>
              <span className="text-slate-200">•</span>
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{consignacion.usuario_nombre}</p>
            </div>
          </div>
        </div>

        {/* Hitos: Movimientos Intermedios */}
        {[...(consignacion.devoluciones || []), ...(consignacion.liquidaciones || [])]
          .sort((a, b) => new Date(a.fecha_devolucion || a.fecha_liquidacion) - new Date(b.fecha_devolucion || b.fecha_liquidacion))
          .map((mov, idx) => (
            <div key={idx} className="relative">
              <div className={`absolute -left-[41px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm ${mov.fecha_devolucion ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${mov.fecha_devolucion ? 'text-emerald-500' : 'text-blue-500'}`}>
                  {mov.fecha_devolucion ? 'Retorno de Stock' : 'Liquidación / Venta'}
                </p>
                <p className="text-sm font-bold text-slate-700">
                  {mov.fecha_devolucion ? `Ingreso a ${mov.deposito_destino_nombre}` : `Motivo: ${mov.motivo}`}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-[10px] text-slate-400 font-bold">
                    {new Date(mov.fecha_devolucion || mov.fecha_liquidacion).toLocaleString()}
                  </p>
                  <span className="text-slate-200">•</span>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{mov.usuario_nombre}</p>
                </div>
              </div>
            </div>
          ))}

        {resumen?.completado && (
          <div className="relative">
            <div className="absolute -left-[41px] top-0 w-5 h-5 rounded-full bg-emerald-600 border-4 border-white shadow-sm"></div>
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cierre de Operación</p>
              <p className="text-sm font-bold text-slate-800">Consignación finalizada al 100%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
