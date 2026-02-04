"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  MessageSquareText,
  Database,
  Download,
  AlertTriangle,
  BarChart3,
  Clock,
  Menu,
  X,
  FileText,
  ArrowLeftRight,
} from "lucide-react";

const navItems = [
  {
    name: "Overview",
    href: "/",
    icon: LayoutDashboard,
    shortcut: "1",
  },
  {
    name: "Decision Summary",
    href: "/decision-summary",
    icon: FileText,
    shortcut: "2",
    highlight: true,
  },
  {
    name: "Compare Groups",
    href: "/compare",
    icon: ArrowLeftRight,
    shortcut: "3",
  },
  {
    name: "Demographics",
    href: "/demographics",
    icon: Users,
    shortcut: "4",
  },
  {
    name: "Temporal Analysis",
    href: "/temporal",
    icon: Clock,
    shortcut: "5",
  },
  {
    name: "Comment Insights",
    href: "/insights",
    icon: MessageSquareText,
    shortcut: "6",
  },
  {
    name: "Data Quality",
    href: "/quality",
    icon: AlertTriangle,
    shortcut: "7",
  },
  {
    name: "Data Explorer",
    href: "/explorer",
    icon: Database,
    shortcut: "8",
  },
  {
    name: "Export",
    href: "/export",
    icon: Download,
    shortcut: "9",
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      // Number shortcuts for navigation
      const num = parseInt(e.key);
      if (num >= 1 && num <= navItems.length) {
        const item = navItems[num - 1];
        if (item) {
          window.location.href = item.href;
        }
      }

      // Escape to close mobile menu
      if (e.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Check if path is active (handles nested routes)
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const SidebarContent = () => (
    <div className="h-full bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 flex flex-col">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 px-3 py-4 mb-6"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-white">Campus Survey</h1>
          <p className="text-xs text-white/50">Analytics Dashboard</p>
        </div>
      </motion.div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item, index) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl",
                  "font-medium text-sm transition-all duration-200",
                  active
                    ? "bg-white/[0.12] text-white"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white/80"
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-sky-400 rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                
                <Icon className={cn("w-5 h-5", active && "text-sky-400")} />
                <span className="flex-1">{item.name}</span>
                
                {/* Keyboard shortcut hint */}
                <span className="text-xs text-white/30 hidden lg:inline">
                  {item.shortcut}
                </span>
                
                {/* Active dot */}
                {active && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-1.5 h-1.5 rounded-full bg-sky-400"
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Keyboard shortcuts hint */}
      <div className="px-4 py-3 mb-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
        <p className="text-xs text-white/40 text-center">
          Press <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white/60">1-7</kbd> to navigate
        </p>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-white/[0.08]">
        <p className="text-xs text-white/40 text-center">
          IIT Kharagpur • 2026
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl"
        aria-label="Toggle navigation"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Menu className="w-5 h-5 text-white" />
        )}
      </button>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen w-[280px] p-4 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Sidebar */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-[280px] p-4 z-50"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
