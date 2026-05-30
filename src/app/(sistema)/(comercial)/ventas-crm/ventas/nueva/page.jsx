"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import { Button, PageHeader } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/components/ui";
import { createVenta } from "@/services/apis/ventas";
import VentaBuilder from "@/components/ventas/VentaBuilder";
import Link from "next/link";

export default function NuevaVentaPage() {
  const router = useRouter();
  const { addToast } = useToast();

  // ─── Estado de la venta ─────────────────────────────────────
  const [ventaData, setVentaData] = useState({
    origen: "sucursal",
    moneda_negociacion: "USD",
    cliente: null,
  });

  const [lineas, setLineas] = useState([]);
  const [saving, setSaving] = useState(false);

  const { execute: guardarVenta } = useApi(createVenta);

  // ─── Guardar borrador ───────────────────────────────────────
  const handleGuardar = async () => {
    // Validaciones básicas
    if (lineas.length === 0) {
      addToast({
        type: "error",
        message: "Agregá al menos un producto a la venta.",
      });
      return;
    }

    if (lineas.length > 100) {
      addToast({
        type: "error",
        message: "La venta no puede tener más de 100 líneas.",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        origen: ventaData.origen,
        moneda_negociacion: ventaData.moneda_negociacion,
        cliente: ventaData.cliente?.id || null,
        lineas: lineas.map((l) => ({
          variante: l.variante_id,
          cantidad: l.cantidad,
        })),
      };

      const result = await guardarVenta(payload);
      addToast({
        type: "success",
        message: "Venta creada como borrador exitosamente.",
      });
      router.push(`/ventas-crm/ventas/${result.id}`);
    } catch (err) {
      const detail = err?.data?.detail || err?.message || "Error al crear la venta.";
      addToast({ type: "error", message: detail });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      {/* HEADER */}
      <PageHeader
        title="Nueva Venta"
        subtitle="Comercial · Crear borrador de venta"
        subtitleClassName="text-emerald-600"
      >
        <div className="flex items-center gap-3">
          <Link href="/ventas-crm/ventas">
            <Button
              variant="secondary"
              size="md"
              icon={ArrowLeft}
              className="rounded-xl font-bold text-xs cursor-pointer"
            >
              VOLVER
            </Button>
          </Link>
          <Button
            variant="success"
            size="md"
            icon={saving ? Loader2 : Save}
            className={`rounded-xl font-bold text-xs shadow-lg shadow-emerald-100 cursor-pointer ${saving ? "[&_svg]:animate-spin" : ""}`}
            onClick={handleGuardar}
            disabled={saving || lineas.length === 0}
          >
            {saving ? "GUARDANDO..." : "GUARDAR BORRADOR"}
          </Button>
        </div>
      </PageHeader>

      {/* CONTENIDO */}
      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-5xl mx-auto">
          <VentaBuilder
            ventaData={ventaData}
            onVentaChange={setVentaData}
            lineas={lineas}
            onLineasChange={setLineas}
          />
        </div>
      </main>
    </div>
  );
}
