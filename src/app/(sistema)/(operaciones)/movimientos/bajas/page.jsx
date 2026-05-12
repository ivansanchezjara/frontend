"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import LoadingScreen from "@/components/ui/LoadingScreen";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { Trash2, Package, User, Calendar, Plus, Clock } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { getBajas, aprobarBaja } from "@/services/apis/movimientos";

export default function BajasPage() {
  const [bajas, setBajas] = useState([]);

  // Cargar bajas con useApi
  const {
    data: bajasData,
    loading,
    execute: fetchBajas,
  } = useApi(getBajas, {
    auto: true,
    initialData: [],
  });

  useEffect(() => {
    setBajas(bajasData?.results || bajasData || []);
  }, [bajasData]);

  const { execute: aprobarBajaAction } = useApi(aprobarBaja, {
    auto: false,
  });

  const handleAprobar = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !confirm(
        "¿Confirmar aprobación de esta baja? El stock se descontará inmediatamente.",
      )
    )
      return;

    try {
      await aprobarBajaAction(id);
      fetchBajas();
    } catch (error) {
      // useErrorHandler ya muestra el mensaje
    }
  };

  const getMotivoLabel = (motivo) => {
    const motivos = {
      VENCIMIENTO: "Vencimiento",
      ROTURA: "Rotura / Daño",
      PERDIDA: "Pérdida",
      ERROR_STOCK: "Ajuste Stock",
    };
    return motivos[motivo] || motivo;
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Gestión de Movimientos", href: "/movimientos" },
          { label: "Bajas de Inventario" },
        ]}
        subtitle={
          <>
            <Package size={12} />
            <span>
              Registrá pérdidas, mermas o productos vencidos para darlos de
              baja.
            </span>
          </>
        }
      >
        <Link
          href="/movimientos/bajas/nuevo"
          className="bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 uppercase text-[10px] tracking-widest active:scale-95"
        >
          <Plus size={16} /> Nueva Baja
        </Link>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1800px] mx-auto space-y-6">
          {loading ? (
            <LoadingScreen message="Sincronizando bajas..." />
          ) : bajas.length === 0 ? (
            <EmptyState
              icon="📤"
              title="No hay bajas registradas"
              message="Aquí se listarán todos los productos descontados por rotura, vencimiento o pérdida."
              actionLabel="Nueva Baja"
              onAction={() =>
                (window.location.href = "/movimientos/bajas/nuevo")
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {bajas.map((baja) => (
                <div
                  key={baja.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-200 transition-all group flex flex-col md:flex-row items-center gap-4"
                >
                  {/* Icono de Estado */}
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border ${baja.estado === "APROBADO" ? "bg-slate-50 text-slate-400 border-slate-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}
                  >
                    <Trash2 size={24} />
                  </div>

                  {/* Info Principal */}
                  <div className="flex-1 min-w-0 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                        ID #{baja.id}
                      </span>
                      <span
                        className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest ${baja.estado === "APROBADO" ? "bg-slate-100 text-slate-600" : "bg-rose-100 text-rose-700"}`}
                      >
                        {baja.estado}
                      </span>
                      <span className="text-[8px] font-black px-2 py-1 bg-amber-100 text-amber-700 rounded-full uppercase tracking-widest">
                        {getMotivoLabel(baja.motivo)}
                      </span>
                    </div>
                    <h3 className="text-lg md:text-xl font-black text-slate-900 truncate tracking-tight">
                      {baja.cantidad} x {baja.variante_nombre}
                    </h3>
                    <p className="text-slate-500 text-[11px] font-medium mt-1 italic">
                      "{baja.observaciones || "Sin observaciones"}"
                    </p>
                    <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3 text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />{" "}
                        {new Date(baja.fecha).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {baja.deposito_nombre}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={12} /> {baja.usuario_nombre}
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    {baja.estado === "BORRADOR" && (
                      <button
                        onClick={(e) => handleAprobar(baja.id, e)}
                        className="bg-rose-600 text-white px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md shadow-rose-100 hover:bg-rose-700 transition-all border border-rose-500"
                      >
                        Aprobar
                      </button>
                    )}
                    {baja.estado === "APROBADO" && (
                      <div className="flex items-center gap-1 text-emerald-600 font-black text-[9px] uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-xl">
                        <Package size={12} /> Stock Descontado
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
