"use client";
import { useState, useMemo, useEffect } from "react";
import { Modal, Button, MontoInput, Text } from "@/components/ui";
import { useToast } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { cobrarPedido, getTerminalesPOS } from "@/services/apis/caja";
import { getTipoCambioVigente } from "@/services/apis/ventas";
import { cn } from "@/lib/utils";
import { Plus, CreditCard, CheckCircle, Receipt, FileText } from "lucide-react";

import InfoPedido from "./cobrar/InfoPedido";
import PagoItem from "./cobrar/PagoItem";
import ResumenCobro from "./cobrar/ResumenCobro";
import ResultadoCobro from "./cobrar/ResultadoCobro";
import {
  METODO_PAGO_OPTIONS,
  MAX_PAGOS,
  getMonedaForMetodo,
  formatMonto,
  getMonedaSymbol,
  convertir,
} from "./cobrar/utils";

// ─── Componente Principal ───────────────────────────────────────

export default function CobrarPedidoModal({ pedido, onClose, onSuccess }) {
  const { showToast } = useToast();
  const { execute: ejecutarCobro, loading: cobrando } = useApi(cobrarPedido, {
    handleError: false,
  });

  // Tasas de cambio vigentes
  const [tasas, setTasas] = useState({});
  const [cargandoTasas, setCargandoTasas] = useState(true);

  // Terminales POS disponibles
  const [terminales, setTerminales] = useState([]);

  // Cargar tasas y terminales al montar
  useEffect(() => {
    async function cargarTasas() {
      const pares = ["USD/PYG", "USD/BRL"];
      const resultado = {};
      for (const par of pares) {
        try {
          const tc = await getTipoCambioVigente(par);
          if (tc?.valor) resultado[par] = parseFloat(tc.valor);
        } catch { /* sin tasa disponible para este par */ }
      }
      setTasas(resultado);
      setCargandoTasas(false);
    }
    async function cargarTerminales() {
      try {
        const data = await getTerminalesPOS();
        setTerminales(data?.results || data || []);
      } catch { /* sin terminales configuradas */ }
    }
    cargarTasas();
    cargarTerminales();
  }, []);

  // Estado de pagos
  const [pagos, setPagos] = useState(() => {
    if (pedido?.pagos?.length > 0) {
      return pedido.pagos.map((p) => ({
        metodo: p.metodo || "efectivo_pyg",
        monto: p.monto?.toString() || "",
        moneda: p.moneda || pedido.moneda_negociacion || "PYG",
        referencia: p.referencia || "",
      }));
    }
    const monedaPedido = pedido?.moneda_negociacion || "PYG";
    const metodoDefault = monedaPedido === "USD" ? "efectivo_usd" : monedaPedido === "BRL" ? "efectivo_brl" : "efectivo_pyg";
    return [{ metodo: metodoDefault, monto: "", moneda: monedaPedido, referencia: "" }];
  });

  const [resultado, setResultado] = useState(null);
  const [emitirFactura, setEmitirFactura] = useState(pedido?.requiere_factura_legal ?? false);

  // Valores derivados del pedido
  const totalPedido = Number(pedido?.total_moneda_negociacion) || 0;
  const moneda = pedido?.moneda_negociacion || "PYG";
  const totalUsd = Number(pedido?.total_usd) || 0;

  // Totales en las 3 monedas (USD, PYG, BRL)
  const totalesMultimoneda = useMemo(() => {
    const result = { USD: totalUsd, PYG: null, BRL: null };
    result[moneda] = totalPedido;
    if (totalUsd > 0) {
      if (moneda !== "PYG" && tasas["USD/PYG"]) {
        result.PYG = Math.round(totalUsd * tasas["USD/PYG"]);
      }
      if (moneda !== "BRL" && tasas["USD/BRL"]) {
        result.BRL = Math.round(totalUsd * tasas["USD/BRL"] * 100) / 100;
      }
      if (moneda !== "USD") {
        result.USD = totalUsd;
      }
    }
    return result;
  }, [totalUsd, totalPedido, moneda, tasas]);

  // Cálculos con conversión multi-moneda
  const { totalPagadoEnMoneda, vuelto, faltante, pagosCompletos, pagosDetalle } = useMemo(() => {
    let totalEnMonedaPedido = 0;
    let totalEfectivoEnMonedaPedido = 0;

    const detalle = pagos.map((p) => {
      const montoNum = Number(p.monto) || 0;
      if (montoNum <= 0) return { ...p, montoConvertido: 0, sinTasa: false };

      let convertido = montoNum;
      let sinTasa = false;

      if (p.moneda !== moneda) {
        const conv = convertir(montoNum, p.moneda, moneda, tasas);
        if (conv === null) {
          sinTasa = true;
          convertido = 0;
        } else {
          convertido = conv;
        }
      }

      totalEnMonedaPedido += convertido;

      const esEfectivo = p.metodo?.startsWith("efectivo_");
      if (esEfectivo) totalEfectivoEnMonedaPedido += convertido;

      return { ...p, montoConvertido: convertido, sinTasa };
    });

    const diferencia = totalEnMonedaPedido - totalPedido;
    let vueltoCalculado = 0;
    if (diferencia > 0) {
      vueltoCalculado = Math.min(diferencia, totalEfectivoEnMonedaPedido);
    }

    return {
      totalPagadoEnMoneda: totalEnMonedaPedido,
      vuelto: vueltoCalculado,
      faltante: diferencia < 0 ? Math.abs(diferencia) : 0,
      pagosCompletos: totalEnMonedaPedido >= totalPedido && totalPedido > 0,
      pagosDetalle: detalle,
    };
  }, [pagos, totalPedido, moneda, tasas]);

  // ─── Handlers ───────────────────────────────────────────────

  const handleAddPago = () => {
    if (pagos.length >= MAX_PAGOS) return;
    const metodoDefault = moneda === "USD" ? "efectivo_usd" : moneda === "BRL" ? "efectivo_brl" : "efectivo_pyg";
    setPagos([...pagos, { metodo: metodoDefault, monto: "", moneda, referencia: "" }]);
  };

  const handleRemovePago = (index) => setPagos(pagos.filter((_, i) => i !== index));

  const handleMetodoChange = (index, metodo) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index] = {
      ...nuevosPagos[index],
      metodo,
      moneda: getMonedaForMetodo(metodo) || moneda,
    };
    setPagos(nuevosPagos);
  };

  const handleMontoChange = (index, monto) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index] = { ...nuevosPagos[index], monto };
    setPagos(nuevosPagos);
  };

  const handleReferenciaChange = (index, referencia) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index] = { ...nuevosPagos[index], referencia };
    setPagos(nuevosPagos);
  };

  const handleFieldChange = (index, field, value) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index] = { ...nuevosPagos[index], [field]: value };
    setPagos(nuevosPagos);
  };

  const handleAutoCompletar = (index) => {
    if (faltante <= 0) return;
    const monedaPago = pagos[index].moneda;
    let montoEnMonedaPago = faltante;

    if (monedaPago !== moneda) {
      const convertido = convertir(faltante, moneda, monedaPago, tasas);
      if (convertido === null) {
        showToast(`No hay tipo de cambio para ${moneda}→${monedaPago}`, "error");
        return;
      }
      montoEnMonedaPago = monedaPago === "PYG" ? Math.ceil(convertido) : Math.ceil(convertido * 100) / 100;
    }

    const nuevosPagos = [...pagos];
    const montoActual = Number(nuevosPagos[index].monto) || 0;
    nuevosPagos[index] = { ...nuevosPagos[index], monto: String(montoActual + montoEnMonedaPago) };
    setPagos(nuevosPagos);
  };

  // ─── Confirmar cobro ────────────────────────────────────────

  const handleConfirmarCobro = async () => {
    if (!pagosCompletos) return;

    for (const pago of pagos) {
      if (pago.metodo.startsWith("cheque_") && Number(pago.monto) > 0) {
        if (!pago.cheque_banco_emisor || !pago.cheque_numero || !pago.cheque_fecha_emision || !pago.cheque_fecha_cobro) {
          showToast("Completá todos los datos obligatorios del cheque (banco, número, fechas).", "error");
          return;
        }
        if (!pago.cheque_es_cruzado || !pago.cheque_montos_correctos || !pago.cheque_beneficiario_correcto || !pago.cheque_no_negociable) {
          showToast("Todas las verificaciones del cheque deben estar marcadas.", "error");
          return;
        }
      }
      if ((pago.metodo === "tarjeta_credito" || pago.metodo === "tarjeta_debito") && Number(pago.monto) > 0) {
        if (!pago.terminal_pos_id && terminales.length > 0) {
          showToast("Seleccioná el terminal POS para el pago con tarjeta.", "error");
          return;
        }
      }
    }

    const pagosData = pagos
      .filter((p) => Number(p.monto) > 0)
      .map((p) => {
        const base = {
          metodo: p.metodo,
          monto: Number(p.monto),
          moneda: p.moneda,
          referencia: p.referencia || "",
        };
        if (p.metodo.startsWith("cheque_")) {
          base.cheque_banco_emisor = p.cheque_banco_emisor || "";
          base.cheque_numero = p.cheque_numero || "";
          base.cheque_librador = p.cheque_librador || "";
          base.cheque_fecha_emision = p.cheque_fecha_emision || null;
          base.cheque_fecha_cobro = p.cheque_fecha_cobro || null;
          base.cheque_es_cruzado = !!p.cheque_es_cruzado;
          base.cheque_montos_correctos = !!p.cheque_montos_correctos;
          base.cheque_beneficiario_correcto = !!p.cheque_beneficiario_correcto;
          base.cheque_no_negociable = !!p.cheque_no_negociable;
          base.cheque_observaciones = p.cheque_observaciones || "";
          base.referencia = `Cheque #${p.cheque_numero} - ${p.cheque_banco_emisor}`;
        }
        if ((p.metodo === "tarjeta_credito" || p.metodo === "tarjeta_debito") && p.terminal_pos_id) {
          base.terminal_pos_id = p.terminal_pos_id;
        }
        return base;
      });

    try {
      const result = await ejecutarCobro(pedido.id, { pagos: pagosData, emitir_factura: emitirFactura });
      setResultado(result);
    } catch (err) {
      const mensaje = err?.data?.detail || err?.data?.non_field_errors?.[0] || err?.message || "Error al procesar el cobro";
      showToast(mensaje, "error");
    }
  };

  // ─── Vista de resultado exitoso ─────────────────────────────

  if (resultado) {
    return (
      <ResultadoCobro
        resultado={resultado}
        moneda={moneda}
        totalPedido={totalPedido}
        vuelto={vuelto}
        onClose={() => { onSuccess?.(resultado); onClose(); }}
      />
    );
  }

  // ─── Vista principal ────────────────────────────────────────

  return (
    <Modal open onClose={onClose} title="Cobrar Pedido" size="lg">
      <div className="max-h-[75vh] overflow-y-auto">
        {/* Info del pedido */}
        <InfoPedido pedido={pedido} moneda={moneda} totalPedido={totalPedido} />

        {/* Métodos de pago */}
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center justify-between">
            <Text variant="label">Pagos</Text>
            {Object.keys(tasas).length > 0 && (
              <div className="flex items-center gap-2">
                {Object.entries(tasas).map(([par, valor]) => (
                  <Text key={par} variant="mono" as="span" className="bg-slate-100 px-1.5 py-0.5 rounded !text-[9px]">
                    {par}: {formatMonto(valor, par.split("/")[1])}
                  </Text>
                ))}
              </div>
            )}
          </div>

          {cargandoTasas && (
            <Text variant="mutedXs" className="text-center py-2">Cargando tipos de cambio...</Text>
          )}

          {pagos.length === 0 && !cargandoTasas && (
            <div className="flex flex-col items-center gap-2 py-6 text-slate-400">
              <CreditCard size={28} strokeWidth={1.5} />
              <Text variant="bodyXs" className="text-center">
                Agregá al menos un pago para confirmar el cobro.
              </Text>
            </div>
          )}

          <div className="space-y-3">
            {pagos.map((pago, index) => (
              <PagoItem
                key={index}
                pago={pago}
                index={index}
                moneda={moneda}
                faltante={faltante}
                detalle={pagosDetalle[index]}
                terminales={terminales}
                onMetodoChange={handleMetodoChange}
                onMontoChange={handleMontoChange}
                onReferenciaChange={handleReferenciaChange}
                onFieldChange={handleFieldChange}
                onRemove={handleRemovePago}
                onAutoCompletar={handleAutoCompletar}
              />
            ))}
          </div>

          {/* Agregar pago */}
          {pagos.length < MAX_PAGOS && (
            <Button variant="outline" size="sm" onClick={handleAddPago} icon={Plus}>
              Agregar Pago
            </Button>
          )}

          {/* Tipo de comprobante */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <Text variant="label">Documento a emitir</Text>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEmitirFactura(false)}
                className={cn(
                  "flex-1 p-3 rounded-xl border-2 text-left transition-all",
                  !emitirFactura ? "border-purple-400 bg-purple-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Receipt size={14} className={!emitirFactura ? "text-purple-600" : "text-slate-400"} />
                  <Text variant="bodySmBold" as="span" className={!emitirFactura ? "!text-purple-700" : "!text-slate-600"}>
                    Solo Comprobante
                  </Text>
                </div>
                <Text variant="mutedXs" className="!text-[10px]">
                  Comprobante interno sin validez fiscal
                </Text>
              </button>
              <button
                type="button"
                onClick={() => setEmitirFactura(true)}
                className={cn(
                  "flex-1 p-3 rounded-xl border-2 text-left transition-all",
                  emitirFactura ? "border-purple-400 bg-purple-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <FileText size={14} className={emitirFactura ? "text-purple-600" : "text-slate-400"} />
                  <Text variant="bodySmBold" as="span" className={emitirFactura ? "!text-purple-700" : "!text-slate-600"}>
                    Comprobante + Factura
                  </Text>
                </div>
                <Text variant="mutedXs" className="!text-[10px]">
                  Emite factura legal con timbrado de la SET
                </Text>
              </button>
            </div>
          </div>

          {/* Resumen */}
          <ResumenCobro
            totalPedido={totalPedido}
            totalUsd={totalUsd}
            totalesMultimoneda={totalesMultimoneda}
            moneda={moneda}
            tasas={tasas}
            totalPagadoEnMoneda={totalPagadoEnMoneda}
            faltante={faltante}
            vuelto={vuelto}
            pagosCompletos={pagosCompletos}
            pagos={pagos}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
        <Button variant="ghost" onClick={onClose} disabled={cobrando}>
          Cancelar
        </Button>
        <Button
          variant="success"
          onClick={handleConfirmarCobro}
          disabled={!pagosCompletos || cobrando}
          icon={CheckCircle}
        >
          {cobrando ? "Procesando..." : "Confirmar Cobro"}
        </Button>
      </div>
    </Modal>
  );
}
