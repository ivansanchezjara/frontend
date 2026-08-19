"use client";
import { MessageCircle, Camera, MessagesSquare } from "lucide-react";

const CANALES = {
  whatsapp: {
    icon: MessageCircle,
    color: "text-green-600",
    bg: "bg-green-50",
    label: "WhatsApp",
  },
  instagram: {
    icon: Camera,
    color: "text-pink-600",
    bg: "bg-pink-50",
    label: "Instagram",
  },
  messenger: {
    icon: MessagesSquare,
    color: "text-blue-600",
    bg: "bg-blue-50",
    label: "Messenger",
  },
};

export default function CanalIcon({ canal, size = 14, showLabel = false, className = "" }) {
  const config = CANALES[canal] || CANALES.whatsapp;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Icon size={size} className={config.color} />
      {showLabel && (
        <span className={`text-xs ${config.color}`}>{config.label}</span>
      )}
    </span>
  );
}

export function CanalBadge({ canal }) {
  const config = CANALES[canal] || CANALES.whatsapp;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.bg} ${config.color}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}
