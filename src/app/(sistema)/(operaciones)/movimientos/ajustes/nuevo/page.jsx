"use client";
import { PageHeader, Button, Heading, Text, Input } from '@/components/ui';
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Package,
  Settings2,
  Boxes,
  ArrowDownRight,
  MapPin,
} from "lucide-react";
import ProductSearchModal from "@/components/movimientos/ProductSearchModal";
import { useApi } from "@/hooks/useApi";
import { getStockLotes } from "@/services/apis/inventario";
import { crearAjuste } from "@/services/apis/movimientos";
import { useToast } from "@/components/ui/feedback/ToastContext";
import { useConfirm } from "@/components/ui/feedback/ConfirmContext";

export default function NuevoAjusteInventarioPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirm();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // 2. Lotes para la variante seleccionada
  const { execute: fetchVarianteLotes } = useApi(getStockLotes, {
    auto: false,
    initialData: { results: [] },
  });

  // 3. Envío del ajuste
  const { loading: isSubmitting, execute: submitAjuste } = useApi(crearAjuste, {
    auto: false,
  });

  // --- ESTADO LOCAL ---
  const [ajuste, setAjuste] = useState({
    variante: "",
    motivo: "",
    observaciones: "",
  });

  const [selectedVarianteInfo, setSelectedVarianteInfo] = useState(null);
  const [lotes, setLotes] = useState([]); // Lotes locales con estados de edición

  const handleAjusteChange = (e) => {
    const { name, value } = e.target;
    setAjuste((prev) => ({ ...prev, [name]: value }));
  };

  // Función para manejar cambios dentro de la tabla de lotes
  const handleLoteChange = (loteId, field, value) => {
    // No permitir cantidades negativas
    if (field === "nueva_cantidad" && value !== "" && parseInt(value, 10) < 0)
      return;

    setLotes((prev) =>
      prev.map((lote) => {
        if (lote.id !== loteId) return lote;
        const nextLote = { ...lote, [field]: value };

        if (field === "nuevo_lote_codigo") {
          nextLote.destino_lote_id = null;
        }

        return nextLote;
      }),
    );
  };

  const handleLoteDestinoChange = (loteId, destinoId) => {
    setLotes((prev) => {
      const destino = prev.find((item) => item.id === Number(destinoId));
      return prev.map((lote) =>
        lote.id === loteId
          ? {
            ...lote,
            nuevo_lote_codigo: destino
              ? destino.lote_codigo
              : lote.nuevo_lote_codigo,
            destino_lote_id: destino ? destino.id : null,
          }
          : lote,
      );
    });
  };

  const totalStockActual = lotes.reduce(
    (sum, lote) => sum + Number(lote.cantidad_actual || 0),
    0,
  );

  const totalStockPropuesto = lotes.reduce((sum, lote) => {
    const cantidadActual = Number(lote.cantidad_actual || 0);
    const nuevaCantidad =
      lote.nueva_cantidad !== ""
        ? parseInt(lote.nueva_cantidad, 10)
        : cantidadActual;
    const splitDiff =
      lote.nuevo_lote_codigo && lote.nueva_cantidad !== ""
        ? Math.max(cantidadActual - parseInt(lote.nueva_cantidad, 10), 0)
        : 0;
    return sum + nuevaCantidad + splitDiff;
  }, 0);

  const totalsMatch = totalStockActual === totalStockPropuesto;
  const hasAnyChange = lotes.some(
    (l) =>
      l.nueva_cantidad !== "" ||
      l.nuevo_vencimiento !== "" ||
      l.nuevo_lote_codigo !== "",
  );

  const selectVariante = async (v) => {
    setSelectedVarianteInfo(v);
    setAjuste((prev) => ({ ...prev, variante: v.id }));
    setIsSearchOpen(false);

    try {
      const data = await fetchVarianteLotes({ variante: v.id, limit: 1000 });
      const lotesFetch = data?.results || data || [];

      setLotes(
        lotesFetch.map((l) => ({
          id: l.id,
          lote_codigo: l.lote_codigo,
          deposito: l.deposito,
          vencimiento_actual: l.vencimiento || "",
          cantidad_actual: l.cantidad,
          deposito_nombre: l.deposito_nombre,
          nueva_cantidad: "",
          nuevo_vencimiento: "",
          nuevo_lote_codigo: "",
          destino_lote_id: null,
        })),
      );
    } catch (err) {
      setLotes([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ajuste.variante || isSubmitting) return;

    if (!ajuste.motivo || ajuste.motivo.trim() === "") {
      showToast("Debes describir el motivo del ajuste antes de continuar.", "error");
      return;
    }

    const lotesModificados = lotes.filter(
      (l) =>
        l.nueva_cantidad !== "" ||
        l.nuevo_vencimiento !== "" ||
        l.nuevo_lote_codigo !== "",
    );

    if (lotesModificados.length === 0) {
      showToast("Debes modificar al menos un lote antes de enviar el ajuste.", "error");
      return;
    }

    const invalidSplit = lotesModificados.some((l) => {
      const nuevaCantidad =
        l.nueva_cantidad !== "" ? parseInt(l.nueva_cantidad, 10) : null;
      if (l.nuevo_lote_codigo && nuevaCantidad !== null) {
        return nuevaCantidad >= l.cantidad_actual || nuevaCantidad < 0;
      }
      if (nuevaCantidad !== null && nuevaCantidad < 0) {
        return true;
      }
      return false;
    });

    if (invalidSplit) {
      showToast(
        "Para crear un nuevo lote, la cantidad debe reducirse respecto al lote original y no puede ser negativa.",
        "error"
      );
      return;
    }

    if (totalStockActual !== totalStockPropuesto) {
      showToast(
        "El stock total debe permanecer igual. Ajusta cantidades o splits para igualar el total antes y después.",
        "error"
      );
      return;
    }

    const isConfirmed = await confirm(
      "¿Estás seguro de guardar este ajuste de inventario?",
      "Guardar Ajuste"
    );

    if (!isConfirmed) return;

    const payload = {
      variante: ajuste.variante,
      motivo: ajuste.motivo,
      observaciones: ajuste.observaciones,
      lotes_ajustados: lotesModificados.map((l) => ({
        lote: l.id,
        nueva_cantidad:
          l.nueva_cantidad !== "" ? parseInt(l.nueva_cantidad, 10) : undefined,
        nuevo_vencimiento:
          l.nuevo_vencimiento !== "" ? l.nuevo_vencimiento : undefined,
        nuevo_lote_codigo:
          l.nuevo_lote_codigo !== "" ? l.nuevo_lote_codigo : undefined,
        lote_destino: l.destino_lote_id || undefined,
      })),
    };

    try {
      await submitAjuste(payload);
      showToast("Ajuste guardado con éxito", "success");
      router.push("/movimientos/ajustes");
    } catch (error) {
      showToast("Error al guardar el ajuste", "error");
    }
  };

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
              Auditoría y redistribución de stock por lotes y depósitos.
            </span>
          </>
        }
      >
        <Button
          disabled={isSubmitting || !selectedVarianteInfo || !hasAnyChange || !totalsMatch}
          onClick={handleSubmit}
          variant="primary"
          className="uppercase tracking-widest font-black"
        >
          {isSubmitting ? "GUARDANDO..." : "GUARDAR AJUSTE"}
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-[1200px] mx-auto space-y-6">
          {/* SECCIÓN 1: PRODUCTO */}
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
            <Heading level={3} className="text-xs text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Package size={14} /> Producto a Ajustar
            </Heading>

            <div className="grid grid-cols-1 gap-6">
              {!selectedVarianteInfo ? (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="w-full p-10 border-2 border-dashed border-slate-200 rounded-[24px] text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all flex flex-col items-center gap-4 bg-slate-50/50"
                >
                  <Search size={40} className="opacity-20" />
                  <Text variant="label" className="uppercase tracking-widest">
                    Click para buscar producto en stock
                  </Text>
                </button>
              ) : (
                <div className="flex items-center justify-between p-6 bg-blue-50/50 border border-blue-100 rounded-[24px]">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
                      <Package size={24} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <Text variant="label" className="mb-1">{selectedVarianteInfo.product_code}</Text>
                      <Heading level={4} className="text-slate-900 text-lg">
                        {selectedVarianteInfo.producto_nombre}
                        <Text as="span" variant="muted" className="text-sm ml-2">
                          | {selectedVarianteInfo.nombre_variante}
                        </Text>
                      </Heading>
                      <button
                        onClick={() => {
                          setSelectedVarianteInfo(null);
                          setLotes([]);
                        }}
                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1 hover:underline"
                      >
                        Cambiar producto
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedVarianteInfo && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                  <div className="space-y-2">
                    <Input
                      label="Motivo del ajuste"
                      name="motivo"
                      value={ajuste.motivo}
                      onChange={handleAjusteChange}
                      placeholder="Ej: Error de carga, Auditoría periódica..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      label="Observaciones adicionales"
                      name="observaciones"
                      value={ajuste.observaciones}
                      onChange={handleAjusteChange}
                      placeholder="Comentarios adicionales opcionales..."
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECCIÓN 2: RESUMEN DE STOCK */}
          {selectedVarianteInfo && (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm text-center">
                <Text variant="muted" className="text-[10px] uppercase tracking-widest mb-2">
                  Total Actual
                </Text>
                <Text variant="bodyBold" className="text-3xl text-slate-900">
                  {totalStockActual}
                </Text>
              </div>
              <div
                className={`p-6 rounded-[24px] border shadow-sm text-center flex flex-col justify-center transition-all ${totalsMatch
                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                  : "bg-rose-50 border-rose-100 text-rose-700"
                  }`}
              >
                <Text variant="label" className="uppercase tracking-widest mb-1">
                  {totalsMatch ? "✓ Stock Balanceado" : "⚠️ Desbalance"}
                </Text>
                {!totalsMatch && (
                  <Text variant="bodyXs" className="opacity-70 leading-tight">
                    La suma final debe igualar a la actual
                  </Text>
                )}
              </div>
              <div className="bg-white p-6 rounded-[24px] border border-slate-200 shadow-sm text-center">
                <Text variant="bodyXs" className="text-[10px] text-blue-400 uppercase tracking-widest mb-2">
                  Total Propuesto
                </Text>
                <Text variant="bodyBold" className="text-3xl text-blue-900">
                  {totalStockPropuesto}
                </Text>
              </div>
            </div>
          )}

          {/* SECCIÓN 3: DETALLE DE LOTES */}
          {selectedVarianteInfo && (
            <div className="space-y-4">
              <Heading level={3} className="text-xs text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
                <Boxes size={14} /> Distribución por Lotes
              </Heading>

              <div className="space-y-4">
                {lotes.filter((l) => l.cantidad_actual > 0).length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-[32px] bg-slate-50/50">
                    <Text variant="label" className="text-slate-400 uppercase tracking-widest">
                      No hay lotes con stock para este producto
                    </Text>
                  </div>
                ) : (
                  lotes
                    .filter((l) => l.cantidad_actual > 0)
                    .map((lote) => (
                      <div
                        key={lote.id}
                        className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100"
                      >
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* LADO IZQUIERDO: ACTUAL */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                                <MapPin size={16} />
                              </div>
                              <Text variant="label" className="uppercase tracking-widest">
                                {lote.lote_codigo} • {lote.deposito_nombre}
                              </Text>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-50 p-4 rounded-2xl">
                                <Text variant="label" className="uppercase mb-1">Cantidad Actual</Text>
                                <Text variant="bodyBold" className="text-slate-700">
                                  {lote.cantidad_actual} u.
                                </Text>
                              </div>
                              <div className="bg-slate-50 p-4 rounded-2xl">
                                <Text variant="label" className="uppercase mb-1">Vencimiento Actual</Text>
                                <Text variant="bodyXs" className="uppercase">
                                  {lote.vencimiento_actual || "Sin fecha"}
                                </Text>
                              </div>
                            </div>
                          </div>

                          {/* LADO DERECHO: NUEVO */}
                          <div className="space-y-4 relative">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                <Settings2 size={16} />
                              </div>
                              <Text variant="label" className="uppercase tracking-widest">
                                Ajuste de Valores
                              </Text>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <Input
                                  label="Nueva Cantidad"
                                  type="number"
                                  min="0"
                                  value={lote.nueva_cantidad}
                                  onChange={(e) =>
                                    handleLoteChange(
                                      lote.id,
                                      "nueva_cantidad",
                                      e.target.value,
                                    )
                                  }
                                  placeholder={lote.cantidad_actual}
                                />
                              </div>
                              <div className="space-y-1">
                                <Input
                                  label="Nuevo Vencimiento"
                                  type="date"
                                  value={lote.nuevo_vencimiento}
                                  onChange={(e) =>
                                    handleLoteChange(
                                      lote.id,
                                      "nuevo_vencimiento",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* ABAJO: DESTINO DE LA DIFERENCIA */}
                        {lote.nueva_cantidad !== "" &&
                          parseInt(lote.nueva_cantidad, 10) <
                          lote.cantidad_actual && (
                            <div className="p-6 bg-slate-50/50 space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <ArrowDownRight
                                    className="text-blue-500"
                                    size={18}
                                  />
                                  <Text variant="label" className="uppercase tracking-widest">
                                    Redistribución de Diferencia (
                                    {lote.cantidad_actual -
                                      parseInt(lote.nueva_cantidad, 10)}{" "}
                                    u.)
                                  </Text>
                                </div>
                                <Text variant="bodyXs" className="uppercase">
                                  Seleccioná a dónde mover las unidades
                                  restantes
                                </Text>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {lotes
                                  .filter((other) => other.id !== lote.id)
                                  .map((other) => (
                                    <button
                                      key={other.id}
                                      type="button"
                                      onClick={() =>
                                        handleLoteDestinoChange(
                                          lote.id,
                                          other.id,
                                        )
                                      }
                                      className={`p-3 rounded-2xl border text-left transition-all ${lote.destino_lote_id === other.id
                                        ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                                        : "border-slate-200 bg-white hover:border-slate-400"
                                        }`}
                                    >
                                      <div className="flex items-center justify-between mb-1">
                                        <Text variant="bodyXs" className="truncate">
                                          {other.lote_codigo}
                                        </Text>
                                        <div
                                          className={`w-2 h-2 rounded-full ${lote.destino_lote_id === other.id ? "bg-blue-500 animate-pulse" : "bg-slate-200"}`}
                                        />
                                      </div>
                                      <Text variant="bodyXs" className="uppercase truncate">
                                        {other.deposito_nombre}
                                      </Text>
                                    </button>
                                  ))}

                                <div
                                  onClick={() =>
                                    handleLoteDestinoChange(lote.id, null)
                                  }
                                  className={`p-3 rounded-2xl border text-left transition-all group cursor-pointer ${lote.destino_lote_id === null &&
                                    lote.nuevo_lote_codigo
                                    ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                                    : "border-slate-200 bg-white border-dashed hover:border-blue-400"
                                    }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    <Text variant="label" className={lote.destino_lote_id === null && lote.nuevo_lote_codigo ? "text-blue-600" : "text-slate-400 group-hover:text-blue-500"}>
                                      Nuevo Lote
                                    </Text>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Escribir código..."
                                    value={
                                      lote.destino_lote_id === null
                                        ? lote.nuevo_lote_codigo
                                        : ""
                                    }
                                    onChange={(e) => {
                                      handleLoteChange(
                                        lote.id,
                                        "nuevo_lote_codigo",
                                        e.target.value,
                                      );
                                    }}
                                    className="w-full bg-transparent border-none p-0 text-[11px] font-black text-slate-900 focus:ring-0 placeholder:text-slate-300"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </div>

        {isSearchOpen && (
          <ProductSearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            mode="variante"
            onSelect={(item) => {
              selectVariante({
                id: item.variante,
                product_code: item.variante_codigo,
                producto_nombre: item.variante_nombre,
                nombre_variante: item.nombre_variante,
              });
            }}
            apiFunc={getStockLotes}
          />
        )}
      </main>
    </div>
  );
}
