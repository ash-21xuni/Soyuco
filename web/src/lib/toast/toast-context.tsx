"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ICONS: Record<ToastType, string> = {
  success: "✅",
  error: "❌",
  info: "✨",
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState<ToastType>("success");
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(message);
    setType(type);
    setVisible(true);
    timeoutRef.current = setTimeout(() => setVisible(false), 5000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: "var(--surface)",
          border: "1px solid var(--accent)",
          borderRadius: "var(--radius-lg)",
          padding: "12px 20px",
          boxShadow: "var(--shadow-lg)",
          zIndex: 1000,
          transform: visible ? "translateX(0)" : "translateX(400px)",
          transition: "transform 0.3s ease",
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: "var(--font-ui)",
          fontSize: "0.85rem",
          color: "var(--text)",
        }}
      >
        <span>{ICONS[type]}</span>
        <span>{message}</span>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
