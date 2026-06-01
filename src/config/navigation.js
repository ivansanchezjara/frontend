// src/config/navigation.js

// 1. DICCIONARIO CENTRAL DE FAMILIAS Y ESTILOS
export const familyStyles = {
  slate: {
    // Para el menú General / Dashboard
    label: "General",
    activeNav: "bg-slate-700 shadow-sm text-white",
  },
  emerald: {
    label: "Comercial y Ventas",
    activeNav: "bg-emerald-600 shadow-sm text-white", // <--- Estilo para el menú lateral
    borderHover: "hover:border-emerald-500", // <--- Estilos para el Dashboard
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    groupHoverBg: "group-hover:bg-emerald-600",
    line: "bg-emerald-200",
  },
  blue: {
    label: "Operaciones y Logística",
    activeNav: "bg-blue-600 shadow-sm text-white",
    borderHover: "hover:border-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-600",
    groupHoverBg: "group-hover:bg-blue-600",
    line: "bg-blue-200",
  },
  purple: {
    label: "Finanzas y Control",
    activeNav: "bg-purple-600 shadow-sm text-white",
    borderHover: "hover:border-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-600",
    groupHoverBg: "group-hover:bg-purple-600",
    line: "bg-purple-200",
  },
  amber: {
    label: "Equipo y Administración",
    activeNav: "bg-amber-600 shadow-sm text-white",
    borderHover: "hover:border-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-600",
    groupHoverBg: "group-hover:bg-amber-600",
    line: "bg-amber-200",
  },
};

// 2. ORDEN DE RENDERIZADO
export const ordenFamilias = ["emerald", "blue", "purple", "amber"];

// --- TUS ARRAYS SIGUEN IGUAL ABAJO ---

export const modulosActivos = [
  {
    href: "/catalogo",
    icon: "📖",
    title: "Catálogo Master",
    desc: "Gestión de productos, fotos y descripciones.",
    color: "emerald",
    roles: ["Admin", "gestorDeCatalogo"],
  },
  {
    href: "/inventario/stock",
    icon: "📦",
    title: "Stock y Disponibilidad",
    desc: "Consulta rápida de existencias, vencimientos y ubicaciones.",
    color: "blue",
    roles: ["Admin", "gestorDeDeposito"],
  },
  {
    href: "/movimientos",
    icon: "🏢",
    title: "Gestión de Movimientos",
    desc: "Carga de ingresos, consignaciones y ajustes comerciales.",
    color: "blue",
    roles: ["Admin", "gestorDeDeposito"],
  },
  {
    href: "/ventas-crm",
    icon: "🤝",
    title: "Ventas y CRM",
    desc: "Seguimiento de clientes, cotizaciones y gestión comercial.",
    color: "emerald",
    roles: ["Admin", "vendedor"],
  },
  {
    href: "/media-manager",
    icon: "🖼️",
    title: "Gestor de Medios",
    desc: "Almacenamiento y Archivos de la plataforma.",
    color: "emerald",
    roles: ["Admin"],
  },
  {
    href: "/caja",
    icon: "🧾",
    title: "Caja y Facturación",
    desc: "Cobro de pedidos, sesiones de caja y facturación.",
    color: "purple",
    roles: ["Admin", "cajero"],
  },
];

export const modulosFuturos = [
  {
    icon: "💳",
    title: "Cobranzas",
    desc: "Gestión de cuentas por cobrar y conciliación de clientes.",
    color: "purple",
    roles: ["Admin"],
  },
  {
    icon: "📊",
    title: "Finanzas y Gastos",
    desc: "Flujo de caja, gastos fijos y rentabilidad macro.",
    color: "purple",
    roles: ["Admin"],
  },
  {
    icon: "🔧",
    title: "Asistencia Técnica",
    desc: "Servicio post-venta y reparaciones de equipos.",
    color: "blue",
    roles: ["Admin"],
  },
  {
    icon: "👥",
    title: "Recursos Humanos",
    desc: "Legajos, asistencia y gestión de equipo.",
    color: "amber",
    roles: ["Admin"],
  },
];

export const navItems = [
  {
    category: "General",
    href: "/dashboard",
    icon: "🏠",
    label: "Panel Principal",
    type: "active",
    color: "slate",
  },
  {
    category: "Comercial",
    href: "/catalogo",
    icon: "📖",
    label: "Catálogo Master",
    type: "active",
    color: "emerald",
    roles: ["Admin", "gestorDeCatalogo"],
  },
  {
    category: "Comercial",
    href: "/ventas-crm",
    icon: "🤝",
    label: "Ventas y CRM",
    type: "active",
    color: "emerald",
    roles: ["Admin", "vendedor"],
  },
  {
    category: "Finanzas",
    href: "/caja",
    icon: "🧾",
    label: "Caja y Facturación",
    type: "active",
    color: "purple",
    roles: ["Admin", "cajero"],
    children: [
      {
        href: "/caja/cola",
        icon: "🧾",
        label: "Cola de Cobro",
        roles: ["Admin", "cajero"],
      },
      {
        href: "/caja/sesiones",
        icon: "💰",
        label: "Sesiones de Caja",
        roles: ["Admin", "cajero"],
      },
      {
        href: "/caja/entrega",
        icon: "📦",
        label: "Entrega de Mercadería",
        roles: ["Admin", "gestorDeDeposito"],
      },
      {
        href: "/caja/facturas",
        icon: "📄",
        label: "Facturas y Comprobantes",
        roles: ["Admin", "cajero"],
      },
      {
        href: "/caja/timbrados",
        icon: "🔖",
        label: "Timbrados",
        roles: ["Admin"],
      },
    ],
  },
  {
    category: "Operaciones",
    href: "/inventario/stock",
    icon: "📦",
    label: "Stock y Disponibilidad",
    type: "active",
    color: "blue",
    roles: ["Admin", "gestorDeDeposito"],
  },
  {
    category: "Operaciones",
    href: "/movimientos",
    icon: "🏢",
    label: "Gestión de Movimientos",
    type: "active",
    color: "blue",
    roles: ["Admin", "gestorDeDeposito"],
  },
  {
    category: "Comercial",
    href: "/media-manager",
    icon: "🖼️",
    label: "Gestor de Medios",
    type: "active",
    color: "emerald",
    roles: ["Admin", "gestorDeCatalogo"],
  },
  {
    category: "Operaciones",
    label: "Asistencia Técnica",
    icon: "🔧",
    type: "future",
    color: "blue",
    roles: ["Admin"],
  },
  {
    category: "Finanzas",
    label: "Cobranzas",
    icon: "💳",
    type: "future",
    color: "purple",
    roles: ["Admin"],
  },
  {
    category: "Finanzas",
    label: "Finanzas y Gastos",
    icon: "📊",
    type: "future",
    color: "purple",
    roles: ["Admin"],
  },
  {
    category: "Equipo",
    label: "Recursos Humanos",
    icon: "👥",
    type: "future",
    color: "amber",
    roles: ["Admin"],
  },
];
