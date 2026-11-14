import { useEffect } from "react";

/**
 * CustomCursor has been disabled/removed to keep the application lightweight
 * and use the native OS hardware cursor at all times.
 */
export function CustomCursor() {
  useEffect(() => {
    document.body.classList.remove("custom-cursor-active");
    try {
      localStorage.removeItem("racks-cursor-settings");
    } catch {
      // ignore
    }
  }, []);

  return null;
}
