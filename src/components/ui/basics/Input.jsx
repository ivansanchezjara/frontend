import { forwardRef, useId } from 'react';
import { Text } from './Typography';
import { cn } from "@/lib/utils";

export const Input = forwardRef(({
  label,
  error,
  helperText,
  className = '',
  icon: Icon,
  fullWidth = true,
  ...props
}, ref) => {
  const id = useId();

  const baseInputStyles = "block rounded-xl border outline-none transition-all text-sm font-medium disabled:opacity-50 disabled:bg-slate-50";
  const errorStyles = error
    ? "border-red-300 bg-red-50 text-red-900 placeholder:text-red-300 focus:bg-white focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
    : "border-slate-200 bg-slate-50 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  const paddingStyles = Icon ? "pl-10 pr-3.5 py-2.5" : "px-3.5 py-2.5";
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <div className={cn("flex flex-col gap-1.5", widthStyles)}>
      {label && (
        <Text as="label" variant="label" htmlFor={id}>
          {label}
        </Text>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Icon size={18} />
          </div>
        )}
        <input
          id={id}
          ref={ref}
          className={cn(baseInputStyles, errorStyles, paddingStyles, widthStyles, className)}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <Text
          variant="bodySm"
          className={cn("mt-1 text-xs", error ? 'text-red-500' : 'text-slate-500')}
        >
          {error || helperText}
        </Text>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
