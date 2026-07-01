"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, UserPlus, Check, Upload, FileSpreadsheet, AlertCircle, X, Download,
} from "lucide-react";

import { PageHeader, Section, Button, Input } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { cn } from "@/lib/utils";
import { createCliente, bulkCreateProspectos } from "@/services/apis/ventas";
import { getUser } from "@/services/apis/auth";

// ─── Tab Selector ───────────────────────────────────────────────

const TABS = [
  { id: "unitario", label: "Uno a uno", icon: UserPlus },
  { id: "masivo", label: "Carga masiva", icon: FileSpreadsheet },
];

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

  const [formData, setFormData] = useState({ razon_social: "", telefono: "", ruc: "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    nombreRef.current?.focus();
  }, []);

  const handleChange = (field) => (value) => {
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
      if (formData.ruc.trim()) payload.ruc = formData.ruc.trim();
      const nuevo = await createCliente(payload);
      setRecientes((prev) => [
        { id: nuevo.id, nombre: nuevo.razon_social, telefono: nuevo.telefono },
        ...prev,
      ]);
      setFormData({ razon_social: "", telefono: "", ruc: "" });
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
      title="Registrar Prospecto"
      subtitle="Nombre y celular. Enter para guardar y seguir."
    >
      <div className="p-6 space-y-4" onKeyDown={handleKeyDown}>
        <Input
          ref={nombreRef}
          label="Nombre *"
          value={formData.razon_social}
          onChange={(e) => handleChange("razon_social")(e.target.value)}
          placeholder="Nombre completo"
          maxLength={200}
          error={errors.razon_social}
        />
        <Input
          label="Celular *"
          value={formData.telefono}
          onChange={(e) => handleChange("telefono")(e.target.value)}
          placeholder="+595 981 123456"
          maxLength={20}
          error={errors.telefono}
        />
        <Input
          label="RUC (opcional)"
          value={formData.ruc}
          onChange={(e) => handleChange("ruc")(e.target.value)}
          placeholder="80000000-0"
          maxLength={20}
          error={errors.ruc}
        />
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

// ─── Tab Masivo ─────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  // Detectar separador (tab, ; o ,)
  const firstLine = lines[0];
  let sep = ",";
  if (firstLine.includes("\t")) sep = "\t";
  else if (firstLine.includes(";")) sep = ";";

  const rows = lines.map((line) => line.split(sep).map((c) => c.trim().replace(/^["']|["']$/g, "")));

  // Detectar si primera fila es header
  const header = rows[0].map((h) => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s*\(.*?\)\s*/g, "").trim());
  const KNOWN_HEADERS = [
    "nombre", "razon_social", "name", "alumno", "contacto",
    "telefono", "celular", "phone", "cel", "whatsapp", "numero",
    "departamento", "ciudad", "city",
    "cedula", "ci", "documento",
    "registro_profesional", "registro", "matricula", "nro_registro",
    "categoria", "tipo",
    "correo", "email", "correo_electronico",
    "ruc",
  ];
  const hasHeader = header.some((h) => KNOWN_HEADERS.includes(h));

  const dataRows = hasHeader ? rows.slice(1) : rows;

  // Mapear columnas
  let nameCol = 0;
  let phoneCol = 1;
  let depCol = -1;
  let cityCol = -1;
  let cedulaCol = -1;
  let regProCol = -1;
  let emailCol = -1;
  let catCol = -1;
  let rucCol = -1;

  if (hasHeader) {
    const find = (keywords) => header.findIndex((h) => keywords.includes(h));
    const nameIdx = find(["nombre", "razon_social", "name", "alumno", "contacto"]);
    const phoneIdx = find(["telefono", "celular", "phone", "cel", "whatsapp", "numero"]);
    depCol = find(["departamento"]);
    cityCol = find(["ciudad", "city"]);
    cedulaCol = find(["cedula", "ci", "documento"]);
    regProCol = find(["registro_profesional", "registro", "matricula", "nro_registro"]);
    emailCol = find(["correo", "email", "correo_electronico"]);
    catCol = find(["categoria", "tipo"]);
    rucCol = find(["ruc"]);
    if (nameIdx >= 0) nameCol = nameIdx;
    if (phoneIdx >= 0) phoneCol = phoneIdx;
  }

  return dataRows
    .map((row) => {
      const item = {
        razon_social: row[nameCol] || "",
        telefono: row[phoneCol] || "",
      };
      if (depCol >= 0 && row[depCol]) item.departamento = row[depCol];
      if (cityCol >= 0 && row[cityCol]) item.ciudad = row[cityCol];
      if (cedulaCol >= 0 && row[cedulaCol]) item.cedula = row[cedulaCol];
      if (regProCol >= 0 && row[regProCol]) item.registro_profesional = row[regProCol];
      if (emailCol >= 0 && row[emailCol]) item.correo_electronico = row[emailCol];
      if (catCol >= 0 && row[catCol]) item.categoria = row[catCol];
      if (rucCol >= 0 && row[rucCol]) item.ruc = row[rucCol];
      return item;
    })
    .filter((r) => r.razon_social || r.telefono);
}

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
      "RUC (opcional)",
      "Departamento (opcional)",
      "Ciudad (opcional)",
      "Cedula (opcional)",
      "Correo (opcional)",
      "Categoria (opcional)",
    ];
    const example1 = "Juan Pérez;0981123456;80012345-6;Central;Asunción;1234567;juan@email.com;odontólogo";
    const example2 = "Dental Plus SRL;021555444;80098765-2;Central;San Lorenzo;;;distribuidor";
    const csvContent = [headers.join(";"), example1, example2].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_prospectos.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processFile = useCallback((file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["csv", "txt", "tsv", "xls", "xlsx"].includes(ext)) {
      showToast("Formato no soportado. Usá CSV, TXT o TSV.", "error");
      return;
    }

    if (["xls", "xlsx"].includes(ext)) {
      // Para Excel usamos un approach de texto plano — pedirle que guarde como CSV
      showToast("Guardá el Excel como CSV (separado por comas) e intentá de nuevo.", "info");
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
    try {
      const res = await bulkCreateProspectos(preview);
      setResult(res);
      if (res.detalle_creados?.length > 0) {
        setRecientes((prev) => [
          ...res.detalle_creados.map((c) => ({
            id: c.id,
            nombre: c.razon_social,
            telefono: c.telefono,
          })),
          ...prev,
        ]);
      }
      showToast(`${res.creados} prospectos creados`, res.errores > 0 ? "warning" : "success");
      if (res.errores === 0) setPreview([]);
    } catch (err) {
      showToast(err?.data?.detail || "Error al subir prospectos", "error");
    } finally {
      setUploading(false);
    }
  };

  const removeRow = (idx) => {
    setPreview((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <Section
      title="Carga Masiva"
      subtitle="Subí un archivo CSV con columnas: nombre, celular. Detecta headers automáticamente."
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
              ? "border-emerald-400 bg-emerald-50/50"
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
                Vista previa ({preview.length} contactos)
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
                    {preview.some((r) => r.ruc) && (
                      <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">RUC</th>
                    )}
                    {preview.some((r) => r.ciudad || r.departamento) && (
                      <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Ubicación</th>
                    )}
                    {preview.some((r) => r.registro_profesional || r.cedula) && (
                      <th className="text-left py-2 px-3 text-[11px] font-bold uppercase text-slate-400">Docs</th>
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
                      {preview.some((r) => r.ruc) && (
                        <td className="py-1.5 px-3 text-xs text-slate-500 font-mono">
                          {row.ruc || "—"}
                        </td>
                      )}
                      {preview.some((r) => r.ciudad || r.departamento) && (
                        <td className="py-1.5 px-3 text-xs text-slate-500">
                          {[row.ciudad, row.departamento].filter(Boolean).join(", ")}
                        </td>
                      )}
                      {preview.some((r) => r.registro_profesional || r.cedula) && (
                        <td className="py-1.5 px-3 text-xs text-slate-500">
                          {[row.cedula && `CI: ${row.cedula}`, row.registro_profesional && `Reg: ${row.registro_profesional}`].filter(Boolean).join(" · ")}
                        </td>
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
{`nombre,celular,ruc,departamento,ciudad
Juan Pérez,0981123456,80012345-6,Central,Asunción
Dental Plus SRL,021555444,80098765-2,Central,San Lorenzo`}
            </pre>
            <Text variant="mutedXs" className="text-slate-400">
              Columnas mínimas: nombre + celular.
            </Text>
             <Text variant="mutedXs" className="text-slate-400">
              Opcionales: ruc, departamento, ciudad, cedula, registro_profesional, correo, categoria.
            </Text>
            <Text variant="mutedXs" className="text-slate-400">
              Headers opcionales. Detecta separadores: coma, punto y coma, tab. Máx. 200 filas.
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
              className="flex items-center gap-3 py-2 px-3 bg-emerald-50/60 rounded-lg border border-emerald-100"
            >
              <Check size={14} className="text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <Text variant="bodySmBold" className="truncate">{r.nombre}</Text>
                <Text variant="mutedXs">{r.telefono}</Text>
              </div>
              <button
                onClick={() => router.push(`/ventas-crm/clientes/${r.id}`)}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold shrink-0"
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

export default function NuevoProspectoPage() {
  const [tab, setTab] = useState("unitario");
  const [recientes, setRecientes] = useState([]);

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Clientes", href: "/ventas-crm/clientes" },
          { label: "Nuevo Prospecto" },
        ]}
        subtitle="CRM · Carga de contactos potenciales"
        subtitleClassName="text-emerald-600"
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
