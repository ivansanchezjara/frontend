"use client";
import { useState, useEffect } from "react";
import {
  PageHeader, Button, LoadingScreen, EmptyState, Modal,
  Input, Field, useToast,
} from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getTerminalesPOS, crearTerminalPOS, actualizarTerminalPOS } from "@/services/apis/caja";
import { getCuentas } from "@/services/apis/tesoreria";
import { CreditCard, Plus, Pencil, Building2, Percent, Power } from "lucide-react";

export default function TerminalesPOSPage() {
  const { showToast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const { data, loading, execute: fetchTerminales } = useApi(getTerminalesPOS, {
    auto: true, initialData: { results: [] },
  });

  const terminales = data?.results || data || [];

  const handleCrear = () => { setEditing(null); setFormOpen(true); };
  const handleEditar = (t) => { setEditing(t); setFormOpen(true); };

  const handleSuccess = () => {
    setFormOpen(false);
    setEditing(null);
    fetchTerminales();
  };

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Caja", href: "/caja" },
          { label: "Terminales POS" },
        ]}
        subtitle={<><CreditCard size={12} /> Configuración de terminales de tarjeta</>}
      >
        <Button variant="primary" size="sm" icon={Plus} onClick={handleCrear}>
          Nueva Terminal
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 min-w-0">
        <div className="max-w-4xl mx-auto space-y-4">
          {loading ? (
            <LoadingScreen message="Cargando terminales..." />
          ) : terminales.length === 0 ? (
            <EmptyState
              icon="💳"
              title="Sin terminales POS"
              description="Configurá al menos un terminal para procesar pagos con tarjeta."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {terminales.map((t) => (
                <TerminalCard key={t.id} terminal={t} onEditar={() => handleEditar(t)} />
              ))}
            </div>
          )}
        </div>
      </main>

      {formOpen && (
        <TerminalFormModal
          initial={editing}
          onClose={() => { setFormOpen(false); setEditing(null); }}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}

// ─── Card de Terminal ────────────────────────────────────────────

function TerminalCard({ terminal, onEditar }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
            <CreditCard size={20} className="text-purple-600" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-800">{terminal.nombre}</p>
            <p className="text-xs text-slate-400">{terminal.proveedor}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEditar} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors" title="Editar">
            <Pencil size={14} />
          </button>
        </div>
      </div>

      {/* Comisiones */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Crédito</p>
          <p className="text-lg font-black text-slate-800">{terminal.comision_credito}%</p>
          <p className="text-[10px] text-slate-400">{terminal.dias_acreditacion_credito} días hábiles</p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Débito</p>
          <p className="text-lg font-black text-slate-800">{terminal.comision_debito}%</p>
          <p className="text-[10px] text-slate-400">{terminal.dias_acreditacion_debito} día hábil</p>
        </div>
      </div>

      {/* Cuenta bancaria */}
      <div className="flex items-center gap-2 text-xs text-slate-500 bg-blue-50 rounded-lg px-3 py-2">
        <Building2 size={12} className="text-blue-500" />
        <span>Acreditación en: <strong className="text-blue-700">{terminal.cuenta_acreditacion_nombre}</strong></span>
      </div>

      {/* Info extra */}
      {terminal.numero_terminal && (
        <p className="text-[10px] text-slate-400">Terminal #{terminal.numero_terminal} · IVA comisión: {terminal.iva_sobre_comision}%</p>
      )}
    </div>
  );
}

// ─── Modal Formulario ───────────────────────────────────────────

function TerminalFormModal({ initial, onClose, onSuccess }) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [cuentas, setCuentas] = useState([]);

  const [form, setForm] = useState({
    nombre: initial?.nombre || "",
    proveedor: initial?.proveedor || "",
    numero_terminal: initial?.numero_terminal || "",
    cuenta_acreditacion: initial?.cuenta_acreditacion || "",
    comision_credito: initial?.comision_credito || "3.50",
    comision_debito: initial?.comision_debito || "1.80",
    dias_acreditacion_credito: initial?.dias_acreditacion_credito || 2,
    dias_acreditacion_debito: initial?.dias_acreditacion_debito || 1,
    iva_sobre_comision: initial?.iva_sobre_comision || "10.00",
  });

  useEffect(() => {
    getCuentas({ tipo: "banco" }).then((data) => {
      setCuentas(data?.results || data || []);
    }).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre || !form.proveedor || !form.cuenta_acreditacion) {
      showToast("Completá nombre, proveedor y cuenta bancaria", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        cuenta_acreditacion: Number(form.cuenta_acreditacion),
        comision_credito: form.comision_credito,
        comision_debito: form.comision_debito,
        iva_sobre_comision: form.iva_sobre_comision,
      };

      if (initial) {
        await actualizarTerminalPOS(initial.id, payload);
        showToast("Terminal actualizada", "success");
      } else {
        await crearTerminalPOS(payload);
        showToast("Terminal creada", "success");
      }
      onSuccess();
    } catch (err) {
      showToast(err?.data?.detail || "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Modal open onClose={onClose} title={initial ? "Editar Terminal POS" : "Nueva Terminal POS"} size="md">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Datos básicos */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre *">
            <Input value={form.nombre} onChange={(e) => update("nombre", e.target.value)} placeholder="Ej: POS Mostrador 1" />
          </Field>
          <Field label="Proveedor *">
            <Input value={form.proveedor} onChange={(e) => update("proveedor", e.target.value)} placeholder="Ej: Bancard, Pronet" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Nro. Terminal">
            <Input value={form.numero_terminal} onChange={(e) => update("numero_terminal", e.target.value)} placeholder="Asignado por el procesador" />
          </Field>
          <Field label="Cuenta bancaria destino *">
            <select
              value={form.cuenta_acreditacion}
              onChange={(e) => update("cuenta_acreditacion", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="">Seleccionar cuenta...</option>
              {cuentas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.entidad_bancaria ? `(${c.entidad_bancaria})` : ""}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/* Comisiones */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2">
            <Percent size={14} className="text-slate-400" />
            <p className="text-xs font-bold text-slate-500 uppercase">Comisiones</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Crédito (%)">
              <Input type="number" step="0.01" min="0" max="100" value={form.comision_credito}
                onChange={(e) => update("comision_credito", e.target.value)} />
            </Field>
            <Field label="Débito (%)">
              <Input type="number" step="0.01" min="0" max="100" value={form.comision_debito}
                onChange={(e) => update("comision_debito", e.target.value)} />
            </Field>
            <Field label="IVA s/comisión (%)">
              <Input type="number" step="0.01" min="0" max="100" value={form.iva_sobre_comision}
                onChange={(e) => update("iva_sobre_comision", e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Plazos */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Días acreditación crédito">
            <Input type="number" min="0" value={form.dias_acreditacion_credito}
              onChange={(e) => update("dias_acreditacion_credito", Number(e.target.value))} />
          </Field>
          <Field label="Días acreditación débito">
            <Input type="number" min="0" value={form.dias_acreditacion_debito}
              onChange={(e) => update("dias_acreditacion_debito", Number(e.target.value))} />
          </Field>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button variant="ghost" type="button" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : initial ? "Guardar Cambios" : "Crear Terminal"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
