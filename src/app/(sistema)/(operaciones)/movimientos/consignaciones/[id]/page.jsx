"use client";
import { LoadingScreen, PageHeader } from '@/components/ui';
import { useState, use } from "react";
import {
  Package,
  CheckCircle,
  Clock,
  RotateCcw,
  DollarSign,
  ArrowRight,
  History,
  ClipboardList,
  User,
} from "lucide-react";
import { useApi } from "@/hooks/useApi";
import {
  getConsignacion,
  aprobarConsignacion,
  crearDevolucion,
  aprobarDevolucion,
  crearLiquidacion,
  getDepositos,
} from "@/services/apis/movimientos";
import DevolucionModal from "@/components/movimientos/consignaciones/DevolucionModal";
import LiquidacionModal from "@/components/movimientos/consignaciones/LiquidacionModal";
import ConsignacionResumen from "@/components/movimientos/consignaciones/tabs/ConsignacionResumen";
import ConsignacionDevoluciones from "@/components/movimientos/consignaciones/tabs/ConsignacionDevoluciones";
import ConsignacionLiquidaciones from "@/components/movimientos/consignaciones/tabs/ConsignacionLiquidaciones";
import ConsignacionHistorial from "@/components/movimientos/consignaciones/tabs/ConsignacionHistorial";

export default function DetalleConsignacionPage({ params }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState("resumen"); // resumen, devoluciones, liquidaciones

  // Estados para modales
  const [showDevolucionModal, setShowDevolucionModal] = useState(false);
  const [showLiquidacionModal, setShowLiquidacionModal] = useState(false);

  // Cargar consignación con useApi
  const { data: consignacion, loading, execute: fetchDetail, setData: setConsignacion } = useApi(
    getConsignacion,
    {
      auto: true,
      initialData: null,
      args: [id],
    }
  );

  // Cargar depósitos con useApi
  const { data: depositosData } = useApi(getDepositos, {
    auto: true,
    initialData: [],
  });

  const depositos = depositosData?.results || depositosData || [];

  const { execute: aprobarConsignacionAction, loading: isAprobando } = useApi(aprobarConsignacion, { auto: false });
  const { execute: aprobarDevolucionAction, loading: isAprobandoDev } = useApi(aprobarDevolucion, { auto: false });
  const { execute: crearDevolucionAction, loading: isCreandoDev } = useApi(crearDevolucion, { auto: false });
  const { execute: crearLiquidacionAction, loading: isCreandoLiq } = useApi(crearLiquidacion, { auto: false });

  const handleAprobarSalida = async () => {
    if (
      !confirm(
        "¿Aprobar esta consignación? El stock se descontará de los depósitos seleccionados.",
      )
    )
      return;
    try {
      await aprobarConsignacionAction(id);
      fetchDetail(id);
    } catch (err) {
      // useErrorHandler ya muestra el mensaje
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
            disabled={isAprobando}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-100 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAprobando ? <Clock size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {isAprobando ? "Aprobando..." : "Aprobar Salida"}
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
                <ConsignacionResumen items={consignacion.items} />
              )}

              {activeTab === "devoluciones" && (
                <ConsignacionDevoluciones
                  devoluciones={consignacion.devoluciones}
                  isAprobandoDev={isAprobandoDev}
                  onAprobarDevolucion={async (devId) => {
                    if (!confirm("¿Aprobar ingreso de stock?")) return;
                    try {
                      await aprobarDevolucionAction(devId);
                      fetchDetail(id);
                    } catch (err) { }
                  }}
                />
              )}

              {activeTab === "liquidaciones" && (
                <ConsignacionLiquidaciones liquidaciones={consignacion.liquidaciones} />
              )}

              {activeTab === "historial" && (
                <ConsignacionHistorial consignacion={consignacion} resumen={resumen} />
              )}
            </div>
          </div>
        </div>

        {/* MODAL DE DEVOLUCIÓN */}
        {showDevolucionModal && (
          <DevolucionModal
            consignacion={consignacion}
            depositos={depositos}
            isSubmitting={isCreandoDev}
            onClose={() => setShowDevolucionModal(false)}
            onConfirm={async (payload) => {
              try {
                await crearDevolucionAction(payload);
                setShowDevolucionModal(false);
                fetchDetail(id);
              } catch (err) {
                // error manejado por useErrorHandler
              }
            }}
          />
        )}

        {/* MODAL DE LIQUIDACIÓN */}
        {showLiquidacionModal && (
          <LiquidacionModal
            consignacion={consignacion}
            isSubmitting={isCreandoLiq}
            onClose={() => setShowLiquidacionModal(false)}
            onConfirm={async (payload) => {
              try {
                await crearLiquidacionAction(payload);
                setShowLiquidacionModal(false);
                fetchDetail(id);
              } catch (err) {
                // error manejado por useErrorHandler
              }
            }}
          />
        )}

      </main >
    </div >
  );
}
