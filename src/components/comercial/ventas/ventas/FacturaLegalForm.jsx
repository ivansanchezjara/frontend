"use client";
import { Input, Field, Section, Toggle } from "@/components/ui";
import { FileText } from "lucide-react";

const MONEDA_FACTURACION_OPTIONS = [
  { value: "USD", label: "USD - Dólar" },
  { value: "PYG", label: "PYG - Guaraní" },
];

const selectClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700";

export default function FacturaLegalForm({
  requiereFactura = true,
  onToggle,
  facturaData = {},
  onFacturaChange,
}) {
  const handleFieldChange = (field) => (value) => {
    onFacturaChange?.({ ...facturaData, [field]: value });
  };

  const camposCompletos =
    requiereFactura &&
    facturaData.ruc_destinatario?.trim() &&
    facturaData.nombre_comercial?.trim() &&
    facturaData.moneda_facturacion;

  return (
    <Section title="Factura Legal">
      <div className="p-6 space-y-5">
        <Toggle
          checked={requiereFactura}
          onChange={(val) => onToggle?.(val)}
          label="Emitir factura legal"
          description="Se generará una factura fiscal para esta venta"
        />

        {requiereFactura && (
          <div className="space-y-5 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="RUC Destinatario *"
                value={facturaData.ruc_destinatario || ""}
                onChange={(e) => handleFieldChange("ruc_destinatario")(e.target.value)}
                placeholder="Ej: 80012345-6"
                maxLength={20}
              />

              <Field label="Moneda de Facturación *">
                <select
                  className={selectClass}
                  value={facturaData.moneda_facturacion || "PYG"}
                  onChange={(e) => handleFieldChange("moneda_facturacion")(e.target.value)}
                >
                  {MONEDA_FACTURACION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="md:col-span-2">
                <Input
                  label="Nombre Comercial *"
                  value={facturaData.nombre_comercial || ""}
                  onChange={(e) => handleFieldChange("nombre_comercial")(e.target.value)}
                  placeholder="Razón social o nombre comercial del destinatario"
                  maxLength={200}
                />
              </div>
            </div>

            {!camposCompletos && (
              <p className="text-xs text-amber-600 flex items-center gap-1.5">
                <FileText size={14} />
                Complete todos los campos para emitir la factura legal.
              </p>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}
