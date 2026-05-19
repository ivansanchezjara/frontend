"use client";
import Button from '../basics/Button';
import { Heading, Text } from '../basics/Typography';

/**
 * Componente EmptyState estandarizado.
 * Presenta una interfaz de "sin resultados" o "vacía" consistente
 * utilizando los componentes atómicos del sistema (Button, Typography)
 * y permitiendo iconos personalizables.
 * 
 * @param {Object} props
 * @param {String} props.titulo - Título principal del estado vacío
 * @param {String} props.descripcion - Mensaje de descripción explicativo
 * @param {Function} props.onAction - Función callback opcional para un botón de acción rápida
 * @param {String} props.textoBoton - Etiqueta de texto para el botón de acción
 * @param {String|React.ReactNode} props.icon - Emojis o elemento visual a renderizar (default: 🔍)
 */
export default function EmptyState({ 
    titulo = "No se encontraron resultados", 
    descripcion = "Parece que no hay información para mostrar en este momento.", 
    onAction = null, 
    textoBoton = "Crear",
    icon = "🔍"
}) {
    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-16 text-center flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300 w-full">
            <span className="text-6xl mb-4 select-none">{icon}</span>
            
            <Heading level={4} className="text-slate-900 mb-2 font-black">
                {titulo}
            </Heading>
            
            <Text variant="bodySm" className="text-slate-500 max-w-sm mx-auto leading-relaxed">
                {descripcion}
            </Text>
            
            {onAction && (
                <Button
                    variant="secondary"
                    onClick={onAction}
                    className="mt-6 px-6 h-11 text-xs font-bold uppercase tracking-widest rounded-xl hover:text-slate-900"
                >
                    {textoBoton}
                </Button>
            )}
        </div>
    );
}
