"use client";
import { useState } from "react";
import { Text, Input, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Receipt, FileText, Search } from "lucide-react";
import { consultarRuc } from "@/services/apis/finanzas";

export default function SelectorComprobante({
  emitirFactura,
  onCambiar,
  datosFactura,
  onDatosFacturaChange,
  clienteRuc,
  clienteNombre,
}) {
  const [consultandoRuc, setConsultandoRuc] = useState(false);

  // Prellenar con datos del cliente al activar factura
  const handleSeleccionarFactura = () => {
    onCambiar(true);
    // Si el cliente ya tiene RUC, prellenar
    if (clienteRuc && !datosFactura.ruc) {
      onDatosFacturaChange({
        ...datosFactura,
        ruc: clienteRuc,
        razon_social: clienteNombre || "",
      });
    }
  };

  const handleBuscarRuc = async () => {
    const ruc = (datosFactura.ruc || "").trim();
    if (ruc.length < 3) return;
    setConsultandoRuc(true);
    try {
      const data = await consultarRuc(ruc);
      if (data?.razon_social) {
        onDatosFacturaChange({ ...datosFactura, razon_social: data.razon_social });
      }
    } catch { /* no es crítico */ }
    finally { setConsultandoRuc(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
      <Text variant="label" className="!text-sm !text-slate-700">
        Documento a emitir
      </Text>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onCambiar(false)}
          className={cn(
            "p-4 rounded-xl border-2 text-left transition-all",
            !emitirFactura ? "border-purple-400 bg-purple-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Receipt size={16} className={!emitirFactura ? "text-purple-600" : "text-slate-400"} />
            <Text variant="bodySmBold" as="span" className={!emitirFactura ? "!text-purple-700" : "!text-slate-600"}>
              Solo Comprobante
            </Text>
          </div>
          <Text variant="mutedXs" className="!text-[11px]">
            Comprobante interno sin validez fiscal
          </Text>
        </button>
        <button
          type="button"
          onClick={handleSeleccionarFactura}
          className={cn(
            "p-4 rounded-xl border-2 text-left transition-all",
            emitirFactura ? "border-purple-400 bg-purple-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className={emitirFactura ? "text-purple-600" : "text-slate-400"} />
            <Text variant="bodySmBold" as="span" className={emitirFactura ? "!text-purple-700" : "!text-slate-600"}>
              Comprobante + Factura
            </Text>
          </div>
          <Text variant="mutedXs" className="!text-[11px]">
            Emite factura legal con timbrado de la SET
          </Text>
        </button>
      </div>

      {/* Datos de factura — se expande al elegir factura */}
      {emitirFactura && (
        <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3 mt-2">
          <Text variant="label" className="!text-[10px] !text-purple-600">
            Datos del destinatario de factura
          </Text>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* RUC */}
            <div>
              <Text variant="mutedXs" as="label" className="block mb-1 !text-[10px] !text-slate-500">
                RUC *
              </Text>
              <div className="flex gap-1.5">
                <Input
                  value={datosFactura.ruc || ""}
                  onChange={(e) => onDatosFacturaChange({ ...datosFactura, ruc: e.target.value })}
                  onBlur={handleBuscarRuc}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleBuscarRuc(); } }}
                  placeholder="80012345-6"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={handleBuscarRuc}
                  disabled={consultandoRuc || (datosFactura.ruc || "").trim().length < 3}
                  icon={Search}
                >
                  {consultandoRuc ? "..." : "Buscar"}
                </Button>
              </div>
            </div>

            {/* Razón Social */}
            <div>
              <Text variant="mutedXs" as="label" className="block mb-1 !text-[10px] !text-slate-500">
                Razón Social *
              </Text>
              <Input
                value={datosFactura.razon_social || ""}
                onChange={(e) => onDatosFacturaChange({ ...datosFactura, razon_social: e.target.value })}
                placeholder="Nombre o razón social"
                disabled={consultandoRuc}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
