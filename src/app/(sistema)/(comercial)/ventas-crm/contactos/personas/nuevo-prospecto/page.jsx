"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, UserPlus, Check, Upload, FileSpreadsheet, AlertCircle, X, Download,
} from "lucide-react";

import { PageHeader, Section, Button, Input, Field } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { cn } from "@/lib/utils";
import { createPersona } from "@/services/apis/ventas";
import { getUser } from "@/services/apis/auth";

// ─── Configuracion ──────────────────────────────────────────────

import { CATEGORIA_OPTIONS_SELECT } from "@/config/personas";

const CATEGORIA_OPTIONS = CATEGORIA_OPTIONS_SELECT;

const TABS = [
  { id: "unitario", label: "Uno a uno", icon: UserPlus },
  { id: "masivo", label: "Carga masiva", icon: FileSpreadsheet },
];

const selectClass =
  "block w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

// ─── Tab Selector ───────────────────────────────────────────────

function TabSelector({ active, onChange }) {
  return (
    <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-0.5">
      {TABS.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all duration-150",
              isActive
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            )}
          >
            <Icon size={14} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Tab Unitario ───────────────────────────────────────────────

function TabUnitario({ recientes, setRecientes }) {
  const router = useRouter();
  const { showToast } = useToast();
  const nombreRef = useRef(null);

  const [formData, setFormData] = useState({
    razon_social: "",
    telefono: "",
    cedula: "",
    categoria: "",
    correo_electronico: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    nombreRef.current?.focus();
  }, []);

  const handleChange = (field) => (e) => {
    const value = e?.target ? e.target.value : e;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!formData.razon_social.trim()) newErrors.razon_social = "El nombre es obligatorio.";
    if (!formData.telefono.trim()) newErrors.telefono = "El celular es obligatorio.";
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSaving(true);
    setErrors({});
    try {
      const user = getUser();
      const payload = {
        etapa: "prospecto",
        razon_social: formData.razon_social.trim(),
        telefono: formData.telefono.trim(),
        tier_precio: "publico",
        vendedor: user?.id,
      };
      if (formData.cedula.trim()) payload.cedula = formData.cedula.trim();
      if (formData.categoria) payload.categoria = formData.categoria;
      if (formData.correo_electronico.trim()) payload.correo_electronico = formData.correo_electronico.trim();

      const nuevo = await createPersona(payload);
      setRecientes((prev) => [
        { id: nuevo.id, nombre: nuevo.razon_social, telefono: nuevo.telefono, categoria: nuevo.categoria },
        ...prev,
      ]);
      setFormData({ razon_social: "", telefono: "", cedula: "", categoria: "", correo_electronico: "" });
      showToast(`Prospecto "${nuevo.razon_social}" creado`, "success");
      setTimeout(() => nombreRef.current?.focus(), 50);
    } catch (err) {
      if (err.status === 400 && err.data) {
        const fieldErrors = {};
        for (const [key, val] of Object.entries(err.data)) {
          fieldErrors[key] = Array.isArray(val) ? val.join(" ") : val;
        }
        setErrors(fieldErrors);
      } else {
        showToast(err?.data?.detail || err?.message || "Error al crear", "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !saving) { e.preventDefault(); handleSave(); }
  };

  return (
    <Section
      title="Registrar Prospecto — Persona"
      subtitle="Profesionales, estudiantes u odontólogos potenciales. Enter para guardar y seguir."
    >
      <div className="p-6 space-y-4" onKeyDown={handleKeyDown}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            ref={nombreRef}
            label="Nombre completo *"
            value={formData.razon_social}
            onChange={handleChange("razon_social")}
            placeholder="Dr. Juan Pérez"
            maxLength={200}
            error={errors.razon_social}
          />
          <Input
            label="Celular *"
            value={formData.telefono}
            onChange={handleChange("telefono")}
            placeholder="+595 981 123456"
            maxLength={20}
            error={errors.telefono}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Cédula"
            value={formData.cedula}
            onChange={handleChange("cedula")}
            placeholder="1.234.567"
            maxLength={20}
            error={errors.cedula}
          />
          <Field label="Categoría">
            <select
              className={selectClass}
              value={formData.categoria}
              onChange={handleChange("categoria")}
            >
              {CATEGORIA_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>
          <Input
            label="Correo"
            type="email"
            value={formData.correo_electronico}
            onChange={handleChange("correo_electronico")}
            placeholder="correo@ejemplo.com"
            maxLength={254}
            error={errors.correo_electronico}
          />
        </div>
        {errors.non_field_errors && (
          <p className="text-sm text-red-600 font-medium">{errors.non_field_errors}</p>
        )}
        <div className="flex items-center justify-between pt-2">
          <Text variant="mutedXs" className="text-slate-400">Enter para guardar rápido</Text>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={saving}
            icon={saving ? Loader2 : UserPlus}
            className={saving ? "[&_svg]:animate-spin" : ""}
          >
            {saving ? "Guardando..." : "Guardar y Siguiente"}
          </Button>
        </div>
      </div>
    </Section>
  );
}

// ─── CSV Parser ─────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  let sep = ",";
  if (firstLine.includes("\t")) sep = "\t";
  else if (firstLine.includes(";")) sep = ";";

  const rows = lines.map((line) => line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, "")));

  const header = rows[0].map((h) => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s*\(.*?\)\s*/g, "").trim());
  const KNOWN_HEADERS = [
    "nombre", "razon_social", "name", "alumno", "contacto",
    "telefono", "celular", "phone", "cel", "whatsapp", "numero",
    "cedula", "ci", "documento",
    "categoria", "tipo",
    "correo", "email", "correo_electronico",
  ];
  const hasHeader = header.some((h) => KNOWN_HEADERS.includes(h));

  const dataRows = hasHeader ? rows.slice(1) : rows;

  let nameCol = 0;
  let phoneCol = 1;
  let cedulaCol = -1;
  let catCol = -1;
  let emailCol = -1;

  if (hasHeader) {
    const find = (keywords) => header.findIndex((h) => keywords.includes(h));
    const nameIdx = find(["nombre", "razon_social", "name", "alumno", "contacto"]);
    const phoneIdx = find(["telefono", "celular", "phone", "cel", "whatsapp", "numero"]);
    cedulaCol = find(["cedula", "ci", "documento"]);
    catCol = find(["categoria", "tipo"]);
    emailCol = find(["correo", "email", "correo_electronico"]);
    if (nameIdx >= 0) nameCol = nameIdx;
    if (phoneIdx >= 0) phoneCol = phoneIdx;
  }

  return dataRows
    .map((row) => {
      const item = {
        razon_social: row[nameCol] || "",
        telefono: row[phoneCol] || "",
      };
      if (cedulaCol >= 0 && row[cedulaCol]) item.cedula = row[cedulaCol];
      if (catCol >= 0 && row[catCol]) item.categoria = row[catCol];
      if (emailCol >= 0 && row[emailCol]) item.correo_electronico = row[emailCol];
      return item;
    })
    .filter((r) => r.razon_social || r.telefono);
}

