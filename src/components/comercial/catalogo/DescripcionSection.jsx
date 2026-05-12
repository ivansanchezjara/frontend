"use client";
import Section from "./Section";
import Field from "./Field";
import TagsInput from "./TagsInput";

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400";

export default function DescripcionSection({ formData, onChange }) {
  return (
    <Section title="Descripción y Tags">
      <div className="p-6 space-y-5">
        <Field
          label="Descripción Corta"
          hint={`${formData.description?.length || 0}/500 caracteres`}
        >
          <textarea
            className={`${inputClass} resize-none`}
            rows={3}
            maxLength={500}
            value={formData.description}
            onChange={(e) => onChange("description")(e.target.value)}
            placeholder="Descripción breve del producto..."
          />
        </Field>

        <Field label="Descripción Detallada">
          <textarea
            className={`${inputClass} resize-none`}
            rows={6}
            value={formData.long_description}
            onChange={(e) => onChange("long_description")(e.target.value)}
            placeholder="Descripción completa, indicaciones clínicas, materiales, etc..."
          />
        </Field>

        <Field
          label="Tags"
          hint="Enter o coma para agregar. Backspace para eliminar el último."
        >
          <TagsInput tags={formData.tags} onChange={onChange("tags")} />
        </Field>
      </div>
    </Section>
  );
}
