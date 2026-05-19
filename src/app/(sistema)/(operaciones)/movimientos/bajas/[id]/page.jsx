"use client";
import { LoadingScreen, PageHeader, Button, Heading, Text, Input, Badge } from '@/components/ui';
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Search, Package, AlertCircle, Info } from "lucide-react";
import ProductSearchModal from "@/components/movimientos/ProductSearchModal";
import { useApi } from "@/hooks/useApi";
import { getAllStockLotes } from "@/services/apis/inventario";
import { getBaja, actualizarBaja } from "@/services/apis/movimientos";

export default function EditarBajaPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedLoteInfo, setSelectedLoteInfo] = useState(null);

  // Cargar detalles de la baja actual con useApi
  const { data: bajaData, loading: loadingBaja } = useApi(getBaja, {
    auto: true,
    initialData: null,
    args: [id],
  });

  // Cargar lotes de stock con useApi
  const { data: stockLotesData } = useApi(getAllStockLotes, {
    auto: true,
    initialData: [],
  });

  const stockLotes = stockLotesData || [];

  // Envío de la actualización de la baja con useApi
  const { loading: isSubmitting, execute: submitBaja } = useApi(actualizarBaja, {
    auto: false,
  });

  const [baja, setBaja] = useState({
    lote: "",
    cantidad: 1,
    motivo: "ROTURA",
    observaciones: "",
  });

  // Pre-poblar los datos una vez cargados
  useEffect(() => {
    if (bajaData) {
      setBaja({
        lote: bajaData.lote,
        cantidad: bajaData.cantidad,
        motivo: bajaData.motivo || "ROTURA",
        observaciones: bajaData.observaciones || "",
      });

      if (stockLotes.length > 0) {
        const lote = stockLotes.find((l) => l.id === bajaData.lote);
        if (lote) {
          setSelectedLoteInfo(lote);
        } else {
          // Fallback robusto en caso de que no esté en la lista activa de lotes
          setSelectedLoteInfo({
            id: bajaData.lote,
            lote_codigo: bajaData.lote_codigo,
            variante_nombre: bajaData.variante_nombre,
            nombre_variante: bajaData.variante_especifica,
            deposito_nombre: bajaData.deposito_nombre,
            cantidad: bajaData.cantidad, // fallback stock
            vencimiento: bajaData.lote_vencimiento,
          });
        }
      } else {
        setSelectedLoteInfo({
          id: bajaData.lote,
          lote_codigo: bajaData.lote_codigo,
          variante_nombre: bajaData.variante_nombre,
          nombre_variante: bajaData.variante_especifica,
          deposito_nombre: bajaData.deposito_nombre,
          cantidad: bajaData.cantidad,
          vencimiento: bajaData.lote_vencimiento,
        });
      }
    }
  }, [bajaData, stockLotes]);

  const handleBajaChange = (e) => {
    const { name, value } = e.target;
    setBaja((prev) => ({ ...prev, [name]: value }));

    if (name === "cantidad" && selectedLoteInfo) {
      const val = value === "" ? "" : parseInt(value, 10);

      // Si es el lote original de la baja, sumamos la cantidad ya asignada al stock disponible temporalmente para la validación
      const stockDisponibleVal = selectedLoteInfo.id === bajaData?.lote
        ? (selectedLoteInfo.cantidad || 0)
        : (selectedLoteInfo.cantidad || 0);

      if (val !== "" && val > stockDisponibleVal) {
        setErrorMsg(
          `La cantidad no puede superar el stock disponible (${stockDisponibleVal})`,
        );
      } else if (val !== "" && val <= 0) {
        setErrorMsg(`La cantidad debe ser mayor a 0.`);
      } else {
        setErrorMsg(null);
      }
    }
  };

  const selectLote = (lote) => {
    setBaja((prev) => ({ ...prev, lote: lote.id, cantidad: 1 }));
    setSelectedLoteInfo(lote);
    setIsSearchOpen(false);
    setErrorMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones extra antes de enviar
    if (!baja.lote || errorMsg) return;
    if (!baja.cantidad || Number(baja.cantidad) <= 0) {
      setErrorMsg("Ingrese una cantidad válida.");
      return;
    }

    try {
      await submitBaja(id, {
        lote: baja.lote,
        cantidad: Number(baja.cantidad),
        motivo: baja.motivo,
        observaciones: baja.observaciones,
      });
      router.push("/movimientos/bajas");
    } catch (error) {
      // useErrorHandler ya muestra el mensaje
    }
  };

  if (loadingBaja) {
    return <LoadingScreen message="Cargando detalles de la baja..." />;
  }

  if (!bajaData) {
    return (
      <div className="p-20 text-center font-black uppercase text-slate-400 h-screen flex items-center justify-center">
        Baja no encontrada
      </div>
    );
  }

  // Prevenir edición de bajas que ya no están en BORRADOR
  if (bajaData.estado !== "BORRADOR") {
    return (
      <div className="p-20 text-center font-black uppercase text-slate-400 h-screen flex items-center justify-center flex-col gap-4">
        <Text variant="muted" className="mb-4">Solo se pueden editar bajas en estado BORRADOR</Text>
        <Button
          onClick={() => router.push("/movimientos/bajas")}
          variant="primary"
          className="uppercase tracking-widest"
        >
          Volver a Bajas
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Bajas de Inventario", href: "/movimientos/bajas" },
          { label: `Editar Baja #${id}` },
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
        <Button
          disabled={isSubmitting || !baja.lote || !!errorMsg || !baja.cantidad}
          onClick={handleSubmit}
          variant="primary"
          className="uppercase tracking-widest font-black"
        >
          {isSubmitting ? "GUARDANDO..." : "GUARDAR CAMBIOS"}
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1800px] mx-auto space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Selección de Producto/Lote */}
            <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
              <Heading level={3} className="text-xs text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <Package size={14} /> Producto y Lote a descontar
              </Heading>

              {!selectedLoteInfo ? (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="w-full p-10 border-2 border-dashed border-slate-200 rounded-[24px] text-slate-400 hover:border-rose-400 hover:text-rose-500 transition-all flex flex-col items-center gap-4 bg-slate-50/50"
                >
                  <Search size={40} className="opacity-20" />
                  <span className="font-black uppercase tracking-widest text-xs">
                    Click para buscar producto en stock
                  </span>
                </button>
              ) : (
                <div className="flex items-center justify-between p-6 bg-rose-50/50 border border-rose-100 rounded-[24px]">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-rose-100 shadow-sm">
                      <Package size={24} className="text-rose-600" />
                    </div>
                    <div className="flex-1">
                      <Text className="text-[10px] text-rose-400 uppercase tracking-widest">
                        {selectedLoteInfo.lote_codigo}
                      </Text>
                      <Heading level={4} className="text-slate-900 text-lg">
                        {selectedLoteInfo.variante_nombre}{" "}
                        {selectedLoteInfo.nombre_variante && (
                          <Text as="span" variant="muted" className="text-sm">
                            | {selectedLoteInfo.nombre_variante}
                          </Text>
                        )}
                      </Heading>
                      <Text className="text-xs text-slate-500 mb-1">
                        Depósito: {selectedLoteInfo.deposito_nombre}
                      </Text>
                      {selectedLoteInfo.vencimiento && (
                        <p
                          className={`text-[10px] font-black uppercase tracking-widest mt-1 ${new Date(selectedLoteInfo.vencimiento) < new Date()
                            ? "text-red-600"
                            : new Date(selectedLoteInfo.vencimiento) -
                              new Date() <
                              180 * 24 * 60 * 60 * 1000
                              ? "text-amber-600"
                              : "text-emerald-600"
                            }`}
                        >
                          {new Date(selectedLoteInfo.vencimiento) < new Date()
                            ? "⚠️ VENCIDO"
                            : new Date(selectedLoteInfo.vencimiento) -
                              new Date() <
                              180 * 24 * 60 * 60 * 1000
                              ? "⏰ PRÓXIMO A VENCER"
                              : "✓ VIGENTE"}{" "}
                          •{" "}
                          {new Date(
                            selectedLoteInfo.vencimiento,
                          ).toLocaleDateString("es-AR")}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <Text variant="muted" className="text-[10px] uppercase tracking-widest">
                      Stock Disponible
                    </Text>
                    <Text className="text-2xl text-slate-900">
                      {selectedLoteInfo.cantidad}{" "}
                      <Text as="span" className="text-sm">unid.</Text>
                    </Text>
                    <button
                      onClick={() => setSelectedLoteInfo(null)}
                      className="text-[10px] font-black text-rose-600 uppercase tracking-widest mt-2 hover:underline"
                    >
                      Cambiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Detalles de la Baja */}
            <div
              className={`bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm transition-opacity ${!selectedLoteInfo ? "opacity-50 pointer-events-none" : "opacity-100"}`}
            >
              <Heading level={3} className="text-xs text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Info size={14} /> Detalles de la Operación
              </Heading>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <Input
                    label="Cantidad a descontar"
                    type="number"
                    name="cantidad"
                    value={baja.cantidad}
                    onChange={handleBajaChange}
                    min="1"
                    className={errorMsg ? "border-red-500 ring-2 ring-red-50" : ""}
                  />
                  {errorMsg && (
                    <Text className="text-red-500 text-[10px] uppercase mt-2 ml-2 flex items-center gap-1">
                      <AlertCircle size={12} /> {errorMsg}
                    </Text>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Motivo de la baja
                  </label>
                  <select
                    name="motivo"
                    value={baja.motivo}
                    onChange={handleBajaChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[20px] p-4 font-black text-sm outline-none focus:ring-4 focus:ring-rose-500/10 transition-all appearance-none"
                  >
                    <option value="VENCIMIENTO">Vencimiento de producto</option>
                    <option value="ROTURA">Rotura o Daño</option>
                    <option value="PERDIDA">Pérdida o Extravío</option>
                    <option value="ERROR_STOCK">
                      Ajuste por diferencia de inventario
                    </option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">
                    Observaciones adicionales
                  </label>
                  <textarea
                    name="observaciones"
                    value={baja.observaciones}
                    onChange={handleBajaChange}
                    rows="3"
                    placeholder="Escribe aquí el motivo detallado de la baja..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-[24px] p-5 font-medium text-sm outline-none focus:ring-4 focus:ring-rose-500/10 transition-all resize-none"
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          {/* Modal de búsqueda de producto */}
          <ProductSearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onSelect={selectLote}
            lotes={stockLotes}
          />
        </div>
      </main>
    </div>
  );
}
