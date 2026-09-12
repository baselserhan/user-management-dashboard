import { AlertCircle } from "lucide-react";

// Wraps an input/select so a required-but-empty field gets a red border
// and an exclamation mark, without duplicating that markup everywhere.
export default function FieldWrap({ hasError, children, C }) {
  return (
    <div className="relative">
      {children}
      {hasError && (
        <AlertCircle
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: C.red }}
        />
      )}
    </div>
  );
}

export function fieldBorder(hasError, C) {
  return `1px solid ${hasError ? C.red : C.border}`;
}
