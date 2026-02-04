"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

// Toast Types
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Icons for each toast type
const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

// Colors for each toast type
const toastStyles = {
  success: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    icon: "text-emerald-400",
    progress: "bg-emerald-500",
  },
  error: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: "text-red-400",
    progress: "bg-red-500",
  },
  warning: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    icon: "text-amber-400",
    progress: "bg-amber-500",
  },
  info: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    icon: "text-blue-400",
    progress: "bg-blue-500",
  },
};

// Single Toast Component
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [progress, setProgress] = useState(100);
  const duration = toast.duration || 5000;
  const Icon = toastIcons[toast.type];
  const styles = toastStyles[toast.type];

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        onRemove();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, onRemove]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`
        relative overflow-hidden
        w-80 rounded-lg border backdrop-blur-xl
        ${styles.bg} ${styles.border}
        shadow-lg shadow-black/20
      `}
    >
      <div className="flex items-start gap-3 p-4">
        <Icon className={`w-5 h-5 flex-shrink-0 ${styles.icon}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{toast.message}</p>
          {toast.description && (
            <p className="text-xs text-white/60 mt-1">{toast.description}</p>
          )}
        </div>
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1 rounded-md hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
        <motion.div
          className={`h-full ${styles.progress}`}
          initial={{ width: "100%" }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.05, ease: "linear" }}
        />
      </div>
    </motion.div>
  );
}

// Toast Container
function ToastContainer() {
  const context = useContext(ToastContext);
  if (!context) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {context.toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => context.removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Toast Provider
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts((prev) => [...prev, { ...toast, id }].slice(-5)); // Max 5 toasts
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (message: string, description?: string) => {
      addToast({ type: "success", message, description });
    },
    [addToast]
  );

  const error = useCallback(
    (message: string, description?: string) => {
      addToast({ type: "error", message, description, duration: 7000 });
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string, description?: string) => {
      addToast({ type: "warning", message, description });
    },
    [addToast]
  );

  const info = useCallback(
    (message: string, description?: string) => {
      addToast({ type: "info", message, description });
    },
    [addToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, addToast, removeToast, success, error, warning, info }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export default ToastProvider;
