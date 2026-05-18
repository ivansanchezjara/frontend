"use client";
import { useState } from "react";
import { Button, Text, Input, Section, Field } from "@/components/ui";
import { Plus, Check, X, Image, Loader2 } from "lucide-react";
import { crearCategoria, getFullImageUrl } from "@/services/apis/catalogo.js";

const inputClass =
  "w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400";

export default function DatosGeneralesSection({
  formData,
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
          <Text variant="label" className="block mb-2 w-full lg:text-left text-center">
            Imagen Principal
          </Text>
          <div className="w-full max-w-[180px] lg:max-w-none">
            {selectedMainImg ? (
              <div className="w-full relative group rounded-2xl overflow-hidden border border-slate-200 aspect-square bg-white">
                <img
                  src={getFullImageUrl(selectedMainImg.url)}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-x-0 bottom-0 p-3 flex justify-center bg-gradient-to-t from-slate-900/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    onClick={onOpenFiler}
                    variant="secondary"
                    size="sm"
                    className="w-full shadow-sm"
                  >
                    Cambiar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenFiler}
                className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all cursor-pointer text-slate-400 hover:text-emerald-500 group"
              >
                <Image size={32} className="group-hover:scale-110 transition-transform text-slate-300 group-hover:text-emerald-500 shrink-0" />
                <Text variant="label" className="group-hover:text-emerald-500 transition-colors">
                  Elegir
                </Text>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
          <div className="md:col-span-2">
            <Input
              label="Nombre del Producto"
              value={formData.nombre_general}
              onChange={(e) => onChange("nombre_general")(e.target.value)}
              placeholder="Ej: Cureta Sinus"
            />
          </div>

          <Input
            label="Código General"
            className="font-mono uppercase"
            value={formData.general_code}
            onChange={(e) => onChange("general_code")(e.target.value)}
            placeholder="Ej: TH-CU-SIN"
          />

          <Input
            label="Marca"
            value={formData.brand}
            onChange={(e) => onChange("brand")(e.target.value)}
            placeholder="Ej: Thalys"
          />

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
                <Button
                  type="button"
                  onClick={() => setIsCreatingCat(true)}
                  variant="success"
                  size="icon"
                  icon={Plus}
                  className="h-[42px] w-[42px] shrink-0"
                  title="Nueva Categoría"
                />
              </div>
            ) : (
              <div className="flex gap-2 items-start">
                <div className="flex-1">
                  <Input
                    autoFocus
                    placeholder="Nombre de categoría..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleCrearCategoriaConfirm()
                    }
                  />
                </div>
                <Button
                  type="button"
                  disabled={savingCat}
                  onClick={handleCrearCategoriaConfirm}
                  variant="success"
                  size="icon"
                  icon={savingCat ? Loader2 : Check}
                  className={`h-[42px] w-[42px] shrink-0 ${savingCat ? "animate-spin" : ""}`}
                />
                <Button
                  type="button"
                  onClick={() => {
                    setIsCreatingCat(false);
                    setNewCatName("");
                  }}
                  variant="secondary"
                  size="icon"
                  icon={X}
                  className="h-[42px] w-[42px] shrink-0"
                />
              </div>
            )}
          </Field>

          <Input
            label="Sub-Categoría"
            value={formData.sub_category}
            onChange={(e) => onChange("sub_category")(e.target.value)}
            placeholder="Ej: Micro-cirugía"
          />

          <div className="md:col-span-2">
            <Input
              label="Área Profesional"
              value={formData.professional_area}
              onChange={(e) =>
                onChange("professional_area")(e.target.value)
              }
              placeholder="Ej: Odontología, Cirugía general..."
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
