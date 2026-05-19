"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

import VarianteModal from "@/components/comercial/catalogo/modals/VarianteModal";
import DatosGeneralesSection from "@/components/comercial/catalogo/detail/DatosGeneralesSection";
import DescripcionSection from "@/components/comercial/catalogo/detail/DescripcionSection";
import ProductoHeader from "@/components/comercial/catalogo/list/ProductoHeader";
import VariantesSection from "@/components/comercial/catalogo/detail/VariantesSection";
import VisibilidadSection from "@/components/comercial/catalogo/detail/VisibilidadSection";
import ZonaPeligroSection from "@/components/comercial/catalogo/detail/ZonaPeligroSection";
import { Button, FilerModal, Heading, LoadingScreen, Text, useConfirm } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import {
  actualizarProducto,
  eliminarProducto,
  eliminarVariante,
  getCategorias,
  getProducto,
} from "@/services/apis/catalogo.js";

function getInitialFormData(producto) {
  return {
    nombre_general: producto.nombre_general || "",
    general_code: producto.general_code || "",
    brand: producto.brand || "",
    categoria_id: producto.categoria?.id ?? "",
    sub_category: producto.sub_category || "",
    professional_area: producto.professional_area || "",
    description: producto.description || "",
    long_description: producto.long_description || "",
    featured: producto.featured ?? false,
    is_published: producto.is_published ?? false,
    tags: producto.tags || [],
    imagen_principal: producto.imagen_principal || null,
    atributos: producto.atributos || {},
  };
}

function formatSaveError(err) {
  if (err && typeof err === "object" && !(err instanceof Error)) {
    return Object.entries(err)
      .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
      .join(" · ");
  }

  return err?.message || "Error al guardar.";
}

export default function FichaProductoPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { alert: showAlert, danger } = useConfirm();

  const [notFound, setNotFound] = useState(false);
  const [formData, setFormData] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [varianteModal, setVarianteModal] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeletingProd, setIsDeletingProd] = useState(false);
  const [isFilerOpen, setIsFilerOpen] = useState(false);
  const [selectedMainImg, setSelectedMainImg] = useState(null);
  const [producto, setProducto] = useState(null);
  const [categorias, setCategorias] = useState([]);

  const handleProductoError = useCallback((err) => {
    if (err.status === 404) setNotFound(true);
  }, []);

  const {
    data: productoData,
    loading,
    execute: refetchProducto,
  } = useApi(getProducto, {
    auto: false,
    initialData: null,
    args: [slug],
    onError: handleProductoError,
  });

  const { data: categoriasData } = useApi(getCategorias, {
    auto: true,
    initialData: [],
  });

  useEffect(() => {
    if (slug) {
      setNotFound(false);
      refetchProducto();
    }
  }, [slug, refetchProducto]);

  useEffect(() => {
    if (!productoData) return;

    setProducto(productoData);
    setNotFound(false);

    setFormData((current) => {
      if (current?.nombre_general) return current;
      return getInitialFormData(productoData);
    });

    if (productoData.imagen_principal_url) {
      setSelectedMainImg({ url: productoData.imagen_principal_url });
    }
  }, [productoData]);

  useEffect(() => {
    if (!categoriasData) return;
    setCategorias(
      Array.isArray(categoriasData) ? categoriasData : categoriasData.results || [],
    );
  }, [categoriasData]);

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
      setSaveError(formatSaveError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleVarianteSaved = (guardada, isNew) => {
    setProducto((prev) => ({
      ...prev,
      variants: isNew
        ? [...prev.variants, guardada]
        : prev.variants.map((variant) =>
          variant.id === guardada.id ? guardada : variant,
        ),
    }));
    setVarianteModal(null);
  };

  const handleDeleteVariante = async (id) => {
    const ok = await danger(
      "¿Desactivar esta variante? Dejará de estar visible en el catálogo e inventario.",
      "Desactivar Variante",
      { confirmText: "Desactivar" },
    );

    if (!ok) return;

    setDeletingId(id);
    try {
      await eliminarVariante(id);
      setProducto((prev) => ({
        ...prev,
        variants: prev.variants.filter((variant) => variant.id !== id),
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
      { confirmText: "Desactivar" },
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

  if (loading) return <LoadingScreen texto="Cargando ficha del producto..." />;

  if (notFound) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-6 inline-flex rounded-3xl bg-slate-900 p-4 text-white shadow-2xl shadow-emerald-500/20">
            <SearchX size={44} strokeWidth={2.5} />
          </div>
          <Heading level={3}>Producto no encontrado</Heading>
          <Text className="mt-2">
            El producto &quot;{slug}&quot; no existe en el catálogo.
          </Text>
          <Button
            as={Link}
            href="/catalogo"
            className="mt-6 bg-slate-900 text-white font-black hover:bg-slate-800 shadow-lg active:scale-[0.98]"
          >
            Volver al Catálogo
          </Button>
        </div>
      </main>
    );
  }

  if (!producto || !formData) return null;

  return (
    <>
      {varianteModal !== null && (
        <VarianteModal
          variante={
            varianteModal === "new"
              ? null
              : producto.variants.find((variant) => variant.id === varianteModal.id) ||
              varianteModal
          }
          productoId={producto.id}
          onClose={() => setVarianteModal(null)}
          onSave={handleVarianteSaved}
          onRefresh={refreshProducto}
        />
      )}

      <div className="flex h-screen flex-1 flex-col overflow-hidden bg-slate-50/50">
        <ProductoHeader
          producto={producto}
          isDirty={isDirty}
          saving={saving}
          saveSuccess={saveSuccess}
          saveError={saveError}
          onSave={handleSave}
        />

        <main className="min-w-0 flex-1 overflow-y-auto p-8">
          <div className="mx-auto max-w-4xl space-y-6">
            <DatosGeneralesSection
              formData={formData}
              producto={producto}
              categorias={categorias}
              setCategorias={setCategorias}
              onChange={field}
              selectedMainImg={selectedMainImg}
              onOpenFiler={() => setIsFilerOpen(true)}
            />

            <VisibilidadSection formData={formData} onChange={field} />
            <DescripcionSection formData={formData} onChange={field} />
            <VariantesSection
              variants={producto.variants || []}
              onNew={() => setVarianteModal("new")}
              onEdit={(variant) => setVarianteModal(variant)}
              onDelete={handleDeleteVariante}
              deletingId={deletingId}
            />
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
