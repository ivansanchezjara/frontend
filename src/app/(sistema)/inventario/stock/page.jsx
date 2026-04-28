"use client";
import { useState, useEffect } from "react";
import Cookies from "js-cookie";
import ProductTable, {
  COLUMNAS_VISIBLES_POR_DEFECTO,
} from "@/components/inventario/ProductTable";
import SearchBar from "@/components/ui/SearchBar";
import LoadingScreen from "@/components/ui/LoadingScreen";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import { getProductos } from "@/services/api";
import {
  Package,
  MapPin,
  AlertTriangle,
  Calendar,
  Info,
  Edit3,
  Check,
  LayoutGrid,
  AlertCircle,
} from "lucide-react";

export default function StockPage() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODO");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const pageSize = 24;
  const [serverStats, setServerStats] = useState(null);

  const [selectedSKU, setSelectedSKU] = useState(null);
  const [lotes, setLotes] = useState([]);
  const [editingLote, setEditingLote] = useState(null); // ID del lote que se está editando
  const [editData, setEditData] = useState({});

  const [columnasVisibles, setColumnasVisibles] = useState(
    COLUMNAS_VISIBLES_POR_DEFECTO,
  );

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

  const getApiUrl = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== "undefined") {
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    }
    return "http://127.0.0.1:8000";
  };

  const fetchInventario = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        search: searchTerm,
        stock_status: filtroStatus !== "TODO" ? filtroStatus : undefined,
      };
      const data = await getProductos(params);
      setProductos(data.results || []);
      setCount(data.count || 0);
    } catch (error) {
      console.error("Error cargando inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = Cookies.get("token");
      const API_BASE = getApiUrl();
      const response = await fetch(
        `${API_BASE}/api/catalogo/productos/stats/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setServerStats(data);
      }
    } catch (error) {
      console.error("Error cargando stats:", error);
    }
  };

  // Cargar Lotes cuando se selecciona un SKU
  useEffect(() => {
    if (!selectedSKU) return;

    async function fetchLotes() {
      const token = Cookies.get("token");
      const API_BASE = getApiUrl();
      const response = await fetch(
        `${API_BASE}/api/inventario/stock-lotes/?variante=${selectedSKU.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await response.json();
      setLotes(data.results || data);
    }
    fetchLotes();
  }, [selectedSKU]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchInventario();
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, filtroStatus, page]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filtroStatus]);

  const getSemaforoVencimiento = (vencimiento) => {
    if (!vencimiento)
      return {
        color: "text-slate-300",
        dot: "bg-slate-200",
        label: "Sin vencimiento",
      };
    const days = (new Date(vencimiento) - new Date()) / (1000 * 60 * 60 * 24);
    if (days < 0)
      return {
        color: "text-red-700",
        dot: "bg-red-600 animate-pulse",
        label: "VENCIDO",
      };
    if (days < 90)
      return { color: "text-red-500", dot: "bg-red-500", label: `< 90 días` };
    if (days < 180)
      return {
        color: "text-amber-500",
        dot: "bg-amber-500",
        label: `< 180 días`,
      };
    return {
      color: "text-emerald-500",
      dot: "bg-emerald-500",
      label: "Al día",
    };
  };

  const startEditing = (lote) => {
    setEditingLote(lote.id);
    setEditData({
      lote_codigo: lote.lote_codigo,
      vencimiento: lote.vencimiento || "",
    });
  };

  const handleSaveLote = async (loteId) => {
    try {
      const token = Cookies.get("token");
      const API_BASE = getApiUrl();
      const response = await fetch(
        `${API_BASE}/api/inventario/stock-lotes/${loteId}/`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lote_codigo: editData.lote_codigo,
            vencimiento: editData.vencimiento || null,
          }),
        },
      );

      if (response.ok) {
        // Actualizar localmente
        setLotes(
          lotes.map((l) => (l.id === loteId ? { ...l, ...editData } : l)),
        );
        setEditingLote(null);
      } else {
        alert("Error al guardar cambios del lote.");
      }
    } catch (error) {
      alert("Error de conexión.");
    }
  };

  // handleProcesarVencimientos removed as it's handled completely automatically in the backend.

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

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Metric Cards */}
          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-blue-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <Package size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                  Total Piezas
                </p>
                <h4 className="text-xl font-black text-slate-900 leading-none">
                  {(
                    stats.total_piezas ||
                    stats.totalPiezas ||
                    0
                  ).toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-amber-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-all shadow-sm">
                <Calendar size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                  Próximos Vencimientos
                </p>
                <h4 className="text-xl font-black text-slate-900 leading-none">
                  {stats.alertas_vencimiento}
                </h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-rose-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition-all shadow-sm">
                <AlertTriangle size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                  SKUs Agotados
                </p>
                <h4 className="text-xl font-black text-slate-900 leading-none">
                  {stats.skus_agotados}
                </h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-red-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm">
                <AlertCircle size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                  Unid. Vencidos
                </p>
                <h4 className="text-xl font-black text-slate-900 leading-none">
                  {stats.unidades_vencidas}
                </h4>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3 group hover:border-emerald-200 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                <LayoutGrid size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                  SKUs Totales
                </p>
                <h4 className="text-xl font-black text-slate-900 leading-none">
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
                  pageSize={pageSize}
                  currentPage={page}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>

          {/* MODAL DE AUDITORÍA Y EDICIÓN DE EXISTENCIAS */}
          {selectedSKU && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
              <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-widest">
                        {selectedSKU.product_code}
                      </span>
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        Auditando SKU
                      </h2>
                    </div>
                    <p className="text-slate-500 font-bold text-sm uppercase mt-1 tracking-widest leading-none">
                      {selectedSKU.producto_nombre_general}{" "}
                      <span className="text-slate-300 ml-2">
                        / {selectedSKU.nombre_variante}
                      </span>
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSKU(null);
                      setEditingLote(null);
                    }}
                    className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl font-bold text-slate-400 hover:text-slate-800 transition-all shadow-sm"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto font-sans">
                  {/* Resumen de Estados Stock */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-emerald-50 p-4 rounded-3xl border border-emerald-100">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                        Disponible
                      </p>
                      <p className="text-xl font-black text-emerald-700">
                        {selectedSKU.stock || 0}{" "}
                        <span className="text-xs">u.</span>
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-3xl border border-purple-100">
                      <p className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-1">
                        Consignación
                      </p>
                      <p className="text-xl font-black text-purple-700">
                        {selectedSKU.stock_en_consignacion || 0}{" "}
                        <span className="text-xs">u.</span>
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-3xl border border-blue-100">
                      <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">
                        Reservado
                      </p>
                      <p className="text-xl font-black text-blue-700">
                        {selectedSKU.stock_reservado || 0}{" "}
                        <span className="text-xs">u.</span>
                      </p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-3xl border border-red-100">
                      <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-1">
                        Vencido
                      </p>
                      <p className="text-xl font-black text-red-700">
                        {selectedSKU.stock_vencido || 0}{" "}
                        <span className="text-xs">u.</span>
                      </p>
                    </div>
                  </div>

                  {/* Desglose por Lotes */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lotes.map((lote) => (
                        <div
                          key={lote.id}
                          className={`p-5 rounded-3xl border transition-all ${editingLote === lote.id ? "bg-blue-50/50 border-blue-200 ring-2 ring-blue-100" : "bg-white border-slate-100 hover:border-slate-300"}`}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-slate-400" />
                                <span className="text-xs font-black text-slate-600 uppercase tracking-tight">
                                  {lote.deposito_nombre || "Depósito"}
                                </span>
                              </div>
                              {lote.cantidad_vencida > 0 && (
                                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full inline-block mt-1 self-start">
                                  {lote.cantidad_vencida} u. Vencidas
                                </span>
                              )}
                            </div>
                            <div className="text-lg font-black text-slate-900">
                              {lote.cantidad} u.
                            </div>
                          </div>

                          <div className="space-y-3">
                            {/* Campo Lote */}
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                                Código de Lote
                              </label>
                              {editingLote === lote.id ? (
                                <input
                                  type="text"
                                  value={editData.lote_codigo}
                                  onChange={(e) =>
                                    setEditData({
                                      ...editData,
                                      lote_codigo: e.target.value,
                                    })
                                  }
                                  className="w-full bg-white border border-blue-200 rounded-xl p-2 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                                />
                              ) : (
                                <div className="flex items-center justify-between group">
                                  <span className="text-sm font-bold text-slate-700 ml-1">
                                    {lote.lote_codigo}
                                  </span>
                                  <button
                                    onClick={() => startEditing(lote)}
                                    className="opacity-0 group-hover:opacity-100 p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                  >
                                    <Edit3 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Campo Vencimiento */}
                            <div>
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">
                                Vencimiento
                              </label>
                              {editingLote === lote.id ? (
                                <div className="flex gap-2">
                                  <input
                                    type="date"
                                    value={editData.vencimiento}
                                    onChange={(e) =>
                                      setEditData({
                                        ...editData,
                                        vencimiento: e.target.value,
                                      })
                                    }
                                    className="flex-1 bg-white border border-blue-200 rounded-xl p-2 text-sm font-bold"
                                  />
                                  <button
                                    onClick={() => handleSaveLote(lote.id)}
                                    className="bg-emerald-600 text-white p-2.5 rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100"
                                  >
                                    <Check size={20} />
                                  </button>
                                  <button
                                    onClick={() => setEditingLote(null)}
                                    className="bg-slate-200 text-slate-600 p-2.5 rounded-xl"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 ml-1">
                                  <div
                                    className={`w-2 h-2 rounded-full ${getSemaforoVencimiento(lote.vencimiento).dot}`}
                                  ></div>
                                  <span
                                    className={`text-[11px] font-black uppercase tracking-tight ${getSemaforoVencimiento(lote.vencimiento).color}`}
                                  >
                                    {lote.vencimiento || "Sin fecha"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {lotes.length === 0 && (
                        <div className="col-span-2 py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic bg-slate-50 rounded-[30px] border border-dashed border-slate-200">
                          No hay lotes con stock para este SKU.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  <div className="flex items-start gap-3 max-w-md">
                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-medium text-blue-700 leading-normal">
                      Los cambios en el lote o fecha se aplican instantáneamente
                      al stock físico.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedSKU(null)}
                    className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 active:scale-95 transition-all"
                  >
                    Cerrar Auditoría
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
