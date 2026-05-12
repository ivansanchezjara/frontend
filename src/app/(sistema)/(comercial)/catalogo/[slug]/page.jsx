// src/app/(sistema)/catalogo/[slug]/page.jsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import {
  getProducto,
  getCategorias,
  actualizarProducto,
  eliminarProducto,
  eliminarVariante,
} from "@/services/apis/catalogo.js";

import { useApi } from "@/hooks/useApi";
import { useConfirm } from "@/components/ui/ConfirmContext";
import LoadingScreen from "@/components/ui/LoadingScreen";
import FilerModal from "@/components/ui/FilerModal";
import VarianteModal from "@/components/comercial/catalogo/Modals/VarianteModal";

import ProductoHeader from "@/components/comercial/catalogo/ProductoHeader";
import DatosGeneralesSection from "@/components/comercial/catalogo/DatosGeneralesSection";
import VisibilidadSection from "@/components/comercial/catalogo/VisibilidadSection";
import DescripcionSection from "@/components/comercial/catalogo/DescripcionSection";
import VariantesSection from "@/components/comercial/catalogo/VariantesSection";
import ZonaPeligroSection from "@/components/comercial/catalogo/ZonaPeligroSection";

export default function FichaProductoPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { alert: showAlert, danger } = useConfirm();

  const [notFound, setNotFound] = useState(false);

  // Formulario
  const [formData, setFormData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Variantes
  const [varianteModal, setVarianteModal] = useState(null); // null | 'new' | {variante}
  const [deletingId, setDeletingId] = useState(null);
  const [isDeletingProd, setIsDeletingProd] = useState(false);

  // Estado para Media Manager (Filer) del Producto
  const [isFilerOpen, setIsFilerOpen] = useState(false);
  const [selectedMainImg, setSelectedMainImg] = useState(null);

  // ── Carga inicial con useApi ──
  const {
    data: productoData,
    loading,
    execute: refetchProducto,
  } = useApi(getProducto, {
    auto: false,
    initialData: null,
    args: [slug],
    onError: (err) => {
      if (err.status === 404) setNotFound(true);
    },
  });

  const { data: categoriasData } = useApi(getCategorias, {
    auto: true,
    initialData: [],
  });

  // Estado para producto y categorías (derivados de useApi)
  const [producto, setProducto] = useState(null);
  const [categorias, setCategorias] = useState([]);

  // Procesar datos y efectos
  useEffect(() => {
    if (slug) {
      setNotFound(false);
      refetchProducto();
    }
  }, [slug]);

  useEffect(() => {
    if (productoData) {
      setProducto(productoData);
      setNotFound(false);

      // Solo sobreescribimos formData si no ha sido llenado aún
      if (!formData || !formData.nombre_general) {
        setFormData({
          nombre_general: productoData.nombre_general || "",
          general_code: productoData.general_code || "",
          brand: productoData.brand || "",
          categoria_id: productoData.categoria?.id ?? "",
          sub_category: productoData.sub_category || "",
          professional_area: productoData.professional_area || "",
          description: productoData.description || "",
          long_description: productoData.long_description || "",
          featured: productoData.featured ?? false,
          is_published: productoData.is_published ?? false,
          tags: productoData.tags || [],
          imagen_principal: productoData.imagen_principal || null,
          atributos: productoData.atributos || {},
        });
      }

      if (productoData.imagen_principal_url) {
        setSelectedMainImg({ url: productoData.imagen_principal_url });
      }
    }
  }, [productoData]);

  useEffect(() => {
    if (categoriasData) {
      setCategorias(
        Array.isArray(categoriasData)
          ? categoriasData
          : categoriasData.results || [],
      );
    }
  }, [categoriasData]);

  // ── Helpers de formulario ──
  const field = (key) => (value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const refreshProducto = async () => {
    const prod = await getProducto(slug);
    setProducto(prod);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await actualizarProducto(slug, formData);
      setProducto(updated);
      setIsDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const msg =
        typeof err === "object"
          ? Object.entries(err)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
            .join(" · ")
          : "Error al guardar.";
      setSaveError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleVarianteSaved = (guardada, isNew) => {
    setProducto((prev) => ({
      ...prev,
      variants: isNew
        ? [...prev.variants, guardada]
        : prev.variants.map((v) => (v.id === guardada.id ? guardada : v)),
    }));
    setVarianteModal(null);
  };

  const handleDeleteVariante = async (id) => {
    const ok = await danger(
      "¿Desactivar esta variante? Dejará de estar visible en el catálogo e inventario.",
      "Desactivar Variante",
      { confirmText: "Desactivar" }
    );
    if (!ok) return;

    setDeletingId(id);
    try {
      await eliminarVariante(id);
      setProducto((prev) => ({
        ...prev,
        variants: prev.variants.filter((v) => v.id !== id),
      }));
    } catch (err) {
      const msg = err?.detail || "No se pudo desactivar la variante.";
      showAlert(msg, "Error", "danger");
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteProducto = async () => {
    const ok = await danger(
      `¿Estás seguro de que deseas desactivar el producto "${producto?.nombre_general}"?\n\nEsto archivará el producto y todas sus variantes.`,
      "Desactivar Producto",
      { confirmText: "Desactivar" }
    );
    if (!ok) return;

    setIsDeletingProd(true);
    try {
      await eliminarProducto(producto.id);
      router.push("/catalogo");
    } catch (err) {
      const msg = err?.detail || "No se pudo desactivar el producto.";
      showAlert(msg, "Error", "danger");
    } finally {
      setIsDeletingProd(false);
    }
  };

  // ── Estados de carga / error ──
  if (loading) return <LoadingScreen texto="Cargando ficha del producto..." />;

  if (notFound)
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-5xl mb-4">🔍</p>
          <h2 className="text-xl font-black text-slate-900">
            Producto no encontrado
          </h2>
          <p className="text-slate-400 mt-2 text-sm">
            El producto "{slug}" no existe en el catálogo.
          </p>
          <Link
            href="/catalogo"
            className="mt-6 inline-block bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-emerald-600 transition-colors"
          >
            ← Volver al Catálogo
          </Link>
        </div>
      </div>
    );

  if (!producto || !formData) return null;

  return (
    <>
      {/* Modal variante */}
      {varianteModal !== null && (
        <VarianteModal
          variante={
            varianteModal === "new"
              ? null
              : producto.variants.find((v) => v.id === varianteModal.id) ||
              varianteModal
          }
          productoId={producto.id}
          onClose={() => setVarianteModal(null)}
          onSave={handleVarianteSaved}
          onRefresh={refreshProducto}
        />
      )}

      <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
        {/* ── HEADER ── */}
        <ProductoHeader
          producto={producto}
          isDirty={isDirty}
          saving={saving}
          saveSuccess={saveSuccess}
          saveError={saveError}
          onSave={handleSave}
        />

        {/* ── CONTENIDO ── */}
        <main className="flex-1 overflow-y-auto p-8 min-w-0">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* ── Datos generales ── */}
            <DatosGeneralesSection
              formData={formData}
              producto={producto}
              categorias={categorias}
              setCategorias={setCategorias}
              onChange={field}
              selectedMainImg={selectedMainImg}
              onOpenFiler={() => setIsFilerOpen(true)}
            />

            {/* ── Visibilidad ── */}
            <VisibilidadSection formData={formData} onChange={field} />

            {/* ── Descripción ── */}
            <DescripcionSection formData={formData} onChange={field} />

            {/* ── Variantes ── */}
            <VariantesSection
              variants={producto.variants || []}
              onNew={() => setVarianteModal("new")}
              onEdit={(v) => setVarianteModal(v)}
              onDelete={handleDeleteVariante}
              deletingId={deletingId}
            />

            {/* ── Zona de Peligro ── */}
            <ZonaPeligroSection
              producto={producto}
              isDeletingProd={isDeletingProd}
              onDeleteProducto={handleDeleteProducto}
            />
          </div>
        </main>
      </div>

      <FilerModal
        isOpen={isFilerOpen}
        onClose={() => setIsFilerOpen(false)}
        initialSearch={formData.general_code}
        onSelectImage={(img) => {
          setSelectedMainImg(img);
          field("imagen_principal")(img.id);
          setIsFilerOpen(false);
        }}
      />
    </>
  );
}
