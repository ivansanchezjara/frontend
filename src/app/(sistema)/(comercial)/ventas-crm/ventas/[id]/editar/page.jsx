"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import { Button, PageHeader, LoadingScreen } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getVenta, updateVenta, buscarProductos } from "@/services/apis/ventas";
import VentaBuilderSplit from "@/components/comercial/ventas/pos/VentaBuilderSplit";

export default function EditarVentaPage() {
  const router = useRouter();
  const { id } = useParams();
  const { showToast } = useToast();

  const { data: ventaOriginal, loading, error, execute: fetchVenta } = useApi(getVenta);
  const { execute: guardarVenta } = useApi(updateVenta);

  const [ventaData, setVentaData] = useState({
    origen: "sucursal",
    moneda_negociacion: "USD",
    cliente: null,
    deposito_sucursal: null,
  });
  const [lineas, setLineas] = useState([]);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // ─── Cargar venta existente ─────────────────────────────────
  useEffect(() => {
    if (id) {
      fetchVenta(id);
    }
  }, [id, fetchVenta]);

  // ─── Inicializar estado con datos de la venta ───────────────
  useEffect(() => {
    if (ventaOriginal && !initialized) {
      // Solo permitir edición si está en borrador
      if (ventaOriginal.estado !== "borrador") {
        showToast("Solo se pueden editar ventas en estado borrador.", "error");
        router.push(`/ventas-crm/ventas/${id}`);
        return;
      }

      setVentaData({
        origen: ventaOriginal.origen || "sucursal",
        moneda_negociacion: ventaOriginal.moneda_negociacion || "USD",
        cliente: ventaOriginal.cliente_detalle
          ? {
              id: ventaOriginal.cliente_detalle.id,
              razon_social: ventaOriginal.cliente_detalle.razon_social,
              tier_precio: ventaOriginal.cliente_detalle.tier_precio || "publico",
            }
          : null,
        deposito_sucursal: ventaOriginal.deposito_sucursal || null,
      });

      // Mapear líneas y luego buscar stock para cada una
      const lineasBase = (ventaOriginal.lineas || []).map((l) => {
        const precioUsd = parseFloat(l.precio_unitario_usd) || 0;
        const precioMoneda = parseFloat(l.precio_unitario_moneda) || precioUsd;
        const cantidad = l.cantidad || 1;
        // Mapear asignaciones existentes
        const asignaciones = (l.asignaciones || []).map((a) => ({
          lote: a.lote,
          lote_codigo: a.lote_codigo || "",
          vencimiento: a.vencimiento || null,
          cantidad: a.cantidad,
        }));
        return {
          variante_id: l.variante,
          product_code: l.variante_codigo || "",
          nombre: l.producto_nombre || l.variante_nombre || `Variante #${l.variante}`,
          nombre_variante: l.variante_nombre || "",
          brand: "",
          cantidad,
          stock: null,
          precio_usd: precioUsd,
          precio_moneda: precioMoneda,
          subtotal_usd: precioUsd * cantidad,
          subtotal_moneda: precioMoneda * cantidad,
          tiene_oferta: false,
          precio_oferta: null,
          precio_tier_usd: precioUsd,
          oferta_vence: null,
          asignaciones,
        };
      });

      setLineas(lineasBase);
      setInitialized(true);

      // Buscar stock disponible para cada variante en paralelo
      const codigos = lineasBase
        .map((l) => l.product_code)
        .filter(Boolean);

      if (codigos.length > 0) {
        // Buscar por cada código para obtener stock actual
        Promise.all(
          codigos.map((code) =>
            buscarProductos({ q: code }).catch(() => [])
          )
        ).then((results) => {
          // Construir mapa variante_id → stock
          const stockMap = {};
          results.forEach((data) => {
            const items = Array.isArray(data) ? data : (data?.results || []);
            items.forEach((v) => {
              const stock = v?.stock ?? v?.stock_disponible ?? v?.stock_total ?? v?.stock_actual ?? null;
              stockMap[v.id] = stock;
            });
          });

          // Actualizar líneas con stock
          setLineas((prev) =>
            prev.map((l) => ({
              ...l,
              stock: stockMap[l.variante_id] ?? l.stock,
            }))
          );
        });
      }
    }
  }, [ventaOriginal, initialized, id, router, showToast]);

  // ─── Guardar cambios ────────────────────────────────────────
  const handleGuardar = async () => {
    if (lineas.length === 0) {
      showToast("Agregá al menos un producto a la venta.", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        origen: ventaData.origen,
        moneda_negociacion: ventaData.moneda_negociacion,
        cliente: ventaData.cliente?.id || null,
        deposito_sucursal: ventaData.deposito_sucursal || null,
        lineas: lineas.map((l) => ({
          variante: l.variante_id,
          cantidad: l.cantidad,
          ...(l.asignaciones && l.asignaciones.length > 0
            ? { asignaciones: l.asignaciones.map((a) => ({ lote: a.lote, cantidad: a.cantidad })) }
            : {}),
        })),
      };

      await guardarVenta(id, payload);
      showToast("Venta actualizada correctamente", "success");
      router.push(`/ventas-crm/ventas/${id}`);
    } catch (err) {
      const detail = err?.data?.detail || err?.message || "Error al actualizar la venta.";
      showToast(detail, "error");
    } finally {
      setSaving(false);
    }
  };

  // ─── Estados de carga ───────────────────────────────────────
  if (loading && !initialized) {
    return <LoadingScreen texto="Cargando venta..." />;
  }

  if (error && !ventaOriginal) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-sm text-red-500">Error al cargar la venta.</p>
        <Button variant="secondary" onClick={() => router.push("/ventas-crm/ventas")}>
          Volver al listado
        </Button>
      </div>
    );
  }

  if (!initialized) return null;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Ventas", href: "/ventas-crm/ventas" },
          { label: `Venta #${id}`, href: `/ventas-crm/ventas/${id}` },
          { label: "Editar" },
        ]}
        subtitle="Editando borrador de venta"
        subtitleClassName="text-emerald-600"
      >
        <div className="flex items-center gap-3">
          <Link href={`/ventas-crm/ventas/${id}`}>
            <Button variant="secondary" size="sm" icon={ArrowLeft}>
              Volver
            </Button>
          </Link>
          <Button
            variant="success"
            size="sm"
            icon={saving ? Loader2 : Save}
            className={saving ? "[&_svg]:animate-spin" : ""}
            onClick={handleGuardar}
            disabled={saving || lineas.length === 0}
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </PageHeader>

      {/* Contenido principal — layout split */}
      <main className="flex-1 overflow-hidden min-w-0">
        <VentaBuilderSplit
          ventaData={ventaData}
          onVentaChange={setVentaData}
          lineas={lineas}
          onLineasChange={setLineas}
          onGuardar={handleGuardar}
          saving={saving}
        />
      </main>
    </div>
  );
}
