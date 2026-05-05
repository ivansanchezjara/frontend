"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import {
  Search,
  Package,
  AlertCircle,
  Settings2,
  Boxes,
  ArrowRight,
} from "lucide-react";
import PageHeader from "@/components/ui/PageHeader";
import { getApiUrl } from "@/services/api";

export default function NuevoAjusteInventarioPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productos, setProductos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // ESTADO REFACTORIZADO: Ahora orientado a Logística
  const [ajuste, setAjuste] = useState({
    variante: "",
    motivo: "",
    observaciones: "",
  });

  const [selectedVarianteInfo, setSelectedVarianteInfo] = useState(null);
  const [lotes, setLotes] = useState([]); // Aquí guardaremos los lotes del producto

  useEffect(() => {
    const token = Cookies.get("token");
    const API_BASE = getApiUrl();
    async function loadProductos() {
      try {
        // Idealmente en el futuro, este fetch debería apuntar a un endpoint de Stock, no solo catálogo.
        const res = await fetch(`${API_BASE}/api/catalogo/productos/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        const rawData = Array.isArray(data) ? data : data.results || [];
        const allVariantes = [];
        rawData.forEach((p) => {
          p.variants?.forEach((v) => {
            allVariantes.push({
              id: v.id,
              product_code: v.product_code, // Asegúrate de que Django envíe este campo
              producto_nombre: p.nombre_general,
              nombre_variante: v.nombre_variante,
              costo_fob: v.costo_fob, // Opcional, para la vista previa
            });
          });
        });
        setProductos(allVariantes);
      } catch (err) {
        console.error("Error fetching productos:", err);
      }
    }
    loadProductos();
  }, []);

  const handleAjusteChange = (e) => {
    const { name, value } = e.target;
    setAjuste((prev) => ({ ...prev, [name]: value }));
  };

  // Función para manejar cambios dentro de la tabla de lotes
  const handleLoteChange = (loteId, field, value) => {
    setLotes((prev) =>
      prev.map((lote) =>
        lote.id === loteId ? { ...lote, [field]: value } : lote,
      ),
    );
  };

  const totalStockActual = lotes.reduce(
    (sum, lote) => sum + Number(lote.cantidad_actual || 0),
    0,
  );

  const allowQuantityChanges = ["ERROR_TIPEO", "CONTEO_FISICO", "REUBICACION"].includes(ajuste.motivo);
  
  const totalStockPropuesto = lotes.reduce(
    (sum, lote) => {
      const cantidadActual = Number(lote.cantidad_actual || 0);
      const nuevaCantidad = allowQuantityChanges && lote.nueva_cantidad !== ""
        ? parseInt(lote.nueva_cantidad, 10)
        : cantidadActual;
      const splitDiff = allowQuantityChanges && lote.nuevo_lote_codigo && lote.nueva_cantidad !== ""
        ? Math.max(cantidadActual - parseInt(lote.nueva_cantidad, 10), 0)
        : 0;
      return sum + nuevaCantidad + splitDiff;
    },
    0,
  );

  const totalsMatch = totalStockActual === totalStockPropuesto;

  const selectVariante = async (v) => {
    setSelectedVarianteInfo(v);
    setAjuste((prev) => ({ ...prev, variante: v.id }));
    setIsSearchOpen(false);

    const token = Cookies.get("token");
    const API_BASE = getApiUrl();
    try {
      const res = await fetch(
        `${API_BASE}/api/inventario/stock-lotes/?variante=${v.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      const lotesFetch = Array.isArray(data) ? data : data.results || [];

      setLotes(
        lotesFetch.map((l) => ({
          id: l.id,
          lote_codigo: l.lote_codigo,
          vencimiento_actual: l.vencimiento || "",
          cantidad_actual: l.cantidad,
          nueva_cantidad: "",
          nuevo_vencimiento: "",
          nuevo_lote_codigo: "",
        })),
      );
    } catch (err) {
      console.error("Error fetching lotes", err);
      setLotes([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ajuste.variante || isSubmitting) return;

    if (!ajuste.motivo) {
      alert("Debes seleccionar un motivo de ajuste antes de continuar.");
      return;
    }

    // Validar lotes modificados según el motivo
    const allowQuantityChanges = ["ERROR_TIPEO", "CONTEO_FISICO", "REUBICACION"].includes(ajuste.motivo);
    
    let lotesModificados = [];
    
    if (ajuste.motivo === "VENCIMIENTO") {
      // Solo cambios de vencimiento
      lotesModificados = lotes.filter((l) => l.nuevo_vencimiento !== "");
    } else if (ajuste.motivo === "RENOMBRAR_LOTE") {
      // Solo cambios de código de lote
      lotesModificados = lotes.filter((l) => l.nuevo_lote_codigo !== "");
      
      // Validar que todos tengan nuevo código
      const sinCodigo = lotesModificados.filter((l) => !l.nuevo_lote_codigo || l.nuevo_lote_codigo.trim() === "");
      if (sinCodigo.length > 0) {
        alert("Debes especificar el nuevo código para cada lote a renombrar.");
        return;
      }
    } else {
      // ERROR_TIPEO, CONTEO_FISICO, REUBICACION
      lotesModificados = lotes.filter((l) => {
        const hasVencimientoChange = l.nuevo_vencimiento !== "";
        const hasCantidadChange = l.nueva_cantidad !== "";
        return hasVencimientoChange || hasCantidadChange;
      });
    }

    if (lotesModificados.length === 0) {
      alert("Debes modificar al menos un lote antes de enviar el ajuste.");
      return;
    }

    // Validar split: si hay nuevo_lote_codigo, debe haber reducción de cantidad
    const invalidSplit = lotesModificados.some((l) => {
      const nuevaCantidad = l.nueva_cantidad !== "" ? parseInt(l.nueva_cantidad, 10) : null;
      if (l.nuevo_lote_codigo && ajuste.motivo !== "RENOMBRAR_LOTE") {
        if (!nuevaCantidad || nuevaCantidad >= l.cantidad_actual) {
          return true;
        }
      }
      return false;
    });

    if (invalidSplit) {
      alert("Para crear un nuevo lote, debes reducir la cantidad del lote original.");
      return;
    }

    // Validar que no cambien cantidades si el motivo no lo permite
    if (!allowQuantityChanges && ajuste.motivo !== "RENOMBRAR_LOTE") {
      const conCambiosCantidad = lotesModificados.some((l) => l.nueva_cantidad !== "");
      if (conCambiosCantidad) {
        alert("Este motivo no permite cambios de cantidad.");
        return;
      }
    }

    if (
      !allowQuantityChanges &&
      ajuste.motivo !== "RENOMBRAR_LOTE" &&
      totalStockActual !== totalStockPropuesto
    ) {
      alert(
        "Para este motivo, el ajuste no puede cambiar el stock total del producto."
      );
      return;
    }

    setIsSubmitting(true);
    const token = Cookies.get("token");
    const API_BASE = getApiUrl();

    const payload = {
      variante: ajuste.variante,
      motivo: ajuste.motivo,
      observaciones: ajuste.observaciones,
      lotes_ajustados: lotesModificados.map((l) => ({
        lote: l.id,
        nueva_cantidad: allowQuantityChanges && l.nueva_cantidad !== "" 
          ? parseInt(l.nueva_cantidad, 10) 
          : undefined,
        nuevo_vencimiento:
          l.nuevo_vencimiento !== "" ? l.nuevo_vencimiento : undefined,
        nuevo_lote_codigo:
          l.nuevo_lote_codigo !== "" ? l.nuevo_lote_codigo : undefined,
      })),
    };

    try {
      const response = await fetch(`${API_BASE}/api/inventario/ajustes/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push("/movimientos/ajustes");
      } else {
        const errData = await response.json();
        alert("Error al guardar: " + JSON.stringify(errData));
      }
    } catch (error) {
      alert("Error de conexión.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProductos = productos.filter(
    (v) =>
      v.product_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.producto_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.nombre_variante?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ajustes de Inventario", href: "/movimientos/ajustes" },
          { label: "Nuevo Ajuste" },
        ]}
        subtitle={
          <>
            <Package size={12} />
            <span>
              Corregí cantidades, lotes y fechas de vencimiento de forma
              auditada.
            </span>
          </>
        }
      >
        <button
          disabled={isSubmitting || !ajuste.variante || !ajuste.motivo || !totalsMatch}
          onClick={handleSubmit}
          className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg ${!ajuste.variante || !ajuste.motivo || !totalsMatch ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100"}`}
        >
          {isSubmitting ? "GUARDANDO..." : "REGISTRAR AJUSTE"}
        </button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Columna Izquierda: Producto y Motivo */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Package size={14} /> Producto
              </h3>

              {!selectedVarianteInfo ? (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="w-full p-10 border-2 border-dashed border-slate-200 rounded-[30px] text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all flex flex-col items-center gap-4 bg-slate-50/50"
                >
                  <Search size={40} className="opacity-20" />
                  <span className="font-black uppercase tracking-widest text-[10px]">
                    Buscar Producto
                  </span>
                </button>
              ) : (
                <div className="space-y-4">
                  <div className="p-6 bg-blue-50/50 border border-blue-100 rounded-[30px] text-center">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">
                      {selectedVarianteInfo.product_code}
                    </p>
                    <h4 className="font-black text-slate-900 text-lg leading-tight">
                      {selectedVarianteInfo.producto_nombre}
                    </h4>
                    <p className="text-xs font-bold text-slate-500">
                      {selectedVarianteInfo.nombre_variante}
                    </p>
                    <button
                      onClick={() => setIsSearchOpen(true)}
                      className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-4 hover:underline"
                    >
                      Cambiar Producto
                    </button>
                  </div>

                  <div className="bg-slate-900 rounded-[30px] p-6 text-white overflow-hidden relative">
                    <Settings2 className="absolute -right-4 -bottom-4 text-white/5 w-24 h-24" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      Motivo del ajuste
                    </p>
                    <select
                      name="motivo"
                      value={ajuste.motivo}
                      onChange={handleAjusteChange}
                      className="w-full bg-white/10 border border-white/10 rounded-xl p-3 font-bold text-xs text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="" disabled hidden>
                        Selecciona motivo del ajuste
                      </option>
                      <option value="ERROR_TIPEO">
                        Error de tipeo en cantidad
                      </option>
                      <option value="CONTEO_FISICO">
                        Discrepancia en conteo físico
                      </option>
                      <option value="VENCIMIENTO">
                        Actualización de vencimiento
                      </option>
                      <option value="RENOMBRAR_LOTE">
                        Renombrar código de lote
                      </option>
                      <option value="REUBICACION">
                        Reorganizar/dividir stock entre lotes
                      </option>
                      <option value="OTROS">Otros motivos</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-[40px] border border-slate-200 shadow-sm">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">
                Observaciones para Auditoría
              </label>
              <textarea
                name="observaciones"
                value={ajuste.observaciones}
                onChange={handleAjusteChange}
                rows="4"
                placeholder="Justifica detalladamente el cambio logístico..."
                className="w-full bg-slate-50 border border-slate-200 rounded-[24px] p-5 font-medium text-sm outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
              ></textarea>
            </div>
          </div>

          {/* Columna Derecha: Lotes y Fechas */}
          <div
            className={`md:col-span-2 space-y-6 transition-opacity duration-300 ${!selectedVarianteInfo ? "opacity-30 pointer-events-none" : "opacity-100"}`}
          >
            <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Boxes size={14} className="text-blue-500" /> Detalle de Lotes y
                Vencimientos
              </h3>

              <div className="grid gap-4 mb-6 md:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 border border-slate-200 p-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400 font-black mb-2">
                    Stock total actual
                  </p>
                  <p className="text-3xl font-black text-slate-900">{totalStockActual}u</p>
                </div>
                <div className="rounded-3xl bg-slate-50 border border-slate-200 p-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400 font-black mb-2">
                    Stock total propuesto
                  </p>
                  <p className="text-3xl font-black text-slate-900">{totalStockPropuesto}u</p>
                </div>
              </div>

              <div className={`rounded-3xl p-4 text-sm font-black ${totalsMatch ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                {totalsMatch ? (
                  <p>El stock total es consistente. No hay creación ni destrucción mágica de unidades.</p>
                ) : (
                  <p>Atención: el total de stock no coincide. Ajustá cantidades o splits para igualar el stock antes y después.</p>
                )}
              </div>

              <div className="space-y-4">
                {lotes.map((lote) => (
                  <div
                    key={lote.id}
                    className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 flex flex-col xl:flex-row gap-6 xl:items-center"
                  >
                    {/* Info actual del lote */}
                    <div className="xl:w-1/3 flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Lote
                      </span>
                      <span className="text-lg font-black text-slate-800">
                        {lote.lote_codigo}
                      </span>
                      <div className="flex flex-col gap-2 mt-3 text-slate-500 text-xs font-bold">
                        <span>
                          Stock anterior: <span className="text-slate-900">{lote.cantidad_actual}u.</span>
                        </span>
                        <span>
                          Stock nuevo: <span className="text-slate-900">{lote.nueva_cantidad !== "" ? lote.nueva_cantidad : lote.cantidad_actual}u.</span>
                        </span>
                        <span>
                          Vence actual: <span className="text-slate-900">{lote.vencimiento_actual || "N/A"}</span>
                        </span>
                      </div>
                    </div>

                    <ArrowRight
                      className="hidden xl:block text-slate-300 shrink-0"
                      size={24}
                    />

                    {/* Campos de Ajuste - Dinámicos según motivo */}
                    <div className="xl:flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* VENCIMIENTO: Solo permite cambiar fecha de vencimiento */}
                      {ajuste.motivo === "VENCIMIENTO" && (
                        <div className="md:col-span-2 space-y-1">
                          <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">
                            Nuevo Vencimiento
                          </label>
                          <input
                            type="date"
                            value={lote.nuevo_vencimiento}
                            onChange={(e) =>
                              handleLoteChange(lote.id, "nuevo_vencimiento", e.target.value)
                            }
                            className="w-full bg-white border border-blue-200 rounded-xl p-3 font-black text-sm text-slate-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                          />
                        </div>
                      )}

                      {/* RENOMBRAR_LOTE: Solo permite cambiar código del lote */}
                      {ajuste.motivo === "RENOMBRAR_LOTE" && (
                        <div className="md:col-span-2 space-y-1 bg-purple-50 p-4 rounded-xl border border-purple-200">
                          <label className="text-[10px] font-black text-purple-700 uppercase tracking-widest ml-1">
                            Nuevo Código del Lote
                          </label>
                          <p className="text-[9px] text-purple-600 mb-2">
                            Cambiar código de <strong>{lote.lote_codigo}</strong> a:
                          </p>
                          <input
                            type="text"
                            placeholder="Ej: LOTE-CORRECTO-001"
                            value={lote.nuevo_lote_codigo}
                            onChange={(e) =>
                              handleLoteChange(lote.id, "nuevo_lote_codigo", e.target.value)
                            }
                            className="w-full bg-white border border-purple-300 rounded-xl p-3 font-black text-sm text-slate-600 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all placeholder:text-slate-300"
                          />
                        </div>
                      )}

                      {/* ERROR_TIPEO, CONTEO_FISICO, REUBICACION: Permiten cambiar cantidad y crear split */}
                      {["ERROR_TIPEO", "CONTEO_FISICO", "REUBICACION"].includes(ajuste.motivo) && (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">
                              Vencimiento (Si cambió)
                            </label>
                            <input
                              type="date"
                              value={lote.nuevo_vencimiento}
                              onChange={(e) =>
                                handleLoteChange(lote.id, "nuevo_vencimiento", e.target.value)
                              }
                              className="w-full bg-white border border-blue-200 rounded-xl p-3 font-black text-sm text-slate-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                            />
                          </div>
                          <div className="md:col-span-2 space-y-1">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">
                              Nueva Cantidad
                            </label>
                            <input
                              type="number"
                              min="0"
                              placeholder="Ej: 45"
                              value={lote.nueva_cantidad}
                              onChange={(e) =>
                                handleLoteChange(lote.id, "nueva_cantidad", e.target.value)
                              }
                              className="w-full bg-white border border-blue-200 rounded-xl p-3 font-black text-sm text-slate-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all placeholder:text-slate-300"
                            />
                          </div>

                          {/* Split lote: Solo si se reduce cantidad */}
                          {lote.nueva_cantidad !== "" &&
                            parseInt(lote.nueva_cantidad, 10) < lote.cantidad_actual && (
                              <div className="md:col-span-2 space-y-1 bg-amber-50 p-4 rounded-xl border border-amber-200">
                                <label className="text-[10px] font-black text-amber-700 uppercase tracking-widest ml-1">
                                  Crear Nuevo Lote Con La Diferencia
                                </label>
                                <p className="text-[9px] text-amber-600 mb-2">
                                  Se creará un nuevo lote con {lote.cantidad_actual - parseInt(lote.nueva_cantidad, 10)}u
                                </p>
                                <input
                                  type="text"
                                  placeholder="Ej: LOTE-ALT-001"
                                  value={lote.nuevo_lote_codigo}
                                  onChange={(e) =>
                                    handleLoteChange(lote.id, "nuevo_lote_codigo", e.target.value)
                                  }
                                  className="w-full bg-white border border-amber-300 rounded-xl p-3 font-black text-sm text-slate-600 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all placeholder:text-slate-300"
                                />
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                ))}

                {lotes.length === 0 && selectedVarianteInfo && (
                  <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-[24px]">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No hay lotes registrados para este producto.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex items-start gap-3 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                <AlertCircle
                  size={18}
                  className="text-blue-500 shrink-0 mt-0.5"
                />
                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                  <strong className="text-blue-700">Importante:</strong> Solo
                  completá los campos que necesiten ser modificados. Si dejás un
                  campo vacío, el sistema mantendrá el valor actual del lote.
                  Estas modificaciones alteran el stock físico inmediatamente.
                  Para bajas por merma, pérdida o consumo, usa el módulo de
                  Bajas; este módulo es exclusivo para corrección y
                  recategorización.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de búsqueda (Mantenido intacto de tu diseño) */}
        {isSearchOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50">
                <div className="flex-1 relative">
                  <Search
                    size={22}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Buscar producto a ajustar..."
                    className="w-full h-14 bg-white rounded-2xl pl-14 pr-6 text-lg font-black border border-slate-200 shadow-sm focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-400 hover:bg-slate-200 transition-all"
                >
                  ✕
                </button>
              </div>

              <div className="p-4 max-h-[400px] overflow-y-auto">
                {filteredProductos.length === 0 ? (
                  <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                    No se encontraron productos.
                  </div>
                ) : (
                  filteredProductos.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => selectVariante(v)}
                      className="w-full p-5 flex items-center justify-between rounded-3xl transition-all text-left mb-2 hover:bg-blue-50 border-2 border-transparent hover:border-blue-100 group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-500 transition-all">
                          <Package size={24} />
                        </div>
                        <div>
                          <div className="text-[10px] font-black text-blue-500 uppercase tracking-widest">
                            {v.product_code}
                          </div>
                          <div className="font-black text-slate-900 leading-tight">
                            {v.producto_nombre}
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">
                            {v.nombre_variante}
                          </div>
                        </div>
                      </div>
                      <div className="text-slate-300 group-hover:text-blue-500 transition-colors">
                        <ArrowRight size={20} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
