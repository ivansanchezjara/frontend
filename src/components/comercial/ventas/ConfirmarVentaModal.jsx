"use client";
import { useState, useEffect } from "react";
import {
  Store, Truck, Building2, CreditCard, Wallet, Package,
  MapPin, MessageSquare, CheckCircle2, Loader2, Phone, User,
} from "lucide-react";
import { Modal, Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

// ─── Opciones ───────────────────────────────────────────────────

const METODOS_ENTREGA = [
  { value: "mostrador", label: "Retiro en mostrador", description: "El cliente retira en sucursal", icon: Store },
  { value: "delivery", label: "Envío / Delivery", description: "Se envía a una dirección", icon: Truck },
  { value: "retiro_sucursal", label: "Retiro en otra sucursal", description: "El cliente retira en otra sede", icon: Building2 },
];

const METODOS_COBRO = [
  { value: "caja_presencial", label: "Caja presencial", description: "Se cobra en el local", icon: Wallet },
  { value: "pasarela_online", label: "Pago online", description: "Paga por transferencia o pasarela", icon: CreditCard },
  { value: "contra_entrega", label: "Contra entrega", description: "Se cobra al momento de entregar", icon: Package },
];

// ─── Componente de opción seleccionable ─────────────────────────

function OptionCard({ icon: Icon, label, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 text-left transition-all",
        selected
          ? "border-emerald-500 bg-emerald-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      <span className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-colors",
        selected ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-500"
      )}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-bold", selected ? "text-emerald-700" : "text-slate-700")}>
          {label}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      {selected && (
        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
      )}
    </button>
  );
}

// ─── Helper: armar dirección completa del cliente ───────────────

function buildDireccionCliente(cliente) {
  if (!cliente) return "";
  const partes = [];
  if (cliente.direccion) partes.push(cliente.direccion);
  if (cliente.ciudad) partes.push(cliente.ciudad);
  if (cliente.departamento) partes.push(cliente.departamento);
  return partes.join(", ");
}

// ─── Modal Principal ────────────────────────────────────────────

