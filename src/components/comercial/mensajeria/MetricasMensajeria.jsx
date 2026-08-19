"use client";
import { useEffect } from "react";
import { MessageCircle, Clock, Users, AlertTriangle } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { getMetricasMensajeria } from "@/services/apis/mensajeria";

/**
 * Panel de métricas resumidas de mensajería.
 * Muestra stats clave: mensajes entrantes, tiempo de respuesta,
 * conversaciones activas, sin responder.
 */
export default function MetricasMensajeria() {
  const { data: metricas, execute: cargarMetricas } = useApi(getMetricasMensajeria, {
    auto: false,
    handleError: false,
  });

  useEffect(() => {
    cargarMetricas({ dias: 7 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!metricas) return null;

  const stats = [
    {
      label: "Entrantes",
      value: metricas.total_entrantes,
      icon: MessageCircle,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Tiempo respuesta",
      value: metricas.tiempo_respuesta_promedio_minutos
        ? `${metricas.tiempo_respuesta_promedio_minutos}m`
        : "—",
      icon: Clock,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "Conversaciones",
      value: metricas.conversaciones_activas,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Sin responder",
      value: metricas.sin_responder,
      icon: AlertTriangle,
      color: metricas.sin_responder > 0 ? "text-red-600" : "text-gray-400",
      bg: metricas.sin_responder > 0 ? "bg-red-50" : "bg-gray-50",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3 px-4 py-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${stat.bg}`}
        >
          <stat.icon size={16} className={stat.color} />
          <div>
            <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
