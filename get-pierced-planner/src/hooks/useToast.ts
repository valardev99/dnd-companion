import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Minimal toast with proper timer hygiene: re-showing resets the timer and
 * unmounting clears it (the original mock leaked setTimeouts on both paths).
 */
export function useToast(durationMs = 1800): {
  toast: string | null;
  show: (message: string) => void;
} {
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string) => {
      if (timer.current) clearTimeout(timer.current);
      setToast(message);
      timer.current = setTimeout(() => setToast(null), durationMs);
    },
    [durationMs],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { toast, show };
}
