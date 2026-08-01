"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, Loader2, ArrowLeft, ShoppingCart } from "lucide-react";
import { Button, PageHeader, Text } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { createVenta } from "@/services/apis/ventas";
import VentaBuilderSplit from "@/components/comercial/ventas/pos/VentaBuilderSplit";

export default function NuevaVentaPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [ventaData, setVentaData] = useState({
    origen: "sucursal",
    moneda_negociacion: "USD",
    cliente: null,
    deposito_sucursal: null,
  });
  const [lineas, setLineas] = useState([]);
  const [saving, setSaving] = useState(false);

  const { execute: guardarVenta } = useApi(createVenta);

  // ─── Guardar borrador ───────────────────────────────────────
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

      const result = await guardarVenta(payload);
      showToast("Venta creada como borrador", "success");
      router.push(`/ventas-crm/ventas/${result.id}`);
    } catch (err) {
      const detail = err?.data?.detail || err?.message || "Error al crear la venta.";
      showToast(detail, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Ventas", href: "/ventas-crm/ventas" },
          { label: "Nueva venta" },
        ]}
        subtitle="Mostrador · Venta directa en sucursal"
        subtitleClassName="text-emerald-600"
      >
        <div className="flex items-center gap-3">
          <Link href="/ventas-crm/ventas">
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
            {saving ? "Guardando..." : "Guardar borrador"}
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