export default function ConfirmarVentaModal({ open, onClose, onConfirmar, confirmando, cliente }) {
  const [metodoEntrega, setMetodoEntrega] = useState("mostrador");
  const [metodoCobro, setMetodoCobro] = useState("caja_presencial");
  const [usarDireccionCliente, setUsarDireccionCliente] = useState(true);
  const [direccionEntrega, setDireccionEntrega] = useState("");
  const [referencia, setReferencia] = useState("");
  const [contactoNombre, setContactoNombre] = useState("");
  const [contactoTelefono, setContactoTelefono] = useState("");
  const [observaciones, setObservaciones] = useState("");

  const direccionCliente = buildDireccionCliente(cliente);
  const tieneDireccionCliente = !!direccionCliente;

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setMetodoEntrega("mostrador");
      setMetodoCobro("caja_presencial");
      setUsarDireccionCliente(true);
      setDireccionEntrega("");
      setReferencia("");
      setContactoNombre("");
      setContactoTelefono(cliente?.telefono || "");
      setObservaciones("");
    }
  }, [open, cliente]);

  const esDelivery = metodoEntrega === "delivery";

  // La dirección final que se envía
  const direccionFinal = esDelivery
    ? (usarDireccionCliente && tieneDireccionCliente ? direccionCliente : direccionEntrega.trim())
    : "";

  const handleConfirmar = () => {
    // Armar observaciones con info de contacto
    const parteContacto = [];
    if (contactoNombre) parteContacto.push(`Recibe: ${contactoNombre}`);
    if (contactoTelefono) parteContacto.push(`Tel: ${contactoTelefono}`);
    if (referencia) parteContacto.push(`Ref: ${referencia}`);
    if (observaciones.trim()) parteContacto.push(observaciones.trim());

    onConfirmar({
      metodo_entrega: metodoEntrega,
      metodo_cobro: metodoCobro,
      direccion_entrega: direccionFinal,
      observaciones_entrega: parteContacto.join(" | "),
    });
  };

  const direccionValida = !esDelivery || direccionFinal.length > 0;

  return (
    <Modal open={open} onClose={onClose} title="Confirmar Pedido" size="md">
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

        {/* ─── Método de Entrega ─────────────────────────── */}
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
            ¿Cómo se entrega?
          </h4>
          <div className="space-y-2">
            {METODOS_ENTREGA.map((m) => (
              <OptionCard
                key={m.value}
                icon={m.icon}
                label={m.label}
                description={m.description}
                selected={metodoEntrega === m.value}
                onClick={() => setMetodoEntrega(m.value)}
              />
            ))}
          </div>
        </div>

        {/* ─── Dirección de envío (solo delivery) ────────── */}
        {esDelivery && (
          <div className="space-y-4 bg-blue-50/50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-600">
              <MapPin size={14} />
              <span className="text-xs font-bold uppercase">Dirección de entrega</span>
            </div>

            {/* Toggle: usar dirección del cliente o escribir otra */}
            {tieneDireccionCliente && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setUsarDireccionCliente(true)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg border-2 transition-all",
                    usarDireccionCliente
                      ? "border-blue-400 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <p className="text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                    Dirección del cliente
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {direccionCliente}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setUsarDireccionCliente(false)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg border-2 transition-all",
                    !usarDireccionCliente
                      ? "border-blue-400 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  )}
                >
                  <p className="text-sm font-medium text-slate-600">
                    Usar otra dirección
                  </p>
                </button>
              </div>
            )}

            {/* Input de dirección (si no usa la del cliente o no tiene) */}
            {(!tieneDireccionCliente || !usarDireccionCliente) && (
              <Input
                label="Dirección"
                placeholder="Ej: Av. Mariscal López 3200 c/ San Martín, Asunción"
                value={direccionEntrega}
                onChange={(e) => setDireccionEntrega(e.target.value)}
              />
            )}

            {/* Referencia */}
            <Input
              label="Referencia / entre calles"
              placeholder="Ej: Frente al Shopping del Sol, portón gris"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
            />

            {/* Contacto de recepción */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  <User size={10} className="inline mr-1" />
                  Quién recibe
                </label>
                <input
                  type="text"
                  placeholder="Nombre de contacto"
                  value={contactoNombre}
                  onChange={(e) => setContactoNombre(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-300 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  <Phone size={10} className="inline mr-1" />
                  Teléfono
                </label>
                <input
                  type="tel"
                  placeholder="0981 123 456"
                  value={contactoTelefono}
                  onChange={(e) => setContactoTelefono(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-blue-200 focus:border-blue-300 outline-none transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── Método de Cobro ───────────────────────────── */}
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
            ¿Cómo se cobra?
          </h4>
          <div className="space-y-2">
            {METODOS_COBRO.map((m) => (
              <OptionCard
                key={m.value}
                icon={m.icon}
                label={m.label}
                description={m.description}
                selected={metodoCobro === m.value}
                onClick={() => setMetodoCobro(m.value)}
              />
            ))}
          </div>
        </div>

        {/* ─── Observaciones ─────────────────────────────── */}
        <div>
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
            Observaciones (opcional)
          </h4>
          <div className="relative">
            <MessageSquare size={14} className="absolute left-3 top-3 text-slate-400" />
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Instrucciones especiales, horarios de entrega, etc."
              rows={3}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 outline-none transition-all resize-none"
            />
          </div>
        </div>
      </div>

      {/* ─── Footer ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
        <p className="text-xs text-slate-400">
          Se reservará stock y no se podrá editar después.
        </p>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={confirmando}>
            Cancelar
          </Button>
          <Button
            variant="success"
            size="sm"
            icon={confirmando ? Loader2 : CheckCircle2}
            className={confirmando ? "[&_svg]:animate-spin" : ""}
            onClick={handleConfirmar}
            disabled={confirmando || !direccionValida}
          >
            {confirmando ? "Confirmando..." : "Confirmar Pedido"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
