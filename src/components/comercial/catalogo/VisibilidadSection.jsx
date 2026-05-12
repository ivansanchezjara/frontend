"use client";
import Section from "./Section";
import Toggle from "./Toggle";
import AttributesEditor from "./AttributesEditor";

export default function VisibilidadSection({ formData, onChange }) {
  return (
    <Section title="Visibilidad y Atributos">
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 border border-slate-100">
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            Slug:
          </span>
          <code className="text-xs font-mono font-bold text-blue-600">
            {formData.slug}
          </code>
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
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-4 italic">
            ⚙️ Especificaciones Técnicas (JSON)
          </label>
          <AttributesEditor
            attributes={formData.atributos}
            onChange={onChange("atributos")}
          />
        </div>
      </div>
    </Section>
  );
}
