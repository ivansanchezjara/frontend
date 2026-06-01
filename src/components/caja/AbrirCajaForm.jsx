"use client";
import { useState } from "react";
import { Input, Button } from "@/components/ui";
import { abrirCaja } from "@/services/apis/caja";

/**
 * Formulario para abrir una sesión de caja declarando el fondo inicial por moneda.
 *
 * @param {Function} onSuccess - Callback ejecutado tras abrir caja exitosamente
 */
export default function AbrirCajaForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    fondo_pyg: 0,
    fondo_usd: 0,
    fondo_brl: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setError(null);
  };

  const validate = () => {
    const errors = {};
    const pyg = Number(formData.fondo_pyg);
    const usd = Number(formData.fondo_usd);
    const brl = Number(formData.fondo_brl);

    if (isNaN(pyg) || pyg < 0) {
      errors.fondo_pyg = "El monto no puede ser negativo.";
    }
    if (!Number.isInteger(pyg) && !isNaN(pyg)) {
      errors.fondo_pyg = "El monto en PYG debe ser un número entero.";
    }
    if (isNaN(usd) || usd < 0) {
      errors.fondo_usd = "El monto no puede ser negativo.";
    }
    if (isNaN(brl) || brl < 0) {
      errors.fondo_brl = "El monto no puede ser negativo.";
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      await abrirCaja({
        fondo_pyg: Number(formData.fondo_pyg),
        fondo_usd: Number(formData.fondo_usd),
        fondo_brl: Number(formData.fondo_brl),
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      const message =
        err?.data?.detail ||
        err?.data?.non_field_errors?.[0] ||
        err?.message ||
        "Error al abrir caja. Intente nuevamente.";
      setError(message);

      // Map field-level errors from API
      if (err?.data && typeof err.data === "object") {
        const apiFieldErrors = {};
        if (err.data.fondo_pyg) {
          apiFieldErrors.fondo_pyg = Array.isArray(err.data.fondo_pyg)
            ? err.data.fondo_pyg.join(", ")
            : err.data.fondo_pyg;
        }
        if (err.data.fondo_usd) {
          apiFieldErrors.fondo_usd = Array.isArray(err.data.fondo_usd)
            ? err.data.fondo_usd.join(", ")
            : err.data.fondo_usd;
        }
        if (err.data.fondo_brl) {
          apiFieldErrors.fondo_brl = Array.isArray(err.data.fondo_brl)
            ? err.data.fondo_brl.join(", ")
            : err.data.fondo_brl;
        }
        if (Object.keys(apiFieldErrors).length > 0) {
          setFieldErrors(apiFieldErrors);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Input
        label="Fondo Inicial PYG (Guaraníes)"
        type="number"
        min="0"
        step="1"
        value={formData.fondo_pyg}
        onChange={handleChange("fondo_pyg")}
        placeholder="0"
        error={fieldErrors.fondo_pyg}
        disabled={loading}
      />

      <Input
        label="Fondo Inicial USD (Dólares)"
        type="number"
        min="0"
        step="0.01"
        value={formData.fondo_usd}
        onChange={handleChange("fondo_usd")}
        placeholder="0.00"
        error={fieldErrors.fondo_usd}
        disabled={loading}
      />

      <Input
        label="Fondo Inicial BRL (Reales)"
        type="number"
        min="0"
        step="0.01"
        value={formData.fondo_brl}
        onChange={handleChange("fondo_brl")}
        placeholder="0.00"
        error={fieldErrors.fondo_brl}
        disabled={loading}
      />

      <div className="pt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full"
        >
          {loading ? "Abriendo Caja..." : "Abrir Caja"}
        </Button>
      </div>
    </form>
  );
}
