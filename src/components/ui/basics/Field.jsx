import { useId } from "react";
import { Text } from "./Typography";
import { cn } from "@/lib/utils";

export default function Field({ label, hint, error, children, className, id: externalId }) {
  const generatedId = useId();
  const fieldId = externalId || generatedId;
  const errorId = error ? `${fieldId}-error` : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Text as="label" variant="label" htmlFor={fieldId}>
        {label}
      </Text>
      {typeof children === "function"
        ? children({ id: fieldId, "aria-describedby": errorId, "aria-invalid": !!error })
        : children}
      {error && (
        <Text id={errorId} variant="bodySm" className="text-xs text-red-500">
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text variant="bodySm" className="text-[11px] text-slate-400">
          {hint}
        </Text>
      )}
    </div>
  );
}
