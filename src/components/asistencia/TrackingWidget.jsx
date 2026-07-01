"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Radio, Square, Navigation } from "lucide-react";
import { Text } from "@/components/ui/basics/Typography";
import {
  getEstadoTracking,
  iniciarTracking,
  detenerTracking,
  reportarUbicacion,
} from "@/services/apis/asistencia";
import { cn } from "@/lib/utils";

// Intervalo de envío de GPS en ms (30 segundos)
const GPS_INTERVAL = 30000;

/**
 * Widget flotante de tracking GPS para técnicos.
 * Se muestra solo si el usuario logueado tiene perfil de técnico.
 * Cuando el tracking está activo, envía la ubicación GPS cada 30s.
 */
export default function TrackingWidget() {
  const [estado, setEstado] = useState(null); // null = cargando
  const [trackingActivo, setTrackingActivo] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [ultimaUbicacion, setUltimaUbicacion] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const intervalRef = useRef(null);
  const watchRef = useRef(null);

  // Cargar estado inicial
  useEffect(() => {
    getEstadoTracking()
      .then((data) => {
        setEstado(data);
        setTrackingActivo(data.tracking_activo);
      })
      .catch(() => setEstado({ es_tecnico: false }));
  }, []);

  // Función para enviar ubicación
  const enviarUbicacion = useCallback(async (position) => {
    const data = {
      latitud: position.coords.latitude.toFixed(7),
      longitud: position.coords.longitude.toFixed(7),
      precision_metros: position.coords.accuracy || null,
      velocidad: position.coords.speed
        ? Math.round(position.coords.speed * 3.6) // m/s → km/h
        : null,
      bateria: null,
    };

    // Intentar obtener batería
    try {
      if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        data.bateria = Math.round(battery.level * 100);
      }
    } catch { /* ignorar */ }

    setUltimaUbicacion(data);
    setEnviando(true);
    try {
      await reportarUbicacion(data);
    } catch (err) {
      console.error("Error enviando ubicación:", err);
    } finally {
      setEnviando(false);
    }
  }, []);

  // Iniciar geolocalización continua
  const startGeoWatch = useCallback(() => {
    if (!navigator.geolocation) {
      setGpsError("Geolocalización no soportada en este navegador.");
      return;
    }

    setGpsError(null);

    // Enviar posición inmediatamente
    navigator.geolocation.getCurrentPosition(
      (pos) => enviarUbicacion(pos),
      (err) => setGpsError(err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Enviar cada 30 segundos
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => enviarUbicacion(pos),
        (err) => console.error("GPS error:", err),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }, GPS_INTERVAL);
  }, [enviarUbicacion]);

  // Detener geolocalización
  const stopGeoWatch = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (watchRef.current) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  }, []);

  // Manejar inicio/detención del tracking
  useEffect(() => {
    if (trackingActivo) {
      startGeoWatch();
    } else {
      stopGeoWatch();
    }
    return () => stopGeoWatch();
  }, [trackingActivo, startGeoWatch, stopGeoWatch]);

  const handleIniciar = async () => {
    try {
      await iniciarTracking("Salida de sucursal");
      setTrackingActivo(true);
    } catch (err) {
      console.error("Error al iniciar tracking:", err);
    }
  };

  const handleDetener = async () => {
    try {
      await detenerTracking("Regreso a sucursal");
      setTrackingActivo(false);
      setUltimaUbicacion(null);
    } catch (err) {
      console.error("Error al detener tracking:", err);
    }
  };

  // No renderizar si no es técnico o aún cargando
  if (!estado || !estado.es_tecnico) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Panel expandido */}
      {expanded && (
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-4 w-72 animate-in slide-in-from-bottom-2 fade-in duration-200">
          <div className="flex items-center justify-between mb-3">
            <Text className="font-bold text-slate-800 text-sm">
              Tracking GPS
            </Text>
            <span className={cn(
              "w-2.5 h-2.5 rounded-full",
              trackingActivo ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
            )} />
          </div>

          {gpsError && (
            <div className="mb-3 p-2 rounded-lg bg-red-50 border border-red-100">
              <Text variant="bodyXs" className="text-red-600">{gpsError}</Text>
            </div>
          )}

          {trackingActivo && ultimaUbicacion && (
            <div className="mb-3 p-2 rounded-lg bg-slate-50 space-y-0.5">
              <Text variant="bodyXs" className="text-slate-500">
                📍 {ultimaUbicacion.latitud}, {ultimaUbicacion.longitud}
              </Text>
              {ultimaUbicacion.precision_metros && (
                <Text variant="bodyXs" className="text-slate-400">
                  Precisión: ±{Math.round(ultimaUbicacion.precision_metros)}m
                </Text>
              )}
              {ultimaUbicacion.velocidad != null && ultimaUbicacion.velocidad > 0 && (
                <Text variant="bodyXs" className="text-slate-400">
                  Velocidad: {ultimaUbicacion.velocidad} km/h
                </Text>
              )}
              {enviando && (
                <Text variant="bodyXs" className="text-blue-500 font-semibold">
                  Enviando...
                </Text>
              )}
            </div>
          )}

          {trackingActivo ? (
            <button
              onClick={handleDetener}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-colors"
            >
              <Square size={14} />
              DETENER TRACKING
            </button>
          ) : (
            <button
              onClick={handleIniciar}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors"
            >
              <Navigation size={14} />
              INICIAR TRACKING
            </button>
          )}

          <Text variant="bodyXs" className="text-slate-400 text-center mt-2">
            {trackingActivo
              ? "Enviando ubicación cada 30 seg"
              : "Activá al salir de la sucursal"}
          </Text>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all",
          "hover:scale-105 active:scale-95",
          trackingActivo
            ? "bg-emerald-500 text-white ring-4 ring-emerald-200"
            : "bg-white text-slate-600 border border-slate-200 hover:border-blue-300"
        )}
        title={trackingActivo ? "Tracking activo" : "Tracking GPS"}
      >
        {trackingActivo ? (
          <Radio size={22} className="animate-pulse" />
        ) : (
          <MapPin size={22} />
        )}
      </button>
    </div>
  );
}
