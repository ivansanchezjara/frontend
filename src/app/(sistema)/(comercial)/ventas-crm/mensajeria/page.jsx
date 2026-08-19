"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { LoadingScreen, PageHeader } from "@/components/ui";
import { useApi } from "@/hooks/useApi";
import { getConversaciones } from "@/services/apis/mensajeria";
import ListaConversaciones from "@/components/comercial/mensajeria/ListaConversaciones";
import PanelChat from "@/components/comercial/mensajeria/PanelChat";
import EmptyChat from "@/components/comercial/mensajeria/EmptyChat";
import MetricasMensajeria from "@/components/comercial/mensajeria/MetricasMensajeria";

const TIPOS_MENSAJERIA = ["whatsapp", "instagram", "messenger"];
const POLLING_INTERVAL = 15000; // 15 segundos

export default function MensajeriaPage() {
  const [contactoActivo, setContactoActivo] = useState(null);
  const [filtroCanal, setFiltroCanal] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaDebounced, setBusquedaDebounced] = useState("");
  const pollingRef = useRef(null);

  // Debounce de búsqueda (400ms)
  useEffect(() => {
    const timer = setTimeout(() => setBusquedaDebounced(busqueda), 400);
    return () => clearTimeout(timer);
  }, [busqueda]);

  // Cargar conversaciones
  const {
    data: conversacionesData,
    loading,
    error,
    execute: cargarConversaciones,
  } = useApi(getConversaciones, { auto: false, handleError: false });

  // Función de carga con params actuales
  const fetchConversaciones = useCallback(() => {
    const params = { page_size: 100 };
    if (filtroCanal) {
      params.tipo = filtroCanal;
    }
    if (busquedaDebounced) {
      params.search = busquedaDebounced;
    }
    cargarConversaciones(params);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroCanal, busquedaDebounced]);

  // Fetch inicial y cuando cambian filtros
  useEffect(() => {
    fetchConversaciones();
  }, [fetchConversaciones]);

  // Polling: auto-refresh cada 15s
  useEffect(() => {
    pollingRef.current = setInterval(fetchConversaciones, POLLING_INTERVAL);
    return () => clearInterval(pollingRef.current);
  }, [fetchConversaciones]);

  // Agrupar mensajes por contacto
  const conversaciones = agruparPorContacto(conversacionesData?.results || []);

  const handleSeleccionarContacto = useCallback((contacto) => {
    setContactoActivo(contacto);
  }, []);

  const handleMensajeEnviado = useCallback(() => {
    fetchConversaciones();
  }, [fetchConversaciones]);

  // ─── Render ─────────────────────────────────────────────────────

  if (loading && !conversacionesData) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <PageHeader
        breadcrumbs={[
          { label: "Ventas y CRM", href: "/ventas-crm" },
          { label: "Mensajería" },
        ]}
        subtitle="Conversaciones de WhatsApp, Instagram y Messenger"
      >
        <button
          onClick={fetchConversaciones}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Actualizar conversaciones"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </PageHeader>

      {/* Métricas resumidas */}
      <MetricasMensajeria />

      <div className="flex flex-1 overflow-hidden border border-gray-200 rounded-lg bg-white mx-4 mb-4">
        {/* Panel izquierdo: Lista de conversaciones */}
        <ListaConversaciones
          conversaciones={conversaciones}
          contactoActivo={contactoActivo}
          onSeleccionar={handleSeleccionarContacto}
          filtroCanal={filtroCanal}
          onFiltroCanal={setFiltroCanal}
          busqueda={busqueda}
          onBusqueda={setBusqueda}
          loading={loading}
          error={error}
        />

        {/* Panel derecho: Chat activo */}
        {contactoActivo ? (
          <PanelChat
            contacto={contactoActivo}
            onMensajeEnviado={handleMensajeEnviado}
          />
        ) : (
          <EmptyChat />
        )}
      </div>
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

/**
 * Agrupa las interacciones por cliente/contacto para mostrar
 * una lista de conversaciones únicas con el último mensaje.
 */
function agruparPorContacto(interacciones) {
  const mapa = {};

  for (const interaccion of interacciones) {
    if (!TIPOS_MENSAJERIA.includes(interaccion.tipo)) {
      continue;
    }

    const key = interaccion.cliente
      ? `cliente-${interaccion.cliente}`
      : `oportunidad-${interaccion.oportunidad}`;

    if (!mapa[key]) {
      mapa[key] = {
        id: key,
        cliente_id: interaccion.cliente,
        oportunidad_id: interaccion.oportunidad,
        nombre: interaccion.cliente_razon_social || interaccion.oportunidad_titulo || "Sin nombre",
        ultimo_mensaje: interaccion.resumen,
        ultimo_tipo: interaccion.tipo,
        ultima_fecha: interaccion.fecha,
        direccion: interaccion.direccion,
        cantidad_mensajes: 0,
      };
    }

    mapa[key].cantidad_mensajes++;

    // Actualizar último mensaje si es más reciente
    if (interaccion.fecha > mapa[key].ultima_fecha) {
      mapa[key].ultimo_mensaje = interaccion.resumen;
      mapa[key].ultimo_tipo = interaccion.tipo;
      mapa[key].ultima_fecha = interaccion.fecha;
      mapa[key].direccion = interaccion.direccion;
    }
  }

  return Object.values(mapa).sort(
    (a, b) => new Date(b.ultima_fecha) - new Date(a.ultima_fecha)
  );
}