// ─── Tab Masivo ─────────────────────────────────────────────────

function TabMasivo({ recientes, setRecientes }) {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [preview, setPreview] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDownloadTemplate = () => {
    const headers = [
      "Nombre (obligatorio)",
      "Celular (obligatorio)",
      "Cedula (opcional)",
      "Categoria (opcional)",
      "Correo (opcional)",
    ];
    const example1 = "Dr. Juan Pérez;0981123456;1234567;odontologo;juan@email.com";
    const example2 = "María González;0971555444;2345678;estudiante;maria@uni.edu.py";
    const csvContent = [headers.join(";"), example1, example2].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_prospectos_personas.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = useCallback((file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "txt", "tsv"].includes(ext)) {
      showToast("Formato no soportado. Usá CSV, TXT o TSV.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        showToast("No se encontraron datos en el archivo.", "error");
        return;
      }
      if (parsed.length > 200) {
        showToast("Máximo 200 filas. El archivo tiene " + parsed.length + " registros.", "error");
        return;
      }
      setPreview(parsed);
      setResult(null);
    };
    reader.readAsText(file, "UTF-8");
  }, [showToast]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  }, [processFile]);

  const handleFileSelect = (e) => {
    processFile(e.target.files[0]);
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (preview.length === 0) return;
    setUploading(true);
    setResult(null);

    const resultados = { creados: 0, errores: 0, detalle_creados: [], detalle_errores: [] };
    const user = getUser();

    for (let i = 0; i < preview.length; i++) {
      const item = preview[i];
      try {
        const payload = {
          razon_social: item.razon_social,
          telefono: item.telefono || "",
          etapa: "prospecto",
          tier_precio: "publico",
          vendedor: user?.id,
        };
        if (item.cedula) payload.cedula = item.cedula;
        if (item.categoria) payload.categoria = item.categoria;
        if (item.correo_electronico) payload.correo_electronico = item.correo_electronico;

        const persona = await createPersona(payload);
        resultados.creados++;
        resultados.detalle_creados.push(persona);
      } catch (err) {
        resultados.errores++;
        resultados.detalle_errores.push({
          fila: i + 1,
          nombre: item.razon_social,
          error: err?.data?.detail || err?.data?.razon_social?.[0] || String(err),
        });
      }
    }

    setResult(resultados);
    if (resultados.detalle_creados.length > 0) {
      setRecientes((prev) => [
        ...resultados.detalle_creados.map((c) => ({
          id: c.id,
          nombre: c.razon_social,
          telefono: c.telefono,
          categoria: c.categoria,
        })),
        ...prev,
      ]);
    }
    showToast(`${resultados.creados} prospectos creados`, resultados.errores > 0 ? "warning" : "success");
    if (resultados.errores === 0) setPreview([]);
    setUploading(false);
  };

  const removeRow = (idx) => {
    setPreview((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Section
      title="Carga Masiva — Personas"
      subtitle="Subí un archivo CSV con columnas: nombre, celular, cédula, categoría, correo."
    >
      <div className="p-6 space-y-5">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
            dragOver
              ? "border-blue-400 bg-blue-50/50"
              : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
          )}
        >
          <Upload size={32} className="mx-auto text-slate-400 mb-3" />
          <Text variant="bodySmBold" className="text-slate-600">
            Arrastrá un archivo CSV acá o hacé click para seleccionar
          </Text>
          <Text variant="mutedXs" className="mt-1 text-slate-400">
            Formatos: .csv, .txt, .tsv — Separadores: coma, punto y coma, tab
          </Text>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt,.tsv"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Preview */}
        {preview.length > 0 && !result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Text variant="bodySmBold" className="text-slate-700">
                Vista previa ({preview.length} personas)
              </Text>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setPreview([])}>
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleUpload}
                  disabled={uploading}
                  icon={uploading ? Loader2 : Upload}
                  className={uploading ? "[&_svg]:animate-spin" : ""}
                >
                  {uploading ? "Subiendo..." : `Crear ${preview.length} prospectos`}
                </Button>
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400 w-8">#</th>
                    <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Nombre</th>
                    <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Celular</th>
                    {preview.some((r) => r.cedula) && (
                      <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Cédula</th>
                    )}
                    {preview.some((r) => r.categoria) && (
                      <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Categoría</th>
                    )}
                    {preview.some((r) => r.correo_electronico) && (
                      <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Correo</th>
                    )}
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="py-1.5 px-3 text-xs text-slate-400">{idx + 1}</td>
                      <td className={cn("py-1.5 px-3 font-medium", !row.razon_social && "text-red-400 italic")}>
                        {row.razon_social || "— vacío"}
                      </td>
                      <td className={cn("py-1.5 px-3", !row.telefono && "text-red-400 italic")}>
                        {row.telefono || "— vacío"}
                      </td>
                      {preview.some((r) => r.cedula) && (
                        <td className="py-1.5 px-3 text-xs text-slate-500">{row.cedula || "—"}</td>
                      )}
                      {preview.some((r) => r.categoria) && (
                        <td className="py-1.5 px-3 text-xs text-slate-500">{row.categoria || "—"}</td>
                      )}
                      {preview.some((r) => r.correo_electronico) && (
                        <td className="py-1.5 px-3 text-xs text-slate-500 truncate max-w-[140px]">{row.correo_electronico || "—"}</td>
                      )}
                      <td className="py-1.5 px-1">
                        <button onClick={() => removeRow(idx)} className="text-slate-300 hover:text-red-500 p-1">
                          <X size={12} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resultado */}
        {result && (
          <div className="space-y-3">
            <div className={cn(
              "rounded-xl p-4 flex items-start gap-3",
              result.errores > 0 ? "bg-amber-50 border border-amber-200" : "bg-emerald-50 border border-emerald-200"
            )}>
              {result.errores > 0 ? (
                <AlertCircle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              ) : (
                <Check size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              )}
              <div>
                <Text variant="bodySmBold" className={result.errores > 0 ? "text-amber-700" : "text-emerald-700"}>
                  {result.creados} prospectos creados{result.errores > 0 ? `, ${result.errores} con errores` : ""}
                </Text>
                {result.detalle_errores?.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {result.detalle_errores.map((err, idx) => (
                      <li key={idx} className="text-xs text-amber-600">
                        Fila {err.fila}: {err.nombre ? `${err.nombre} — ` : ""}{err.error}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { setResult(null); setPreview([]); }}>
              Cargar otro archivo
            </Button>
          </div>
        )}

        {/* Instrucciones */}
        {preview.length === 0 && !result && (
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Text variant="bodySmBold" className="text-slate-600">Formato esperado:</Text>
              <Button
                variant="ghost"
                size="sm"
                icon={Download}
                onClick={handleDownloadTemplate}
              >
                Descargar plantilla
              </Button>
            </div>
            <pre className="text-xs text-slate-500 font-mono bg-white rounded-lg p-3 border border-slate-100">
{`nombre;celular;cedula;categoria;correo
Dr. Juan Pérez;0981123456;1234567;odontologo;juan@email.com
María González;0971555444;2345678;estudiante;maria@uni.edu.py`}
            </pre>
            <Text variant="mutedXs" className="text-slate-400">
              Columnas mínimas: nombre + celular. Opcionales: cedula, categoria, correo.
            </Text>
            <Text variant="mutedXs" className="text-slate-400">
              Categorías válidas: odontologo, estudiante, protesista, cliente_casual.
            </Text>
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── Lista de Recientes ─────────────────────────────────────────

function ListaRecientes({ recientes }) {
  const router = useRouter();
  if (recientes.length === 0) return null;

  return (
    <Section
      title={`Cargados (${recientes.length})`}
      subtitle="Prospectos registrados en esta sesión."
    >
      <div className="p-4">
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {recientes.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 py-2 px-3 bg-blue-50/60 rounded-lg border border-blue-100"
            >
              <Check size={14} className="text-blue-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <Text variant="bodySmBold" className="truncate">{r.nombre}</Text>
                <div className="flex items-center gap-2">
                  <Text variant="mutedXs">{r.telefono}</Text>
                  {r.categoria && (
                    <span className="text-[10px] font-bold uppercase text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                      {r.categoria}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => router.push(`/ventas-crm/contactos/personas/${r.id}`)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold shrink-0"
              >
                Ver
              </button>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

// ─── Página Principal ───────────────────────────────────────────

export default function NuevoProspectoPersonaPage() {
  const [tab, setTab] = useState("unitario");
  const [recientes, setRecientes] = useState([]);

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Contactos", href: "/ventas-crm/contactos" },
          { label: "Personas", href: "/ventas-crm/contactos/personas" },
          { label: "Nuevo Prospecto" },
        ]}
        subtitle="Personas · Carga de prospectos individuales"
        subtitleClassName="text-blue-600"
      >
        <TabSelector active={tab} onChange={setTab} />
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-8 min-w-0">
        <div className="max-w-2xl mx-auto space-y-6">
          {tab === "unitario" && (
            <TabUnitario recientes={recientes} setRecientes={setRecientes} />
          )}
          {tab === "masivo" && (
            <TabMasivo recientes={recientes} setRecientes={setRecientes} />
          )}
          <ListaRecientes recientes={recientes} />
        </div>
      </main>
    </div>
  );
}
