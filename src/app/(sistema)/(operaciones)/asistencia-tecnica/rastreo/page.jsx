"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { MapPin, Battery, Gauge, Clock, User, Radio } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  PageHeader,
  Badge,
  Text,
  LoadingScreen,
} from "@/components/ui";
import { Heading } from "@/components/ui/basics/Typography";
import { getMapaTecnicos } from "@/services/apis/asistencia";

// Leaflet debe cargarse solo en el cliente (no SSR)
const MapaRastreo = dynamic(() => import("@/components/asistencia/MapaRastreo"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-slate-100 rounded-xl">
      <Text className="text-slate-400">Cargando mapa...</Text>
    </div>
  ),
});

// Polling interval en ms (30 segundos)
const POLLING_INTERVAL = 30000;

function formatTimestamp(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  const ahora = new Date();
  const diff = Math.floor((ahora - d) / 1000);
  if (diff < 60) return `Hace ${diff}s`;
  if (diff < 3600) return `Hace ${Math.floor(diff / 60)}min`;
  return d.toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" });
}

export default function RastreoPage() {
  const [tecnicos, setTecnicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTecnico, setSelectedTecnico] = useState(null);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await getMapaTecnicos();
      setTecnicos(data || []);
    } catch (err) {
      console.error("Error fetching tracking data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Polling
  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, POLLING_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  const enLinea = tecnicos.filter((t) => t.en_linea);
  const offline = tecnicos.filter((t) => !t.en_linea);

  if (loading) return <LoadingScreen texto="Cargando rastreo..." />;

  return (
    <div className="flex flex-col flex-1 h-screen overflow-hidden bg-slate-50/50">
      <PageHeader
        breadcrumbs={[
          { label: "Asistencia Técnica", href: "/asistencia-tecnica" },
          { label: "Rastreo en Vivo" },
        ]}
        subtitle={
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Text variant="bodyXs" className="font-bold text-emerald-600">
                {enLinea.length} en línea
              </Text>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <Text variant="bodyXs" className="text-slate-400">
                {offline.length} offline
              </Text>
            </span>
          </span>
        }
      >
        <Text variant="bodyXs" className="text-slate-400">
          Actualización cada 30s
        </Text>
      </PageHeader>

      <main className="flex-1 overflow-hidden flex min-w-0">
        {/* Sidebar: lista de técnicos */}
        <aside className="w-80 border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0">
          <div className="p-4 border-b border-slate-100">
            <Heading level={6} className="text-slate-700">Técnicos</Heading>
          </div>
          <div className="divide-y divide-slate-50">
            {tecnicos.length === 0 ? (
              <div className="p-6 text-center">
                <Text variant="bodyXs" className="text-slate-400 italic">
                  Sin ubicaciones reportadas.
                </Text>
              </div>
            ) : (
              tecnicos.map((t) => (
                <button
                  key={t.tecnico_id}
                  onClick={() => setSelectedTecnico(t)}
                  className={`w-full text-left p-3 hover:bg-slate-50 transition-colors ${
                    selectedTecnico?.tecnico_id === t.tecnico_id ? "bg-blue-50 border-l-2 border-blue-500" : ""
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${t.en_linea ? "bg-emerald-500" : "bg-slate-300"}`} />
                      <Text variant="bodyXs" className="font-bold text-slate-800">
                        {t.tecnico_nombre}
                      </Text>
                    </div>
                    {t.bateria != null && (
                      <span className="flex items-center gap-0.5">
                        <Battery size={10} className={t.bateria < 20 ? "text-red-500" : "text-slate-400"} />
                        <Text variant="bodyXs" className="text-slate-400">{t.bateria}%</Text>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Text variant="bodyXs" className="text-slate-400">
                      {formatTimestamp(t.timestamp)}
                    </Text>
                    {t.velocidad != null && t.velocidad > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Gauge size={10} className="text-slate-400" />
                        <Text variant="bodyXs" className="text-slate-400">
                          {Math.round(t.velocidad)} km/h
                        </Text>
                      </span>
                    )}
                  </div>
                  {t.orden_activa_numero && (
                    <div className="ml-4 mt-1">
                      <Badge variant="info" className="text-[9px]">
                        OT-{t.orden_activa_numero}: {t.orden_activa_cliente}
                      </Badge>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Mapa */}
        <div className="flex-1 relative">
          <MapaRastreo
            tecnicos={tecnicos}
            selectedTecnico={selectedTecnico}
            onSelectTecnico={setSelectedTecnico}
          />
        </div>
      </main>
    </div>
  );
}
