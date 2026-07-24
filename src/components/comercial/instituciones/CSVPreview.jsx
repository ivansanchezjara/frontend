"use client";
import { GraduationCap, Trash2, X, Upload } from "lucide-react";

import { PageHeader, Button, Badge } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { cn } from "@/lib/utils";

export function CSVPreview({ preview, uploading, onRemoveItem, onConfirm, onCancel }) {
  const conErrores = preview.filter((r) => r._errores?.length > 0);

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Instituciones", href: "/ventas-crm/instituciones" },
          { label: "Resumen de Carga" },
        ]}
        subtitle={`${preview.length} instituciones para importar`}
        subtitleClassName="text-emerald-600"
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={uploading ? undefined : Upload}
            onClick={onConfirm}
            disabled={uploading || conErrores.length > 0}
          >
            {uploading ? "Subiendo..." : `Confirmar (${preview.length})`}
          </Button>
        </div>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-3xl mx-auto space-y-3">
          {conErrores.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <X size={16} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <Text variant="bodySmBold" className="text-red-700">
                  {conErrores.length} con errores
                </Text>
                <Text variant="mutedXs" className="text-red-600 mt-0.5">
                  Eliminá las filas con error o corregí el CSV.
                </Text>
              </div>
            </div>
          )}

          {preview.map((inst, idx) => {
            const tieneError = inst._errores?.length > 0;
            return (
              <div
                key={idx}
                className={cn(
                  "bg-white border rounded-xl p-4 flex items-start gap-3",
                  tieneError
                    ? "border-red-300 bg-red-50/30"
                    : "border-slate-200"
                )}
              >
                <div
                  className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                    tieneError ? "bg-red-100" : "bg-indigo-50"
                  )}
                >
                  <GraduationCap
                    size={18}
                    className={tieneError ? "text-red-500" : "text-indigo-500"}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Text variant="bodySmBold" className="truncate">
                      {inst.nombre}
                    </Text>
                    {inst.abreviatura && (
                      <Badge variant="default">{inst.abreviatura}</Badge>
                    )}
                    {inst.ciudad && (
                      <Badge variant="default" className="text-slate-500">
                        {inst.ciudad}
                      </Badge>
                    )}
                    {inst.oferta_academica?.length > 0 && (
                      <Badge
                        variant="default"
                        className="text-emerald-600 bg-emerald-50"
                      >
                        {inst.oferta_academica.length} carreras
                      </Badge>
                    )}
                  </div>
                  {tieneError &&
                    inst._errores.map((err, i) => (
                      <Text
                        key={i}
                        variant="mutedXs"
                        className="text-red-600 mt-0.5"
                      >
                        ⚠ {err}
                      </Text>
                    ))}
                </div>
                <button
                  onClick={() => onRemoveItem(idx)}
                  aria-label={`Eliminar ${inst.nombre}`}
                  className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
