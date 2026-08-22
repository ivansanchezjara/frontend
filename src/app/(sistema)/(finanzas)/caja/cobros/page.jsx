"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Badge } from "@/components/ui";
import { useToast } from "@/components/ui";
import { getComprobante } from "@/services/apis/caja";
import ColaPendientes from "@/components/caja/cobros/ColaPendientes";
import HistorialCobros from "@/components/caja/cobros/HistorialCobros";
import DetalleCobro from "@/components/caja/cobrar/DetalleCobro";

export default function CobrosPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [detalleCobro, setDetalleCobro] = useState(null);

  const handleCobrar = (pedido) => router.push(`/caja/cobros/${pedido.id}`);

  const handleVerDetalle = async (comprobante) => {
    try {
      const detalle = await getComprobante(comprobante.id);
      setDetalleCobro(detalle);
    } catch {
      showToast("Error al cargar detalle del cobro", "error");
    }
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Caja y Facturación", href: "/caja" },
          { label: "Cobros" },
        ]}
        subtitle="Cobrar pedidos pendientes y consultar historial"
        subtitleClassName="text-purple-600"
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-[1400px] mx-auto space-y-10">
          <ColaPendientes onCobrar={handleCobrar} />
          <HistorialCobros onVerDetalle={handleVerDetalle} />
        </div>
      </main>

      {detalleCobro && (
        <DetalleCobro
          cobro={detalleCobro}
          onClose={() => setDetalleCobro(null)}
        />
      )}
    </div>
  );
}
