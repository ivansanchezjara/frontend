"use client";
import { useEffect } from "react";
import { X, MapPin, Info, Image as ImageIcon, Tag, Package, Copy } from "lucide-react";
import { Button, Text } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getVarianteDetalleVenta, getFullImageUrl } from "@/services/apis/catalogo";
import { getLotesPorVarianteId } from "@/services/apis/inventario";

/**
 * Modal de ficha completa de producto para vendedores.
 * Muestra info del producto arriba y stock por depósito abajo, todo en un scroll.
 * Incluye botón para copiar la info del producto como texto para enviar al cliente.
 *
 * Props:
 * - varianteId: ID de la variante a mostrar (null para cerrar)
 * - onClose: callback para cerrar el modal
 */
export default function FichaProductoModal({ varianteId, onClose }) {
  const { showToast } = useToast();

  const { data: detalle, loading: loadingDetalle, execute: fetchDetalle } = useApi(
    getVarianteDetalleVenta,
    { auto: false, initialData: null }
  );

  const { data: lotesData, loading: loadingLotes, execute: fetchLotes } = useApi(
    getLotesPorVarianteId,
    { auto: false, initialData: [] }
  );

  useEffect(() => {
    if (varianteId) {
      fetchDetalle(varianteId);
      fetchLotes(varianteId);
    }
  }, [varianteId, fetchDetalle, fetchLotes]);

  if (!varianteId) return null;

  const lotes = Array.isArray(lotesData) ? lotesData : (lotesData?.results || []);

  // Genera texto para compartir con el cliente (sin info interna de stock)
  const handleCopiarInfo = () => {
    if (!detalle) return;

    const lineas = [];
    lineas.push(`📦 *${detalle.producto_padre_nombre}*`);
    if (detalle.nombre_variante && detalle.nombre_variante !== detalle.producto_padre_nombre) {
      lineas.push(`Variante: ${detalle.nombre_variante}`);
    }
    lineas.push(`Código: ${detalle.product_code}`);
    if (detalle.brand) lineas.push(`Marca: ${detalle.brand}`);
    if (detalle.categoria_nombre) lineas.push(`Categoría: ${detalle.categoria_nombre}`);
    if (detalle.sub_category) lineas.push(`Subcategoría: ${detalle.sub_category}`);

    // Atributos
    const atributos = detalle.atributos || {};
    if (Object.keys(atributos).length > 0) {
      lineas.push("");
      lineas.push("📋 *Especificaciones:*");
      Object.entries(atributos).forEach(([key, value]) => {
        lineas.push(`  • ${key}: ${value}`);
      });
    }

    // Descripción
    if (detalle.description) {
      lineas.push("");
      lineas.push(detalle.description);
    }

    if (detalle.long_description) {
      lineas.push("");
      lineas.push(detalle.long_description);
    }

    // Tags
    const tags = detalle.tags || [];
    if (tags.length > 0) {
      lineas.push("");
      lineas.push(`🏷️ ${tags.join(", ")}`);
    }

    navigator.clipboard.writeText(lineas.join("\n"));
    showToast("Info del producto copiada al portapapeles", "success");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 pb-4 flex justify-between items-start border-b border-slate-100 bg-slate-50">
          <div className="flex-1 min-w-0">
            {detalle && (
              <>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Text variant="bodyXs" className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase tracking-widest font-black shrink-0 inline-block">
                    {detalle.product_code}
                  </Text>
                  {detalle.brand && (
                    <Text variant="bodyXs" className="text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 uppercase tracking-widest font-bold">
                      {detalle.brand}
                    </Text>
                  )}
                  {detalle.categoria_nombre && (
                    <Text variant="bodyXs" className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-widest font-bold">
                      {detalle.categoria_nombre}
                    </Text>
                  )}
                </div>
                <Text as="h2" className="text-xl font-black text-slate-900 tracking-tight mt-2">
                  {detalle.producto_padre_nombre}
                </Text>
                {detalle.nombre_variante && detalle.nombre_variante !== detalle.producto_padre_nombre && (
                  <Text variant="bodySm" className="text-slate-500 font-bold mt-0.5">
                    {detalle.nombre_variante}
                  </Text>
                )}
              </>
            )}
            {!detalle && loadingDetalle && (
              <Text className="text-slate-400 animate-pulse">Cargando ficha...</Text>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            {detalle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopiarInfo}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 gap-1.5"
                title="Copiar info del producto para enviar al cliente"
              >
                <Copy className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Copiar info</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={onClose}
              className="w-10 h-10 rounded-2xl border-slate-200 text-slate-400 hover:text-slate-800 shadow-sm font-extrabold"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content — todo en un solo scroll */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
          {/* ─── Sección: Producto ─────────────────────────────── */}
          <SeccionProducto detalle={detalle} loading={loadingDetalle} />

          {/* ─── Separador ─────────────────────────────────────── */}
          {detalle && (
            <div className="flex items-center gap-3 select-none">
              <div className="flex-1 h-px bg-slate-200" />
              <Text variant="label" className="text-slate-400 flex items-center gap-1.5">
                <Package size={12} /> Stock por depósito
              </Text>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          )}

          {/* ─── Sección: Stock ────────────────────────────────── */}
          <SeccionStock detalle={detalle} lotes={lotes} loading={loadingLotes} />
        </div>
      </div>
    </div>
  );
}

// ─── Sección: Producto ──────────────────────────────────────────

function SeccionProducto({ detalle, loading }) {
  if (loading || !detalle) {
    return (
      <div className="py-8 text-center">
        <Text variant="muted" className="animate-pulse">Cargando información del producto...</Text>
      </div>
    );
  }

  const imagenes = detalle.imagenes || [];
  const imagenPrincipal = detalle.imagen_principal_url || detalle.imagen_url;
  const todasImagenes = [
    ...(imagenPrincipal ? [{ url: imagenPrincipal, descripcion: "Principal" }] : []),
    ...imagenes.filter((img) => img.url !== imagenPrincipal),
  ];
  const atributos = detalle.atributos || {};
  const tags = detalle.tags || [];

  const sinDatos = !detalle.description && !detalle.long_description && todasImagenes.length === 0 && Object.keys(atributos).length === 0;

  if (sinDatos) {
    return (
      <div className="py-6 text-center">
        <Info className="w-8 h-8 text-slate-200 mx-auto mb-2" />
        <Text variant="muted">Este producto aún no tiene información detallada cargada.</Text>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Descripción corta */}
      {detalle.description && (
        <p className="text-sm text-slate-700 leading-relaxed">
          {detalle.description}
        </p>
      )}

      {/* Descripción larga */}
      {detalle.long_description && (
        <div>
          <Text variant="label" className="text-slate-400 mb-1.5">Descripción detallada</Text>
          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {detalle.long_description}
          </p>
        </div>
      )}

      {/* Ficha técnica — tabla plana */}
      {(detalle.sub_category || detalle.professional_area || Object.keys(atributos).length > 0) && (
        <div>
          <Text variant="label" className="text-slate-400 mb-2 flex items-center gap-1.5">
            <Tag size={12} /> Ficha técnica
          </Text>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {detalle.sub_category && (
                <tr>
                  <td className="py-2 pr-4 text-slate-500 font-medium w-1/3">Subcategoría</td>
                  <td className="py-2 text-slate-800">{detalle.sub_category}</td>
                </tr>
              )}
              {detalle.professional_area && (
                <tr>
                  <td className="py-2 pr-4 text-slate-500 font-medium w-1/3">Área profesional</td>
                  <td className="py-2 text-slate-800">{detalle.professional_area}</td>
                </tr>
              )}
              {Object.entries(atributos).map(([key, value]) => (
                <tr key={key}>
                  <td className="py-2 pr-4 text-slate-500 font-medium w-1/3 capitalize">{key}</td>
                  <td className="py-2 text-slate-800">{String(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 rounded"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Imágenes */}
      {todasImagenes.length > 0 && (
        <div>
          <Text variant="label" className="text-slate-400 mb-3 flex items-center gap-1.5">
            <ImageIcon size={12} /> Imágenes ({todasImagenes.length})
          </Text>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {todasImagenes.map((img, i) => (
              <div
                key={i}
                className="aspect-square border border-slate-200 overflow-hidden bg-white group cursor-pointer rounded-lg"
              >
                <img
                  src={getFullImageUrl(img.url)}
                  alt={img.descripcion || `Imagen ${i + 1}`}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sección: Stock ─────────────────────────────────────────────

function SeccionStock({ detalle, lotes, loading }) {
  if (loading) {
    return (
      <div className="py-8 text-center">
        <Text variant="muted" className="animate-pulse">Cargando stock...</Text>
      </div>
    );
  }

  const getSemaforoVencimiento = (vencimiento) => {
    if (!vencimiento)
      return { color: "text-slate-300", dot: "bg-slate-200", label: "Sin vencimiento" };
    const days = (new Date(vencimiento) - new Date()) / (1000 * 60 * 60 * 24);
    if (days < 0)
      return { color: "text-red-900", dot: "bg-red-900 animate-pulse", label: "VENCIDO" };
    if (days < 90)
      return { color: "text-red-500", dot: "bg-red-500", label: "< 90 días" };
    if (days < 180)
      return { color: "text-yellow-500", dot: "bg-yellow-500", label: "< 180 días" };
    return { color: "text-emerald-500", dot: "bg-emerald-500", label: "Al día" };
  };

  const lotesConStock = lotes.filter((l) => l.cantidad > 0);
  const stockDisponible = lotesConStock
    .filter((l) => !l.esta_vencido)
    .reduce((sum, l) => sum + l.cantidad, 0);
  const stockVencido = lotesConStock
    .filter((l) => l.esta_vencido)
    .reduce((sum, l) => sum + l.cantidad, 0);

  return (
    <div className="space-y-5">
      {/* Resumen rápido */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
        <StockCard color="emerald" label="Disponible" cantidad={stockDisponible} />
        <StockCard color="purple" label="Consignación" cantidad={detalle?.stock_en_consignacion || 0} />
        <StockCard color="blue" label="Reservado" cantidad={detalle?.stock_reservado || 0} />
        <StockCard color="red" label="Vencido" cantidad={stockVencido} />
      </div>

      {/* Desglose por lotes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {(() => {
          if (lotesConStock.length === 0) {
            return (
              <div className="col-span-2 py-10 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 select-none">
                <Package className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <Text variant="bodyXs" className="text-slate-400 font-bold uppercase tracking-widest">
                  Sin stock disponible
                </Text>
              </div>
            );
          }

          // Agrupar por código de lote
          const lotesAgrupados = lotesConStock.reduce((acc, lote) => {
            const code = lote.lote_codigo;
            if (!acc[code]) {
              acc[code] = {
                lote_codigo: code,
                vencimiento: lote.vencimiento,
                esta_vencido: lote.esta_vencido,
                total_cantidad: 0,
                ubicaciones: [],
              };
            }
            acc[code].total_cantidad += lote.cantidad;
            if (lote.esta_vencido) acc[code].esta_vencido = true;
            acc[code].ubicaciones.push({
              id: lote.id,
              deposito_nombre: lote.deposito_nombre,
              cantidad: lote.cantidad,
              esta_vencido: lote.esta_vencido,
            });
            return acc;
          }, {});

          return Object.values(lotesAgrupados).map((grupo, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl border bg-white border-slate-100 hover:border-slate-300 transition-all flex flex-col"
            >
              <div className="flex justify-between items-start mb-3 select-none">
                <div>
                  <Text variant="label" className="text-slate-400 text-[10px]">Lote</Text>
                  <Text className="text-sm font-black text-slate-800">{grupo.lote_codigo}</Text>
                </div>
                <div className="text-right">
                  <Text className="text-lg font-black text-slate-900">
                    {grupo.total_cantidad} <span className="text-xs font-normal">u.</span>
                  </Text>
                  {grupo.esta_vencido && (
                    <div className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                      VENCIDO
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-3 select-none">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getSemaforoVencimiento(grupo.vencimiento).dot}`}></div>
                  <Text className={`text-[11px] font-black uppercase tracking-tight ${getSemaforoVencimiento(grupo.vencimiento).color}`}>
                    {grupo.vencimiento || "Sin fecha"}
                  </Text>
                </div>
              </div>

              <div className="mt-auto bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Text variant="label" className="text-slate-400 mb-1.5 flex items-center gap-1.5 select-none text-[10px]">
                  <MapPin size={10} /> Ubicaciones
                </Text>
                <div className="space-y-1.5">
                  {grupo.ubicaciones.map((ubi) => (
                    <div key={ubi.id} className="flex justify-between items-center text-xs">
                      <Text variant="bodyXs" className="font-bold text-slate-600">
                        {ubi.deposito_nombre || "Depósito"}
                      </Text>
                      <div className="flex items-center gap-2">
                        <Text variant="bodyXs" className="font-black text-slate-800">
                          {ubi.cantidad} u.
                        </Text>
                        {ubi.esta_vencido && (
                          <span className="font-bold text-red-500 bg-white px-1.5 rounded-md border border-red-100 text-[10px]">
                            vencido
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ));
        })()}
      </div>
    </div>
  );
}

function StockCard({ color, label, cantidad }) {
  const colorMap = {
    emerald: "bg-emerald-50/70 border-emerald-100 text-emerald-600 text-emerald-700",
    purple: "bg-purple-50/70 border-purple-100 text-purple-600 text-purple-700",
    blue: "bg-blue-50/70 border-blue-100 text-blue-600 text-blue-700",
    red: "bg-red-50/70 border-red-100 text-red-600 text-red-700",
  };
  const [bg, border, labelColor, valueColor] = colorMap[color].split(" ");

  return (
    <div className={`${bg} p-3 rounded-2xl border ${border}`}>
      <Text variant="label" className={`${labelColor} block mb-0.5`}>{label}</Text>
      <Text className={`text-lg font-black ${valueColor}`}>
        {cantidad} <span className="text-xs font-normal">u.</span>
      </Text>
    </div>
  );
}
