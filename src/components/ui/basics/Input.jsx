import { forwardRef, useId } from 'react';

import { Text } from './Typography';

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

  const baseInputStyles = "block rounded-lg border text-sm transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:bg-slate-50";
  const errorStyles = error
    ? "border-red-300 text-red-900 placeholder-red-300 focus:border-red-500 focus:ring-red-500"
    : "border-slate-300 text-slate-900 focus:border-blue-500 focus:ring-blue-500";

  const paddingStyles = Icon ? "pl-10 pr-4 py-2.5" : "px-4 py-2.5";
  const widthStyles = fullWidth ? "w-full" : "";

  return (
    <div className={`${widthStyles} flex flex-col gap-1.5`}>
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
          className={`${baseInputStyles} ${errorStyles} ${paddingStyles} ${widthStyles} ${className}`}
          {...props}
        />
      </div>
      {(error || helperText) && (
        <Text
          variant="bodySm"
          className={`mt-1 text-xs ${error ? 'text-red-500' : 'text-slate-500'}`}
        >
          {error || helperText}
        </Text>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
