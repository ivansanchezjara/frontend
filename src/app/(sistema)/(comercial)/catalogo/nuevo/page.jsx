"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, FileJson, ImagePlus, Package, X } from "lucide-react";
import { useRouter } from "next/navigation";

import AttributesEditor from "@/components/comercial/catalogo/detail/AttributesEditor";
import {
  Badge,
  Button,
  FilerModal,
  LoadingScreen,
  PageHeader,
  Text,
  Field,
  Input,
  Section,
  TagsInput,
  Toggle,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  crearCategoria,
  crearProducto,
  getCategorias,
  getFullImageUrl,
} from "@/services/apis/catalogo.js";

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700 placeholder:text-slate-400";

const FORM_INICIAL = {
  nombre_general: "",
  general_code: "",
  brand: "",
  categoria_id: "",
  sub_category: "",
  professional_area: "",
  description: "",
  long_description: "",
  featured: false,
  is_published: false,
  tags: [],
  imagen_principal: null,
  atributos: {},
};

function formatApiError(err, fallback) {
  if (err && typeof err === "object" && !(err instanceof Error)) {
    return Object.entries(err)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
      .join(" · ");
  }

  return err?.message || fallback;
}

export default function NuevoProductoPage() {
  const router = useRouter();
  const { data: categoriasData, loading: loadingCategorias } = useApi(getCategorias, {
    auto: true,
    initialData: [],
  });

  const [formData, setFormData] = useState(FORM_INICIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [savingCat, setSavingCat] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [isFilerOpen, setIsFilerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isJSONModalOpen, setIsJSONModalOpen] = useState(false);
  const [jsonInput, setJsonInput] = useState("");

  useEffect(() => {
    if (!categoriasData) return;
    setCategorias(
      Array.isArray(categoriasData) ? categoriasData : categoriasData?.results || [],
    );
  }, [categoriasData]);

  const field = (key) => (value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleCrearCategoriaConfirm = async () => {
    if (!newCatName.trim()) return;

    setSavingCat(true);
    try {
      const nuevaCat = await crearCategoria(newCatName.trim());
      setCategorias((prev) => [...prev, nuevaCat]);
      field("categoria_id")(nuevaCat.id);
      setIsCreatingCat(false);
      setNewCatName("");
    } catch {
      setError("Error al crear la categoría. Probá de nuevo.");
    } finally {
      setSavingCat(false);
    }
  };

  const handleJSONImport = () => {
    try {
      const data = JSON.parse(jsonInput);
      setFormData({
        ...FORM_INICIAL,
        ...data,
        categoria_id: data.categoria_id?.toString() || "",
      });
      setIsJSONModalOpen(false);
      setJsonInput("");
      setError(null);
    } catch {
      setError("El formato JSON no es válido.");
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);

    try {
      const nuevo = await crearProducto(formData);
      router.push(`/catalogo/${nuevo.slug}`);
    } catch (err) {
      setError(formatApiError(err, "Error al crear el producto."));
      setSaving(false);
    }
  };

  const canSubmit =
    formData.nombre_general.trim() !== "" &&
    formData.general_code.trim() !== "" &&
    !saving;

  if (loadingCategorias) {
    return <LoadingScreen texto="Preparando formulario..." />;
  }

  return (
    <div className="flex h-screen flex-1 flex-col overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Catálogo", href: "/catalogo" },
          { label: "Nuevo Producto" },
        ]}
        subtitle="Podés agregar variantes después de crear el producto."
        subtitleClassName="text-emerald-600"
      >
        <div className="flex items-center gap-3">
          {error && (
            <Badge
              variant="danger"
              className="max-w-xs truncate border border-red-200"
              title={error}
            >
              {error}
            </Badge>
          )}

          <Button
            variant="secondary"
            size="sm" // <-- Usamos el tamaño estandarizado
            onClick={() => setIsJSONModalOpen(true)}
            icon={FileJson}
            className="text-blue-600" // Quitamos el text-xs de aquí
          >
            Cargar JSON
          </Button>

          <Button
            as={Link}
            href="/catalogo"
            variant="outline"
            size="sm" // <-- Usamos el tamaño estandarizado
            className="text-slate-600 hover:bg-slate-50" // Quitamos el text-xs de aquí
          >
            Cancelar
          </Button>

          <Button
            id="btn-crear-producto"
            onClick={handleSubmit}
            disabled={!canSubmit}
            size="sm" // <-- Usamos el tamaño estandarizado
            className="bg-slate-900 hover:bg-emerald-600" // Quitamos el text-xs de aquí
          >
            {saving ? "Creando..." : "Crear Producto"}
          </Button>
        </div>
      </PageHeader>

      <main className="min-w-0 flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Section title="Datos Generales">
            <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-[200px_1fr]">
              <div className="flex flex-col items-center">
                <Text
                  as="label"
                  variant="label"
                  className="mb-2 block w-full text-center text-[11px] text-slate-500 lg:text-left"
                >
                  Imagen Principal
                </Text>
                <div className="w-full max-w-[180px] lg:max-w-none">
                  {selectedImage ? (
                    <div className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <Image
                        src={getFullImageUrl(selectedImage.url)}
                        alt="Imagen principal seleccionada"
                        fill
                        unoptimized
                        className="object-contain"
                      />
                      <div className="absolute inset-x-0 bottom-0 flex justify-center bg-gradient-to-t from-slate-900/80 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => setIsFilerOpen(true)}
                          className="w-full rounded-lg bg-white/90 px-3 py-1.5 text-[10px] font-bold text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-emerald-50"
                        >
                          Cambiar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsFilerOpen(true)}
                      className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-500"
                    >
                      <ImagePlus size={32} />
                      <span className="mt-1 text-xs font-bold">Elegir</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="grid w-full grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Input
                    autoFocus
                    label="Nombre del Producto *"
                    value={formData.nombre_general}
                    onChange={(e) => field("nombre_general")(e.target.value)}
                    placeholder="Ej: Cureta Sinus"
                  />
                </div>

                <Input
                  label="Código General *"
                  helperText="Debe ser único en todo el catálogo."
                  className="font-mono uppercase"
                  value={formData.general_code}
                  onChange={(e) => field("general_code")(e.target.value.toUpperCase())}
                  placeholder="Ej: TH-CU-SIN"
                />

                <Input
                  label="Marca"
                  value={formData.brand}
                  onChange={(e) => field("brand")(e.target.value)}
                  placeholder="Ej: Thalys"
                />

                <Field label="Categoría">
                  {!isCreatingCat ? (
                    <div className="flex gap-2">
                      <select
                        className={`${inputClass} flex-1`}
                        value={formData.categoria_id}
                        onChange={(e) => field("categoria_id")(e.target.value)}
                      >
                        <option value="">Sin categoría</option>
                        {categorias.map((categoria) => (
                          <option key={categoria.id} value={categoria.id}>
                            {categoria.nombre}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        onClick={() => setIsCreatingCat(true)}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-xl font-bold text-emerald-600 hover:bg-emerald-100 shadow-none h-11"
                        title="Nueva Categoría"
                      >
                        +
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Nombre de nueva categoría..."
                        className={`${inputClass} flex-1`}
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCrearCategoriaConfirm();
                        }}
                      />
                      <Button
                        type="button"
                        disabled={savingCat}
                        onClick={handleCrearCategoriaConfirm}
                        className="rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shrink-0 h-11"
                      >
                        <Check size={16} />
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setIsCreatingCat(false);
                          setNewCatName("");
                        }}
                        variant="ghost"
                        className="rounded-xl bg-slate-100 hover:bg-slate-200 px-4 text-slate-500 border-none shrink-0 h-11"
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  )}
                </Field>

                <Input
                  label="Sub-Categoría"
                  value={formData.sub_category}
                  onChange={(e) => field("sub_category")(e.target.value)}
                  placeholder="Ej: Micro-cirugía"
                />

                <div className="md:col-span-2">
                  <Input
                    label="Área Profesional"
                    value={formData.professional_area}
                    onChange={(e) => field("professional_area")(e.target.value)}
                    placeholder="Ej: Odontología, Cirugía general..."
                  />
                </div>
              </div>
            </div>
          </Section>

          <Section title="Visibilidad y Atributos">
            <div className="p-6">
              <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-medium text-blue-700">
                El slug URL se genera automáticamente desde el nombre del
                producto.
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Toggle
                  checked={formData.featured}
                  onChange={field("featured")}
                  label="Producto Destacado"
                  description="Aparece resaltado en el catálogo."
                />
                <Toggle
                  checked={formData.is_published}
                  onChange={field("is_published")}
                  label="Publicado en Web"
                  description={
                    formData.is_published
                      ? "Visible en la tienda online."
                      : "No visible al público."
                  }
                />
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <Text
                  as="label"
                  variant="label"
                  className="mb-4 block text-slate-500"
                >
                  Especificaciones Técnicas (JSON)
                </Text>
                <AttributesEditor
                  attributes={formData.atributos}
                  onChange={field("atributos")}
                />
              </div>
            </div>
          </Section>

          <Section title="Descripción y Tags">
            <div className="space-y-5 p-6">
              <Field
                label="Descripción Corta"
                hint={`${formData.description.length}/500 caracteres`}
              >
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={3}
                  maxLength={500}
                  value={formData.description}
                  onChange={(e) => field("description")(e.target.value)}
                  placeholder="Descripción breve del producto..."
                />
              </Field>

              <Field label="Descripción Detallada">
                <textarea
                  className={`${inputClass} resize-none`}
                  rows={6}
                  value={formData.long_description}
                  onChange={(e) => field("long_description")(e.target.value)}
                  placeholder="Descripción completa, indicaciones clínicas, materiales, etc..."
                />
              </Field>

              <Field
                label="Tags"
                hint="Enter o coma para agregar. Backspace para eliminar el último."
              >
                <TagsInput tags={formData.tags} onChange={field("tags")} />
              </Field>
            </div>
          </Section>

          <aside className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-100 px-6 py-5">
            <Package className="mt-0.5 shrink-0 text-slate-400" size={24} />
            <div>
              <Text className="font-black text-slate-700">
                ¿Dónde agrego las variantes?
              </Text>
              <Text variant="bodySm" className="mt-1 text-xs">
                Las variantes se agregan después de crear el producto, desde la
                ficha individual. Al crear el producto vas a ser redirigido
                directamente ahí.
              </Text>
            </div>
          </aside>
        </div>
      </main>

      <FilerModal
        isOpen={isFilerOpen}
        onClose={() => setIsFilerOpen(false)}
        initialSearch={formData.general_code}
        onSelectImage={(img) => {
          setSelectedImage(img);
          field("imagen_principal")(img.id);
          setIsFilerOpen(false);
        }}
      />

      {isJSONModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-100 bg-slate-50 p-6">
              <Text as="h3" variant="body" className="font-black text-slate-900">
                Importar desde JSON
              </Text>
              <Text variant="bodySm" className="mt-1 text-xs">
                Pegá el objeto JSON para rellenar los campos automáticamente.
              </Text>
            </div>
            <div className="p-6">
              <textarea
                className="h-64 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder='{ "nombre_general": "Producto Ejemplo", "brand": "Marca" }'
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
              />
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsJSONModalOpen(false);
                  setJsonInput("");
                }}
              >
                Cancelar
              </Button>
              <Button className="flex-1 bg-slate-900" onClick={handleJSONImport}>
                Cargar Datos
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
