"use client";
import { useState } from "react";
import { crearCategoria } from "@/services/apis/catalogo.js";
import { getFullImageUrl } from "@/services/apis/catalogo.js";
import Section from "./Section";
import Field from "./Field";

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400";

export default function DatosGeneralesSection({
  formData,
  producto,
  categorias,
  setCategorias,
  onChange,
  selectedMainImg,
  onOpenFiler,
}) {
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);

  const handleCrearCategoriaConfirm = async () => {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      const nuevaCat = await crearCategoria(newCatName.trim());
      setCategorias([...categorias, nuevaCat]);
      onChange("categoria_id")(nuevaCat.id);
      setIsCreatingCat(false);
      setNewCatName("");
    } catch (err) {
      alert("Error al crear la categoría.");
    } finally {
      setSavingCat(false);
    }
  };

  return (
    <Section title="Datos Generales">
      <div className="p-6 grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8">
        {/* CAJA LATERAL DE IMAGEN PRINCIPAL */}
        <div className="flex flex-col items-center">
          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block mb-2 w-full lg:text-left text-center">
            Imagen Principal
          </label>
          <div className="w-full max-w-[180px] lg:max-w-none">
            {selectedMainImg ? (
              <div className="w-full relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square bg-white">
                <img
                  src={getFullImageUrl(selectedMainImg.url)}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 flex justify-center bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={onOpenFiler}
                    className="bg-white/90 backdrop-blur-sm text-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-sm w-full hover:bg-emerald-50 transition-colors"
                  >
                    Cambiar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenFiler}
                className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-slate-400 hover:text-emerald-500"
              >
                <span className="text-3xl">🏜️</span>
                <span className="text-xs font-bold mt-1">Elegir</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          <div className="md:col-span-2">
            <Field label="Nombre del Producto">
              <input
                className={inputClass}
                value={formData.nombre_general}
                onChange={(e) => onChange("nombre_general")(e.target.value)}
                placeholder="Ej: Cureta Sinus"
              />
            </Field>
          </div>

          <Field label="Código General">
            <input
              className={`${inputClass} font-mono uppercase`}
              value={formData.general_code}
              onChange={(e) => onChange("general_code")(e.target.value)}
              placeholder="Ej: TH-CU-SIN"
            />
          </Field>

          <Field label="Marca">
            <input
              className={inputClass}
              value={formData.brand}
              onChange={(e) => onChange("brand")(e.target.value)}
              placeholder="Ej: Thalys"
            />
          </Field>

          <Field label="Categoría">
            {!isCreatingCat ? (
              <div className="flex gap-2">
                <select
                  className={`${inputClass} flex-1`}
                  value={formData.categoria_id}
                  onChange={(e) => onChange("categoria_id")(e.target.value)}
                >
                  <option value="">Sin categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setIsCreatingCat(true)}
                  className="px-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xl rounded-xl border border-emerald-200"
                  title="Nueva Categoría"
                >
                  +
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  autoFocus
                  placeholder="Nombre de categoría..."
                  className={`${inputClass} flex-1`}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleCrearCategoriaConfirm()
                  }
                />
                <button
                  type="button"
                  disabled={savingCat}
                  onClick={handleCrearCategoriaConfirm}
                  className="px-3 bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-sm rounded-xl"
                >
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCat(false);
                    setNewCatName("");
                  }}
                  className="px-3 bg-slate-100 text-slate-500 hover:bg-slate-200 font-bold text-sm rounded-xl"
                >
                  ✕
                </button>
              </div>
            )}
          </Field>

          <Field label="Sub-Categoría">
            <input
              className={inputClass}
              value={formData.sub_category}
              onChange={(e) => onChange("sub_category")(e.target.value)}
              placeholder="Ej: Micro-cirugía"
            />
          </Field>

          <div className="md:col-span-2">
            <Field label="Área Profesional">
              <input
                className={inputClass}
                value={formData.professional_area}
                onChange={(e) =>
                  onChange("professional_area")(e.target.value)
                }
                placeholder="Ej: Odontología, Cirugía general..."
              />
            </Field>
          </div>
        </div>
      </div>
    </Section>
  );
}
