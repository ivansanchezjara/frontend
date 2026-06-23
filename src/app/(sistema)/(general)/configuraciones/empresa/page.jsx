"use client";

import { useState } from "react";
import {
  Building2,
  Check,
  AlertCircle,
  Globe,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  FileText,
  Image as ImageIcon,
  DollarSign,
  Trash2,
} from "lucide-react";

import {
  Badge,
  Button,
  FilerModal,
  Heading,
  Input,
  LoadingScreen,
  PageHeader,
  Text,
  Field,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getEmpresa, updateEmpresa } from "@/services/apis/empresa.js";
import { getFullImageUrl } from "@/services/apis/catalogo.js";

const MONEDA_OPTIONS = [
  { value: "PYG", label: "Guaraní (PYG)" },
  { value: "USD", label: "Dólar (USD)" },
  { value: "BRL", label: "Real (BRL)" },
];

export default function EmpresaPage() {
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState(null);
  const [isFilerOpen, setIsFilerOpen] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState(null);

  const { loading } = useApi(getEmpresa, {
    auto: true,
    initialData: null,
    onSuccess: (data) => setForm(data),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const payload = {
        nombre: form.nombre,
        nombre_fantasia: form.nombre_fantasia,
        ruc: form.ruc,
        direccion: form.direccion,
        ciudad: form.ciudad,
        telefono: form.telefono,
        email: form.email,
        sitio_web: form.sitio_web,
        whatsapp: form.whatsapp,
        instagram: form.instagram,
        facebook: form.facebook,
        slogan: form.slogan,
        moneda_display: form.moneda_display,
      };

      // Incluir logo solo si se cambió
      if (selectedLogo !== null) {
        payload.logo = selectedLogo?.id || null;
      }

      const updated = await updateEmpresa(payload);
      setForm(updated);
      setSelectedLogo(null);
      setSuccessMsg("Configuración guardada correctamente.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch {
      setErrorMsg("Error al guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen message="Cargando configuración..." />;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Configuraciones", href: "/configuraciones" },
          { label: "Mi Empresa" },
        ]}
        subtitle="Datos fiscales, contacto y preferencias"
      />
    <main className="flex-1 overflow-y-auto">
    <div className="mx-auto max-w-4xl space-y-8 p-4 md:p-10">
      <header className="space-y-2">
        <Heading level={1}>Configuración de Empresa</Heading>
        <Text>Datos fiscales, contacto y preferencias de tu empresa. Esta información se usa en facturas, reportes y el branding del sistema.</Text>
      </header>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {/* Sidebar preview */}
        <aside className="space-y-6 md:col-span-1">
          <section className="flex flex-col items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            {/* Logo con selector */}
            <button
              type="button"
              onClick={() => setIsFilerOpen(true)}
              className="group relative mb-4 flex h-28 w-28 items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-blue-400 hover:bg-blue-50 cursor-pointer"
              title="Cambiar logo"
            >
              {(selectedLogo || form?.logo_url) ? (
                <img
                  src={selectedLogo ? getFullImageUrl(selectedLogo.url) : form.logo_url}
                  alt="Logo"
                  className="h-full w-full rounded-2xl object-contain p-2"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400 group-hover:text-blue-500">
                  <ImageIcon size={28} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Elegir logo</span>
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] font-black text-white uppercase tracking-wide">Cambiar</span>
              </div>
            </button>

            {/* Quitar logo */}
            {(selectedLogo || form?.logo_url) && (
              <button
                type="button"
                onClick={() => {
                  setSelectedLogo({ id: null, url: null });
                  setForm((prev) => ({ ...prev, logo: null, logo_url: null }));
                }}
                className="mb-3 flex items-center gap-1 text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={12} />
                Quitar logo
              </button>
            )}
            <Heading level={3} className="leading-tight">
              {form?.nombre || "Mi Empresa"}
            </Heading>
            {form?.nombre_fantasia && (
              <Text variant="caption" className="mt-1 text-slate-400">
                {form.nombre_fantasia}
              </Text>
            )}
            {form?.slogan && (
              <Text variant="bodySm" className="mt-3 italic text-slate-500">
                &ldquo;{form.slogan}&rdquo;
              </Text>
            )}

            <div className="mt-6 w-full space-y-3 border-t border-slate-100 pt-6 text-left">
              {form?.ruc && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <FileText size={14} className="text-slate-400" />
                  <span>RUC: {form.ruc}</span>
                </div>
              )}
              {form?.ciudad && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={14} className="text-slate-400" />
                  <span>{form.ciudad}</span>
                </div>
              )}
              {form?.telefono && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  <span>{form.telefono}</span>
                </div>
              )}
              {form?.email && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={14} className="text-slate-400" />
                  <span>{form.email}</span>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                <DollarSign size={16} className="text-purple-600" />
              </div>
              <Text variant="label">Moneda de Visualización</Text>
            </div>
            <Badge variant="info" className="px-3 py-1.5">
              {MONEDA_OPTIONS.find((m) => m.value === form?.moneda_display)?.label || "PYG"}
            </Badge>
            <Text variant="bodySm" className="mt-2 text-slate-400">
              Los importes se almacenan en USD y se muestran en esta moneda.
            </Text>
          </section>
        </aside>

        {/* Formulario principal */}
        <section className="md:col-span-2">
          <form
            onSubmit={handleSave}
            className="space-y-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-10"
          >
            {/* Datos Fiscales */}
            <div className="space-y-1">
              <Text variant="label" className="text-slate-900">
                Datos Fiscales
              </Text>
              <div className="h-px bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="Razón Social"
                type="text"
                name="nombre"
                value={form?.nombre || ""}
                onChange={handleChange}
                icon={Building2}
                placeholder="Nombre legal..."
                required
              />
              <Input
                label="Nombre Comercial"
                type="text"
                name="nombre_fantasia"
                value={form?.nombre_fantasia || ""}
                onChange={handleChange}
                icon={Building2}
                placeholder="Marca / fantasía..."
              />
              <Input
                label="RUC"
                type="text"
                name="ruc"
                value={form?.ruc || ""}
                onChange={handleChange}
                icon={FileText}
                placeholder="80012345-6"
              />
              <Input
                label="Ciudad"
                type="text"
                name="ciudad"
                value={form?.ciudad || ""}
                onChange={handleChange}
                icon={MapPin}
                placeholder="Asunción..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Dirección Fiscal
              </label>
              <textarea
                name="direccion"
                value={form?.direccion || ""}
                onChange={handleChange}
                rows={2}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Dirección completa..."
              />
            </div>

            {/* Contacto */}
            <div className="space-y-1 pt-4">
              <Text variant="label" className="text-slate-900">
                Contacto
              </Text>
              <div className="h-px bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="Teléfono"
                type="text"
                name="telefono"
                value={form?.telefono || ""}
                onChange={handleChange}
                icon={Phone}
                placeholder="+595 21 ..."
              />
              <Input
                label="Email Corporativo"
                type="email"
                name="email"
                value={form?.email || ""}
                onChange={handleChange}
                icon={Mail}
                placeholder="info@empresa.com"
              />
              <Input
                label="WhatsApp"
                type="text"
                name="whatsapp"
                value={form?.whatsapp || ""}
                onChange={handleChange}
                icon={Phone}
                placeholder="+595 981 123 456"
              />
              <Input
                label="Sitio Web"
                type="url"
                name="sitio_web"
                value={form?.sitio_web || ""}
                onChange={handleChange}
                icon={Globe}
                placeholder="https://..."
              />
            </div>

            {/* Redes Sociales */}
            <div className="space-y-1 pt-4">
              <Text variant="label" className="text-slate-900">
                Redes Sociales
              </Text>
              <div className="h-px bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="Instagram"
                type="text"
                name="instagram"
                value={form?.instagram || ""}
                onChange={handleChange}
                icon={Globe}
                placeholder="mi_empresa"
              />
              <Input
                label="Facebook"
                type="url"
                name="facebook"
                value={form?.facebook || ""}
                onChange={handleChange}
                icon={Globe}
                placeholder="https://facebook.com/..."
              />
            </div>

            {/* Branding & Preferencias */}
            <div className="space-y-1 pt-4">
              <Text variant="label" className="text-slate-900">
                Branding y Preferencias
              </Text>
              <div className="h-px bg-slate-100" />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input
                label="Slogan"
                type="text"
                name="slogan"
                value={form?.slogan || ""}
                onChange={handleChange}
                icon={FileText}
                placeholder="Tu slogan..."
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Moneda de Visualización
                </label>
                <select
                  name="moneda_display"
                  value={form?.moneda_display || "PYG"}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm transition-colors focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {MONEDA_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Text variant="bodySm" className="text-slate-400">
              Podés seleccionar el logo desde el botón en la vista previa. Las
              imágenes se gestionan a través del Media Manager.
            </Text>

            {/* Mensajes */}
            {successMsg && (
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-600 animate-in fade-in zoom-in-95">
                <Check size={20} />
                <Text
                  variant="bodySm"
                  className="font-black uppercase tracking-tight text-emerald-600"
                >
                  {successMsg}
                </Text>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-red-600">
                <AlertCircle size={20} />
                <Text
                  variant="bodySm"
                  className="font-black uppercase tracking-tight text-red-600"
                >
                  {errorMsg}
                </Text>
              </div>
            )}

            {/* Submit */}
            <div className="pt-4">
              <Button
                type="submit"
                disabled={saving}
                size="md"
                icon={saving ? Loader2 : Save}
                className={`w-full rounded-xl py-3 text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 ${
                  saving ? "[&>svg]:animate-spin" : ""
                }`}
              >
                {saving ? "Guardando..." : "Guardar Configuración"}
              </Button>
            </div>
          </form>
        </section>
      </div>

      <FilerModal
        isOpen={isFilerOpen}
        onClose={() => setIsFilerOpen(false)}
        initialSearch="logo"
        onSelectImage={(img) => {
          setSelectedLogo(img);
          setIsFilerOpen(false);
        }}
      />
    </div>
    </main>
    </div>
  );
}
