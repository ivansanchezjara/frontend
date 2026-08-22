"use client";
import { useState, useMemo, useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { getColaCobroDetalle, cobrarPedido, getTerminalesPOS } from "@/services/apis/caja";
import { getTipoCambioVigente } from "@/services/apis/ventas";
import { getMonedaForMetodo, convertir } from "./utils";

/**
 * Hook que encapsula toda la lógica de estado y cálculos del flujo de cobro.
 */
export function useCobro(id, showToast) {
  // ─── Cargar datos del pedido ─────────────────────────────────
  const { data: pedido, loading: loadingPedido, error: errorPedido } = useApi(
    getColaCobroDetalle,
    { auto: true, args: [id] }
  );

  // ─── Tasas de cambio ─────────────────────────────────────────
  const [tasas, setTasas] = useState({});
  const [cargandoTasas, setCargandoTasas] = useState(true);

  // ─── Terminales POS ──────────────────────────────────────────
  const [terminales, setTerminales] = useState([]);

  useEffect(() => {
    async function cargarTasas() {
      const pares = ["USD/PYG", "USD/BRL"];
      const resultado = {};
      for (const par of pares) {
        try {
          const tc = await getTipoCambioVigente(par);
          if (tc?.valor) resultado[par] = parseFloat(tc.valor);
        } catch { /* sin tasa disponible */ }
      }
      setTasas(resultado);
      setCargandoTasas(false);
    }
    async function cargarTerminales() {
      try {
        const data = await getTerminalesPOS();
        setTerminales(data?.results || data || []);
      } catch { /* sin terminales */ }
    }
    cargarTasas();
    cargarTerminales();
  }, []);

  // ─── Estado de cobro ─────────────────────────────────────────
  const { execute: ejecutarCobro, loading: cobrando } = useApi(cobrarPedido, {
    handleError: false,
  });

  const [emitirFactura, setEmitirFactura] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [mostrarVueltoModal, setMostrarVueltoModal] = useState(false);
  const [vueltosConfirmados, setVueltosConfirmados] = useState([]);
  const [datosFactura, setDatosFactura] = useState({ ruc: "", razon_social: "" });

  // Inicializar pagos cuando se carga el pedido
  const [pagos, setPagos] = useState([]);
  const [pagosInicializados, setPagosInicializados] = useState(false);

  useEffect(() => {
    if (pedido && !pagosInicializados) {
      const monedaPedido = pedido.moneda_negociacion || "PYG";
      const metodoDefault = monedaPedido === "USD" ? "efectivo_usd" : monedaPedido === "BRL" ? "efectivo_brl" : "efectivo_pyg";

      if (pedido.pagos?.length > 0) {
        setPagos(pedido.pagos.map((p) => ({
          metodo: p.metodo || "efectivo_pyg",
          monto: p.monto?.toString() || "",
          moneda: p.moneda || monedaPedido,
          referencia: p.referencia || "",
        })));
      } else {
        setPagos([{ metodo: metodoDefault, monto: "", moneda: monedaPedido, referencia: "" }]);
      }
      setEmitirFactura(pedido.requiere_factura_legal ?? false);
      if (pedido.cliente_ruc) {
        setDatosFactura({
          ruc: pedido.cliente_ruc,
          razon_social: pedido.cliente_nombre || "",
        });
      }
      setPagosInicializados(true);
    }
  }, [pedido, pagosInicializados]);

  // ─── Valores derivados ───────────────────────────────────────
  const totalPedido = Number(pedido?.total_moneda_negociacion) || 0;
  const moneda = pedido?.moneda_negociacion || "PYG";
  const totalUsd = Number(pedido?.total_usd) || 0;

  // ─── Totales en 3 monedas ────────────────────────────────────
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

  // ─── Cálculos multi-moneda ───────────────────────────────────
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

  // ─── Handlers de pagos ───────────────────────────────────────

  const handleAddPago = () => {
    if (pagos.length >= 10) return;
    const metodoDefault = moneda === "USD" ? "efectivo_usd" : moneda === "BRL" ? "efectivo_brl" : "efectivo_pyg";
    setPagos([...pagos, { metodo: metodoDefault, monto: "", moneda, referencia: "" }]);
  };

  const handleRemovePago = (index) => setPagos(pagos.filter((_, i) => i !== index));

  const handleMetodoChange = (index, metodo) => {
    const nuevosPagos = [...pagos];
    nuevosPagos[index] = { ...nuevosPagos[index], metodo, moneda: getMonedaForMetodo(metodo) || moneda };
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

  // ─── Confirmar cobro ─────────────────────────────────────────

  const handleConfirmarCobro = () => {
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

    if (vuelto > 0) {
      setMostrarVueltoModal(true);
    } else {
      enviarCobro([]);
    }
  };

  const enviarCobro = async (vueltosData) => {
    const pagosData = pagos
      .filter((p) => Number(p.monto) > 0)
      .map((p) => {
        const base = { metodo: p.metodo, monto: Number(p.monto), moneda: p.moneda, referencia: p.referencia || "" };
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

    const payload = { pagos: pagosData, emitir_factura: emitirFactura };
    if (emitirFactura && datosFactura.ruc) {
      payload.datos_factura = { ruc: datosFactura.ruc.trim(), razon_social: datosFactura.razon_social.trim() };
    }
    if (vueltosData.length > 0) {
      payload.vueltos = vueltosData;
    }

    try {
      const result = await ejecutarCobro(id, payload);
      setVueltosConfirmados(vueltosData);
      setMostrarVueltoModal(false);
      setResultado(result);
    } catch (err) {
      const mensaje = err?.data?.detail || err?.data?.non_field_errors?.[0] || err?.message || "Error al procesar el cobro";
      showToast(mensaje, "error");
    }
  };

  return {
    // Data
    pedido, loadingPedido, errorPedido,
    tasas, cargandoTasas, terminales,
    moneda, totalPedido, totalUsd, totalesMultimoneda,
    // Pagos
    pagos, pagosDetalle, pagosCompletos,
    totalPagadoEnMoneda, faltante, vuelto,
    // Estado
    emitirFactura, setEmitirFactura,
    datosFactura, setDatosFactura,
    resultado, cobrando,
    mostrarVueltoModal, setMostrarVueltoModal,
    vueltosConfirmados,
    // Handlers
    handleAddPago, handleRemovePago,
    handleMetodoChange, handleMontoChange,
    handleReferenciaChange, handleFieldChange,
    handleAutoCompletar, handleConfirmarCobro, enviarCobro,
  };
}
