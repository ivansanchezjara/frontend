"use client";
import { useParams, useRouter } from "next/navigation";
import { PageHeader, LoadingScreen, Button, Text } from "@/components/ui";
import { useToast } from "@/components/ui";
import { ArrowLeft } from "lucide-react";

import CabeceraPedido from "@/components/caja/cobrar/CabeceraPedido";
import ProductosPedido from "@/components/caja/cobrar/ProductosPedido";
import FormularioPagos from "@/components/caja/cobrar/FormularioPagos";
import SelectorComprobante from "@/components/caja/cobrar/SelectorComprobante";
import FooterCobro from "@/components/caja/cobrar/FooterCobro";
import VueltoModal from "@/components/caja/cobrar/VueltoModal";
import ResultadoExitoso from "@/components/caja/cobrar/ResultadoExitoso";
import { useCobro } from "@/components/caja/cobrar/useCobro";

export default function CobrarPedidoPage() {
  const { id } = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const cobro = useCobro(id, showToast);

  // ─── Loading ─────────────────────────────────────────────────
  if (cobro.loadingPedido) {
    return (
      <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
        <PageHeader
          breadcrumbs={[
            { label: "Caja y Facturación", href: "/caja" },
            { label: "Cobros", href: "/caja/cobros" },
            { label: `Pedido #${id}` },
          ]}
        />
        <main className="flex-1 flex items-center justify-center">
          <LoadingScreen texto="Cargando pedido..." />
        </main>
      </div>
    );
  }

  // ─── Error ───────────────────────────────────────────────────
  if (cobro.errorPedido || !cobro.pedido) {
    return (
      <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
        <PageHeader
          breadcrumbs={[
            { label: "Caja y Facturación", href: "/caja" },
            { label: "Cobros", href: "/caja/cobros" },
            { label: `Pedido #${id}` },
          ]}
        />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <Text variant="bodyBold" className="!text-slate-600">
              No se pudo cargar el pedido
            </Text>
            <Text variant="bodyXs" className="!text-slate-400">
              El pedido #{id} no existe o ya fue cobrado.
            </Text>
            <Button variant="outline" icon={ArrowLeft} onClick={() => router.push("/caja/cobros")}>
              Volver a Cobros
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // ─── Resultado exitoso ───────────────────────────────────────
  if (cobro.resultado) {
    return (
      <ResultadoExitoso
        id={id}
        resultado={cobro.resultado}
        moneda={cobro.moneda}
        totalesMultimoneda={cobro.totalesMultimoneda}
        vueltosConfirmados={cobro.vueltosConfirmados}
      />
    );
  }

  // ─── Vista principal ─────────────────────────────────────────
  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Caja y Facturación", href: "/caja" },
          { label: "Cobros", href: "/caja/cobros" },
          { label: `Cobrar Pedido #${id}` },
        ]}
      />

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* COLUMNA IZQUIERDA */}
          <div className="lg:col-span-5 space-y-5">
            <CabeceraPedido pedido={cobro.pedido} />
            <ProductosPedido
              lineas={cobro.pedido.lineas}
              moneda={cobro.moneda}
              totalPedido={cobro.totalPedido}
              clienteTier={cobro.pedido.cliente_tier}
            />
          </div>

          {/* COLUMNA DERECHA */}
          <div className="lg:col-span-7 space-y-5">
            <FormularioPagos
              pagos={cobro.pagos}
              moneda={cobro.moneda}
              faltante={cobro.faltante}
              pagosDetalle={cobro.pagosDetalle}
              terminales={cobro.terminales}
              cargandoTasas={cobro.cargandoTasas}
              onAddPago={cobro.handleAddPago}
              onMetodoChange={cobro.handleMetodoChange}
              onMontoChange={cobro.handleMontoChange}
              onReferenciaChange={cobro.handleReferenciaChange}
              onFieldChange={cobro.handleFieldChange}
              onRemovePago={cobro.handleRemovePago}
              onAutoCompletar={cobro.handleAutoCompletar}
            />
            <SelectorComprobante
              emitirFactura={cobro.emitirFactura}
              onCambiar={cobro.setEmitirFactura}
              datosFactura={cobro.datosFactura}
              onDatosFacturaChange={cobro.setDatosFactura}
              clienteRuc={cobro.pedido.cliente_ruc}
              clienteNombre={cobro.pedido.cliente_nombre}
            />
          </div>
        </div>
      </main>

      <FooterCobro
        moneda={cobro.moneda}
        totalesMultimoneda={cobro.totalesMultimoneda}
        totalPagadoEnMoneda={cobro.totalPagadoEnMoneda}
        faltante={cobro.faltante}
        vuelto={cobro.vuelto}
        pagosCompletos={cobro.pagosCompletos}
        cobrando={cobro.cobrando}
        tasas={cobro.tasas}
        onCancelar={() => router.push("/caja/cobros")}
        onConfirmar={cobro.handleConfirmarCobro}
      />

      {cobro.mostrarVueltoModal && (
        <VueltoModal
          vueltoTeorico={cobro.vuelto}
          moneda={cobro.moneda}
          tasas={cobro.tasas}
          loading={cobro.cobrando}
          onConfirmar={cobro.enviarCobro}
          onClose={() => cobro.setMostrarVueltoModal(false)}
        />
      )}
    </div>
  );
}
