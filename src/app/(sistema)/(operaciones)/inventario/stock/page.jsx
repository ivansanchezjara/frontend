"use client";
import { useState, useEffect } from "react";
import ProductTable, {
  COLUMNAS_VISIBLES_POR_DEFECTO,
} from "@/components/inventario/ProductTable";
import SearchBar from "@/components/ui/SearchBar";
import LoadingScreen from "@/components/ui/LoadingScreen";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import AuditoriaModal from "@/components/inventario/AuditoriaModal";
import { getProductos, getProductosStats } from "@/services/apis/catalogo.js";
import { getLotesPorVarianteId } from "@/services/apis/inventario.js";
import { useApi } from "@/hooks/useApi";
import {
  Package,
  AlertTriangle,
  Calendar,
  LayoutGrid,
  AlertCircle,
} from "lucide-react";

const PAGE_SIZE = 20;

export default function StockPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("STOCK");
  const [page, setPage] = useState(1);
  const [selectedSKU, setSelectedSKU] = useState(null);
  const [columnasVisibles, setColumnasVisibles] = useState(
    COLUMNAS_VISIBLES_POR_DEFECTO,
  );

  // Cargar productos con useApi
  const {
    data: productosData,
    loading,
    execute: fetchInventario,
  } = useApi(getProductos, {
    auto: false,
    initialData: { results: [], count: 0 },
    args: [
      {
        page,
        search: searchTerm,
        stock_status: filtroStatus !== "TODO" ? filtroStatus : undefined,
      },
    ],
  });

  const productos = productosData?.results || [];
  const count = productosData?.count || 0;

  // Cargar stats con useApi
  const { data: serverStats } = useApi(getProductosStats, {
    auto: true,
    initialData: null,
  });

  // Cargar lotes con useApi
  const { data: lotesData, execute: fetchLotes } = useApi(
    getLotesPorVarianteId,
    {
      auto: false,
      initialData: [],
    },
  );

  const lotes = Array.isArray(lotesData) ? lotesData : (lotesData?.results || []);

  const STATUS_OPTIONS = [
    { id: "TODO", label: "Ver Todo", color: "bg-slate-100 text-slate-600" },
    {
      id: "STOCK",
      label: "Con Stock",
      color: "bg-emerald-100 text-emerald-700",
    },
    { id: "AGOTADO", label: "Agotados", color: "bg-red-100 text-red-700" },
    {
      id: "VENCER",
      label: "Por Vencer (6m)",
      color: "bg-amber-100 text-amber-700",
    },
  ];

  // Refetch inventario when params change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchInventario();
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filtroStatus, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, filtroStatus]);

  // Fetch lotes when SKU is selected
  useEffect(() => {
    if (selectedSKU) {
      fetchLotes(selectedSKU.id);
    }
  }, [selectedSKU]);


  const stats = serverStats || {
    totalPiezas: 0,
    alertas_vencimiento: 0,
    skus_agotados: 0,
    unidades_vencidas: 0,
    total_skus: 0,
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      {/* HEADER */}
      <PageHeader
        title="Stock y Disponibilidad"
        subtitle={
          <>
            <Package size={12} /> Auditoría de Almacén Real y Lotes
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 min-w-0">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 group hover:border-blue-200 transition-all">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center transition-all group-hover:scale-110">
                <Package size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Total Piezas
                </p>
                <h4 className="text-lg font-black text-slate-800 leading-none">
                  {(
                    stats.total_piezas ||
                    stats.totalPiezas ||
                    0
                  ).toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 group hover:border-amber-200 transition-all">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center transition-all group-hover:scale-110">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Próximos Venc.
                </p>
                <h4 className="text-lg font-black text-slate-800 leading-none">
                  {stats.alertas_vencimiento}
                </h4>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 group hover:border-rose-200 transition-all">
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center transition-all group-hover:scale-110">
                <AlertTriangle size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Agotados
                </p>
                <h4 className="text-lg font-black text-slate-800 leading-none">
                  {stats.skus_agotados}
                </h4>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 group hover:border-red-200 transition-all">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center transition-all group-hover:scale-110">
                <AlertCircle size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Vencidos
                </p>
                <h4 className="text-lg font-black text-slate-800 leading-none">
                  {stats.unidades_vencidas}
                </h4>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center gap-2.5 group hover:border-emerald-200 transition-all">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center transition-all group-hover:scale-110">
                <LayoutGrid size={16} />
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">
                  Total SKUs
                </p>
                <h4 className="text-lg font-black text-slate-800 leading-none">
                  {stats.total_skus}
                </h4>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="flex flex-col xl:flex-row gap-6 items-center justify-between bg-white/60 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-sm sticky top-[72px] z-40">
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setFiltroStatus(opt.id)}
                  className={`px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroStatus === opt.id ? `${opt.color} shadow-lg shadow-current/10 ring-2 ring-current/20` : "bg-white/50 text-slate-400 hover:bg-white hover:text-slate-600 border border-slate-100"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="w-full xl:max-w-md">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Buscar código, nombre, marca..."
              />
            </div>
          </div>

          {/* Tabla */}
          <div className="w-full">
            {loading ? (
              <LoadingScreen message="Sincronizando depósitos..." />
            ) : productos.length === 0 ? (
              <EmptyState
                icon="📦"
                title="No hay resultados"
                onAction={() => setSearchTerm("")}
              />
            ) : (
              <>
                <ProductTable
                  productos={productos}
                  columnasVisibles={columnasVisibles}
                  onSelectSKU={(sku) => setSelectedSKU(sku)}
                />

                <Pagination
                  count={count}
                  pageSize={PAGE_SIZE}
                  currentPage={page}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>

          <AuditoriaModal
            selectedSKU={selectedSKU}
            lotes={lotes}
            onClose={() => setSelectedSKU(null)}
          />
        </div>
      </div>
    </div>
  );
}
