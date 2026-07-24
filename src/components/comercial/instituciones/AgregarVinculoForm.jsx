"use client";
import { useState, useMemo } from "react";
import { X, Search } from "lucide-react";

import { Button, Input, Field } from "@/components/ui";
import { useToast } from "@/components/ui";
import { Text } from "@/components/ui/basics/Typography";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { createVinculoDocente, createCargoDirectivo } from "@/services/apis/ventas";
import { TIPO_DOCENTE, selectClass } from "./constants";

/**
 * Form inline para vincular una persona existente a la institución.
 * Soporta: Docente (con oferta académica opcional) y Directivo (con cargo).
 */
export function AgregarVinculoForm({ institucionId, personas, ofertas, onSaved, onCancel }) {
  const { showToast } = useToast();

  const [tipoVinculo, setTipoVinculo] = useState("docente"); // "docente" | "directivo"
  const [personaId, setPersonaId] = useState("");
  const [busquedaPersona, setBusquedaPersona] = useState("");
  const busquedaDebounced = useDebounce(busquedaPersona, 200);

  // Campos docente
  const [ofertaAcademica, setOfertaAcademica] = useState("");
  const [catedra, setCatedra] = useState("");
  const [tipoDocente, setTipoDocente] = useState("titular");

  // Campos directivo
  const [cargo, setCargo] = useState("");

  const [saving, setSaving] = useState(false);

  // Filtrar personas por búsqueda
  const personasFiltradas = useMemo(() => {
    if (!busquedaDebounced.trim()) return personas.slice(0, 20);
    const q = busquedaDebounced.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return personas
      .filter((p) => {
        const nombre = (p.razon_social || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return nombre.includes(q);
      })
      .slice(0, 20);
  }, [personas, busquedaDebounced]);

  const personaSeleccionada = personas.find((p) => p.id === parseInt(personaId));

  const handleSave = async () => {
    if (!personaId) {
      showToast("Seleccioná una persona", "error");
      return;
    }

    setSaving(true);
    try {
      if (tipoVinculo === "docente") {
        await createVinculoDocente({
          persona: parseInt(personaId),
          institucion: institucionId,
          oferta_academica: ofertaAcademica ? parseInt(ofertaAcademica) : null,
          catedra: catedra.trim(),
          tipo: tipoDocente,
        });
        showToast("Docente vinculado", "success");
      } else {
        if (!cargo.trim()) {
          showToast("El cargo es obligatorio para directivos", "error");
          setSaving(false);
          return;
        }
        await createCargoDirectivo({
          persona: parseInt(personaId),
          institucion: institucionId,
          cargo: cargo.trim(),
        });
        showToast("Directivo vinculado", "success");
      }
      onSaved();
    } catch (err) {
      showToast(err?.data?.detail || err?.data?.non_field_errors?.[0] || "Error al vincular", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <Text variant="bodySmBold" className="text-emerald-700">
          Agregar Vínculo
        </Text>
        <button
          onClick={onCancel}
          aria-label="Cerrar"
          className="text-slate-400 hover:text-slate-600"
        >
          <X size={14} />
        </button>
      </div>

      {/* Tipo de vínculo */}
      <div className="flex gap-2">
        <button
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
            tipoVinculo === "docente"
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
          )}
          onClick={() => setTipoVinculo("docente")}
        >
          Docente
        </button>
        <button
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
            tipoVinculo === "directivo"
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
          )}
          onClick={() => setTipoVinculo("directivo")}
        >
          Directivo
        </button>
      </div>

      {/* Selector de persona */}
      <Field label="Persona *">
        {personaSeleccionada ? (
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-3.5 py-2.5">
            <span className="text-sm font-medium text-slate-700">
              {personaSeleccionada.razon_social}
            </span>
            <button
              onClick={() => { setPersonaId(""); setBusquedaPersona(""); }}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Cambiar persona"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={busquedaPersona}
                onChange={(e) => setBusquedaPersona(e.target.value)}
                placeholder="Buscar persona por nombre..."
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            {busquedaDebounced.trim() && (
              <div className="bg-white border border-slate-200 rounded-lg max-h-[160px] overflow-y-auto">
                {personasFiltradas.length === 0 ? (
                  <div className="p-3 text-center">
                    <Text variant="mutedXs">Sin resultados</Text>
                  </div>
                ) : (
                  personasFiltradas.map((p) => (
                    <button
                      key={p.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0"
                      onClick={() => { setPersonaId(String(p.id)); setBusquedaPersona(""); }}
                    >
                      {p.razon_social}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </Field>

      {/* Campos específicos según tipo */}
      {tipoVinculo === "docente" && (
        <>
          <Field label="Oferta Académica">
            <select
              className={selectClass}
              value={ofertaAcademica}
              onChange={(e) => setOfertaAcademica(e.target.value)}
            >
              <option value="">— General (toda la institución) —</option>
              {ofertas.map((o) => (
                <option key={o.id} value={o.id}>{o.nombre}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <select
                className={selectClass}
                value={tipoDocente}
                onChange={(e) => setTipoDocente(e.target.value)}
              >
                {TIPO_DOCENTE.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </Field>
            <Input
              label="Cátedra"
              value={catedra}
              onChange={(e) => setCatedra(e.target.value)}
              placeholder="Ortodoncia II"
            />
          </div>
        </>
      )}

      {tipoVinculo === "directivo" && (
        <Input
          label="Cargo *"
          value={cargo}
          onChange={(e) => setCargo(e.target.value)}
          placeholder="Decano, Director, Coordinador..."
        />
      )}

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Vinculando..." : "Vincular"}
        </Button>
      </div>
    </div>
  );
}
