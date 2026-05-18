"use client";
import { Text, Section, Toggle } from "@/components/ui";
import { Settings } from "lucide-react";
import AttributesEditor from "./AttributesEditor";

export default function VisibilidadSection({ formData, onChange }) {
  return (
    <Section title="Visibilidad y Atributos">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
          <Text variant="label" className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Slug:
          </Text>
          <Text variant="mono" className="text-xs font-mono font-bold text-blue-600" as="code">
            {formData.slug}
          </Text>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Toggle
            checked={formData.featured}
            onChange={onChange("featured")}
            label="Producto Destacado"
            description="Aparece resaltado en el catálogo."
          />
          <Toggle
            checked={formData.is_published}
            onChange={onChange("is_published")}
            label="Publicado en Web"
            description={
              formData.is_published
                ? "Visible en la tienda online."
                : "No visible al público."
            }
          />
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100">
          <Text variant="label" className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-4 italic flex items-center gap-1.5" as="label">
            <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Especificaciones Técnicas (JSON)
          </Text>
          <AttributesEditor
            attributes={formData.atributos}
            onChange={onChange("atributos")}
          />
        </div>
      </div>
    </Section>
  );
}
