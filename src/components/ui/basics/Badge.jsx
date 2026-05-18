export function Badge({ children, variant = 'default', className = '', ...props }) {
  const baseStyles = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider";

  const variants = {
    default: "bg-slate-100 text-slate-800",
    primary: "bg-blue-100 text-blue-800",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-cyan-100 text-cyan-800",
  };

  const variantStyles = variants[variant] || variants.default;

  return (
    <span className={`${baseStyles} ${variantStyles} ${className}`} {...props}>
      {children}
    </span>
  );
}

export default Badge;
