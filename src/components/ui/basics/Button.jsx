import { cn } from "@/lib/utils";

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  type = 'button',
  as: Component = 'button',
  ...props
}) {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer";

  const variants = {
    // A los botones sin borde, les agregamos 'border-2 border-transparent'
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm shadow-blue-200 border-2 border-transparent",

    // Si secondary usa border normal (1px), cámbialo a border-2 para que coincida con outline
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-500 border-2 border-slate-200",

    // Outline ya tiene border-2
    outline: "border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 focus:ring-slate-500",

    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-500 border-2 border-transparent",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm shadow-red-200 border-2 border-transparent",

    // Aquí está el arreglo para tu botón "+ NUEVO PRODUCTO"
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm shadow-emerald-200 border-2 border-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
    icon: "p-2", // Para botones que son solo un icono
  };

  const variantStyles = variants[variant] || variants.primary;
  const sizeStyles = sizes[size] || sizes.md;

  const componentProps = Component === 'button' ? { type, disabled, ...props } : props;

  return (
    <Component
      className={cn(baseStyles, variantStyles, sizeStyles, className)}
      {...componentProps}
    >
      {Icon && iconPosition === 'left' && <Icon size={size === 'sm' || size === 'icon' ? 16 : 20} className="shrink-0" />}
      {children}
      {Icon && iconPosition === 'right' && <Icon size={size === 'sm' || size === 'icon' ? 16 : 20} className="shrink-0" />}
    </Component>
  );
}

export default Button;
