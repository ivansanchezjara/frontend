export default function BrandMark({
  showIcon = true,
  showText = true,
  size = "md",
  tone = "dark",
  className = "",
  iconClassName = "",
  textClassName = "",
}) {
  const sizes = {
    sm: {
      icon: "h-7 w-7 text-sm",
      text: "text-base",
      gap: "gap-2.5",
    },
    md: {
      icon: "h-7 w-7 text-sm",
      text: "text-lg",
      gap: "gap-2.5",
    },
    lg: {
      icon: "h-9 w-9 text-base",
      text: "text-2xl",
      gap: "gap-3",
    },
  };

  const tones = {
    dark: {
      icon: "bg-blue-500 text-white shadow-blue-500/20",
      text: "text-slate-900",
    },
    light: {
      icon: "bg-blue-500 text-white shadow-blue-500/20",
      text: "text-white",
    },
  };

  const sizeStyles = sizes[size] || sizes.md;
  const toneStyles = tones[tone] || tones.dark;

  return (
    <span className={`inline-flex items-center ${sizeStyles.gap} ${className}`}>
      {showIcon && (
        <span
          className={`flex shrink-0 items-center justify-center rounded-md font-black shadow-lg ${sizeStyles.icon} ${toneStyles.icon} ${iconClassName}`}
        >
          E
        </span>
      )}
      {showText && (
        <span
          className={`font-black tracking-tight ${sizeStyles.text} ${toneStyles.text} ${textClassName}`}
        >
          ERP<span className="text-blue-500">.</span>CORE
        </span>
      )}
    </span>
  );
}
