"use client";
import { useEffect } from "react";
import { Clock, Plus, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useApi } from "@/hooks/useApi";
import { getInstitucionHistorial } from "@/services/apis/ventas";

const TIPO_ICONS = {
  "+": { icon: Plus, color: "text-emerald-500", bg: "bg-emerald-50", label: "Creación" },
  "~": { icon: Pencil, color: "text-blue-500", bg: "bg-blue-50", label: "Modificación" },
  "-": { icon: Trash2, color: "text-red-500", bg: "bg-red-50", label: "Eliminación" },
};

function formatFecha(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return d.toLocaleDateString("es-PY", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CampoLabel(campo) {
  const MAP = {
    razon_social: "Nombre",
    abreviatura: "Abreviatura",
    tipo_institucion: "Tipo",
    departamento: "Departamento",
    ciudad: "Ciudad",
    direccion: "Dirección",
    telefono: "Teléfono",
    correo_electronico: "Correo",
    sitio_web: "Sitio Web",
    ruc: "RUC",
    tier_precio: "Tier de Precio",
    etapa: "Etapa",
    notas: "Notas",
    activo: "Activo",
  };
  return MAP[campo] || campo;
}

export function HistorialSection({ institucionId }) {
  const { data: historial, loading, execute: fetchHistorial } = useApi(
    () => getInstitucionHistorial(institucionId),
    { auto: false, initialData: [] }
  );

  useEffect(() => {
    if (institucionId) fetchHistorial();
  }, [institucionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = Array.isArray(historial) ? historial : [];

  if (loading) {
    return (
      <div className="text-center py-4">
        <Text variant="mutedXs">Cargando historial...</Text>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-6">
        <Clock size={32} className="text-slate-300 mx-auto mb-2" />
        <Text variant="bodySm" className="text-slate-400">
          Sin registros de historial.
        </Text>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((entry) => {
        const typeConfig = TIPO_ICONS[entry.tipo] || TIPO_ICONS["~"];
        const Icon = typeConfig.icon;

        return (
          <div
            key={entry.id}
            className="flex gap-3 items-start"
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${typeConfig.bg}`}>
              <Icon size={13} className={typeConfig.color} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Text variant="mutedXs" className="text-slate-500 font-medium">
                  {formatFecha(entry.fecha)}
                </Text>
                <Badge variant="default" className="text-[9px] py-0 px-1.5">
                  {typeConfig.label}
                </Badge>
                {entry.usuario && (
                  <Text variant="mutedXs" className="text-slate-400">
                    por {entry.usuario}
                  </Text>
                )}
              </div>
              {entry.cambios && entry.cambios.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {entry.cambios.map((cambio, i) => (
                    <div key={i} className="text-[11px] text-slate-500">
                      <span className="font-medium">{CampoLabel(cambio.campo)}</span>
                      {cambio.anterior && (
                        <span className="text-red-400 line-through ml-1.5">
                          {cambio.anterior.length > 50
                            ? cambio.anterior.slice(0, 50) + "..."
                            : cambio.anterior}
                        </span>
                      )}
                      {cambio.nuevo && (
                        <span className="text-emerald-600 ml-1.5">
                          → {cambio.nuevo.length > 50
                            ? cambio.nuevo.slice(0, 50) + "..."
                            : cambio.nuevo}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
