"use client";

import { Badge, Button, PageHeader } from "@/components/ui";

export default function ProductoHeader({
  producto,
  isDirty,
  saving,
  saveSuccess,
  saveError,
  onSave,
}) {
  return (
    <PageHeader
      breadcrumbs={[
        { label: "Catálogo", href: "/catalogo" },
        { label: producto.nombre_general },
      ]}
      subtitle={producto.slug}
      subtitleClassName="font-mono text-emerald-600"
    >
      <div className="flex items-center gap-3">
        {saveSuccess && (
          <Badge variant="success" className="border border-emerald-200">
            Cambios guardados
          </Badge>
        )}
        {saveError && (
          <Badge
            variant="danger"
            className="max-w-xs truncate border border-red-200"
            title={saveError}
          >
            {saveError}
          </Badge>
        )}
        <Button
          id="btn-guardar-producto"
          onClick={onSave}
          disabled={!isDirty || saving}
          className="bg-slate-900 text-xs hover:bg-emerald-600"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>
    </PageHeader>
  );
}
