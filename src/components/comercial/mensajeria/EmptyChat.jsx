"use client";
import { MessageSquare } from "lucide-react";

export default function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
      <MessageSquare className="h-16 w-16 mb-4 text-gray-300" />
      <h3 className="text-lg font-medium text-gray-500">
        Seleccioná una conversación
      </h3>
      <p className="text-sm mt-1 text-center max-w-xs">
        Elegí un contacto de la lista para ver el historial de mensajes y responder.
      </p>
    </div>
  );
}
