"use client";
import { useState, useEffect, use } from "react";
import Cookies from "js-cookie";
import LoadingScreen from "@/components/ui/LoadingScreen";
import PageHeader from "@/components/ui/PageHeader";
import {
  Package,
  CheckCircle,
  AlertCircle,
  Clock,
  RotateCcw,
  DollarSign,
  ArrowRight,
  History,
  ClipboardList,
  User,
} from "lucide-react";
import { getApiUrl } from "@/services/api";

export default function DetalleConsignacionPage({ params }) {
  const { id } = use(params);
  const [consignacion, setConsignacion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("resumen"); // resumen, devoluciones, liquidaciones

  // Estados para modales
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [showLiquidacionModal, setShowLiquidacionModal] = useState(false);

  const [depositos, setDepositos] = useState([]);

  const fetchDetail = async () => {
    try {
      const token = Cookies.get("token");
      const API_BASE = getApiUrl();
      const res = await fetch(
        `${API_BASE}/api/inventario/consignaciones/${id}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      setConsignacion(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepositos = async () => {
    try {
      const token = Cookies.get("token");
      const API_BASE = getApiUrl();
      const res = await fetch(`${API_BASE}/api/inventario/depositos/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDepositos(data.results || data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDetail();
    fetchDepositos();
  }, [id]);

  const handleAprobarSalida = async () => {
    if (
      !confirm(
        "¿Aprobar esta consignación? El stock se descontará de los depósitos seleccionados.",
      )
    )
      return;
    try {
      const token = Cookies.get("token");
      const API_BASE = getApiUrl();
      const res = await fetch(
        `${API_BASE}/api/inventario/consignaciones/${id}/aprobar/`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) fetchDetail();
      else alert("Error al aprobar");
    } catch (err) {
      alert("Error de conexión");
    }
  };

  if (loading)
    return <LoadingScreen message="Cargando detalles de consignación..." />;
  if (!consignacion)
    return (
      <div className="p-20 text-center font-black uppercase text-slate-400">
        Consignación no encontrada
      </div>
    );

  const resumen = consignacion.resumen_stock || {};

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      {/* 🚀 CAMBIAMOS MovimientoHeader POR PageHeader */}
      <PageHeader
        breadcrumbs={[
          { label: "Consignaciones", href: "/movimientos/consignaciones" },
          { label: `Salida #${consignacion.id}` },
        ]}
        subtitle={
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Package size={12} className="text-slate-400" />
              <span className="font-bold text-slate-600">{`${consignacion.responsable} • ${consignacion.destino}`}</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={12} className="text-blue-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Registrado por: <span className="text-blue-600">{consignacion.usuario_nombre}</span>
              </span>
            </div>
          </div>
        }
      >
        {consignacion.estado === "BORRADOR" && (
          <button
            onClick={handleAprobarSalida}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center gap-2 active:scale-95"
          >
            <CheckCircle size={18} /> Aprobar Salida
          </button>
        )}
        {consignacion.estado === "APROBADO" && (
          <div className="flex items-center gap-3">
            {!resumen.completado && (
              <>
                <button
                  onClick={() => setShowDevolucionModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 border border-slate-200"
                >
                  <RotateCcw size={16} /> Devolución
                </button>
                <button
                  onClick={() => setShowLiquidacionModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center gap-2 active:scale-95"
                >
                  <DollarSign size={16} /> Liquidar
                </button>
              </>
            )}
            <span
              className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${resumen.completado ? "bg-emerald-500 text-white shadow-lg shadow-emerald-100" : "bg-emerald-100 text-emerald-700 border border-emerald-200"}`}
            >
              {resumen.completado ? "✓ COMPLETADO" : "EN CURSO"}
            </span>
          </div>
        )}
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {/* Grid de Resumen de Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                label: "Total Enviado",
                val: resumen.enviado,
                icon: <ArrowRight className="text-purple-400" />,
                sub: "Stock en calle",
              },
              {
                label: "Devuelto",
                val: resumen.devuelto,
                icon: <RotateCcw className="text-emerald-400" />,
                sub: "Stock en depósito",
              },
              {
                label: "Liquidado",
                val: resumen.liquidado,
                icon: <DollarSign className="text-blue-400" />,
                sub: "Ventas/Resultados",
              },
              {
                label: "Pendiente",
                val: resumen.pendiente,
                icon: (
                  <Clock
                    className={`text-amber-400 ${resumen.pendiente > 0 ? "animate-pulse" : ""}`}
                  />
                ),
                sub: "Aun fuera",
              },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4 relative overflow-hidden group"
              >
                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
                  {stat.icon}
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                  {stat.icon}
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {stat.label}
                  </p>
                  <h4 className="text-2xl font-black text-slate-900 leading-tight">
                    {stat.val}{" "}
                    <span className="text-xs font-bold text-slate-300">
                      un.
                    </span>
                  </h4>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.1em]">
                    {stat.sub}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs y Contenido Principal */}
          <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
            <div className="flex border-b border-slate-100 bg-slate-50/50">
              {[
                {
                  id: "resumen",
                  label: "Items & Salida",
                  icon: <ClipboardList size={16} />,
                },
                {
                  id: "devoluciones",
                  label: "Devoluciones",
                  icon: <RotateCcw size={16} />,
                },
                {
                  id: "liquidaciones",
                  label: "Liquidaciones",
                  icon: <DollarSign size={16} />,
                },
                {
                  id: "historial",
                  label: "Cronología",
                  icon: <History size={16} />,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-8 py-5 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? "bg-white text-purple-600 border-b-2 border-purple-600 scale-105 z-10" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/50"}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="p-8">
              {activeTab === "resumen" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                      Detalle de mercadería enviada
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {consignacion.items?.map((item, i) => {
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
                                    <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">CERRADO</span>
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
                                <p className={`text-lg font-black ${pendiente > 0 ? 'text-amber-600' : 'text-slate-300'}`}>
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
              )}

              {activeTab === "devoluciones" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {consignacion.devoluciones?.length === 0 ? (
                    <p className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-xs italic">
                      No hay retornos registrados para esta salida.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {consignacion.devoluciones.map((dev) => (
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
                                onClick={async () => {
                                  if (!confirm("¿Aprobar ingreso de stock?")) return;
                                  const token = Cookies.get("token");
                                  const API_BASE = getApiUrl();
                                  const res = await fetch(`${API_BASE}/api/inventario/devoluciones/${dev.id}/aprobar/`, {
                                    method: 'POST',
                                    headers: { Authorization: `Bearer ${token}` }
                                  });
                                  if (res.ok) fetchDetail();
                                }}
                                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all"
                              >
                                Aprobar Ingreso
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "liquidaciones" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {consignacion.liquidaciones?.length === 0 ? (
                    <p className="text-center py-20 text-slate-300 font-black uppercase tracking-widest text-xs italic">
                      No hay liquidaciones registradas aún.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {consignacion.liquidaciones.map((liq) => (
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
                            <div className="flex gap-2">
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
                  )}
                </div>
              )}

              {activeTab === "historial" && (
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
                    {[...consignacion.devoluciones, ...consignacion.liquidaciones].sort((a, b) => new Date(a.fecha_devolucion || a.fecha_liquidacion) - new Date(b.fecha_devolucion || b.fecha_liquidacion)).map((mov, idx) => (
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

                    {resumen.completado && (
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
              )}
            </div>
          </div>
        </div>

        {/* MODAL DE DEVOLUCIÓN */}
        {showDevolucionModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Retorno de Mercadería</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registrar ingreso a depósito</p>
                </div>
                <button onClick={() => setShowDevolucionModal(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">✕</button>
              </div>

              <div className="p-8 overflow-y-auto space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Depósito de Destino</label>
                  <select
                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                    onChange={(e) => setConsignacion({ ...consignacion, _target_deposito: e.target.value })}
                    value={consignacion._target_deposito || depositos[0]?.id || ''}
                  >
                    {depositos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Items a devolver</label>
                  {consignacion.items.map((item, i) => {
                    const pendiente = item.cantidad - (item.cantidad_devuelta + item.cantidad_liquidada);
                    if (pendiente <= 0) return null;
                    return (
                      <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-blue-500 uppercase">{item.lote_codigo}</p>
                          <p className="text-sm font-black text-slate-800">{item.variante_nombre}</p>
                          <p className="text-[10px] font-bold text-slate-400">Pendiente: {pendiente} u.</p>
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
                              const newItems = [...(consignacion._devolucion_items || [])];
                              const idx = newItems.findIndex(it => it.item_salida === item.id);
                              if (idx > -1) newItems[idx].cantidad_devuelta = val;
                              else newItems.push({ item_salida: item.id, cantidad_devuelta: val });
                              setConsignacion({ ...consignacion, _devolucion_items: newItems });
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowDevolucionModal(false)} className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
                <button
                  onClick={async () => {
                    const items = (consignacion._devolucion_items || []).filter(it => it.cantidad_devuelta > 0);
                    if (items.length === 0) return alert("Ingresa cantidades a devolver");
                    const token = Cookies.get("token");
                    const API_BASE = getApiUrl();
                    const res = await fetch(`${API_BASE}/api/inventario/devoluciones/`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        salida_original: consignacion.id,
                        deposito_destino: consignacion._target_deposito || depositos[0]?.id,
                        items: items
                      })
                    });
                    if (res.ok) {
                      setShowDevolucionModal(false);
                      fetchDetail();
                    } else {
                      const err = await res.json();
                      alert(JSON.stringify(err));
                    }
                  }}
                  className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg"
                >
                  Confirmar Retorno
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE LIQUIDACIÓN */}
        {showLiquidacionModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Liquidar Stock</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ventas y cierres parciales</p>
                </div>
                <button onClick={() => setShowLiquidacionModal(false)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all">✕</button>
              </div>

              <div className="p-8 overflow-y-auto space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Motivo</label>
                    <select
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      onChange={(e) => setConsignacion({ ...consignacion, _liq_motivo: e.target.value })}
                      value={consignacion._liq_motivo || 'VENTA'}
                    >
                      <option value="VENTA">Venta / Consumo</option>
                      <option value="PERDIDA">Pérdida / Rotura</option>
                      <option value="MUESTRA">Muestra Médica</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Comprobante</label>
                    <input
                      type="text"
                      placeholder="Nro Factura/Recibo"
                      className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                      onChange={(e) => setConsignacion({ ...consignacion, _liq_comp: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Items a liquidar</label>
                  {consignacion.items.map((item, i) => {
                    const pendiente = item.cantidad - (item.cantidad_devuelta + item.cantidad_liquidada);
                    if (pendiente <= 0) return null;
                    return (
                      <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-black text-slate-800">{item.variante_nombre}</p>
                          <p className="text-[10px] font-bold text-slate-400">Restan: {pendiente} u.</p>
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
                              const newItems = [...(consignacion._liq_items || [])];
                              const idx = newItems.findIndex(it => it.item_salida === item.id);
                              if (idx > -1) newItems[idx].cantidad_liquidada = val;
                              else newItems.push({ item_salida: item.id, cantidad_liquidada: val });
                              setConsignacion({ ...consignacion, _liq_items: newItems });
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button onClick={() => setShowLiquidacionModal(false)} className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 transition-all">Cancelar</button>
                <button
                  onClick={async () => {
                    const items = (consignacion._liq_items || []).filter(it => it.cantidad_liquidada > 0);
                    if (items.length === 0) return alert("Ingresa cantidades a liquidar");
                    const token = Cookies.get("token");
                    const API_BASE = getApiUrl();
                    const res = await fetch(`${API_BASE}/api/inventario/liquidaciones/`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        salida_original: consignacion.id,
                        motivo: consignacion._liq_motivo || 'VENTA',
                        comprobante_venta: consignacion._liq_comp || '',
                        items: items
                      })
                    });
                    if (res.ok) {
                      setShowLiquidacionModal(false);
                      fetchDetail();
                    } else {
                      const err = await res.json();
                      alert(JSON.stringify(err));
                    }
                  }}
                  className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg"
                >
                  Confirmar Liquidación
                </button>
              </div>
            </div>
          </div>
        )}

      </main >
    </div >
  );
}
