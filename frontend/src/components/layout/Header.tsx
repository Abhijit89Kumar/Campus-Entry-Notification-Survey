"use client";

import { motion } from "framer-motion";
import { RefreshCw, HelpCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useState } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Header({
  title,
  subtitle,
  onRefresh,
  isRefreshing,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between mb-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-white/60">{subtitle}</p>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3"
      >
        {onRefresh && (
          <Button
            variant="glass"
            size="sm"
            icon={RefreshCw}
            onClick={onRefresh}
            loading={isRefreshing}
          >
            Refresh
          </Button>
        )}
        <Button variant="ghost" size="sm">
          <HelpCircle className="w-5 h-5 text-white/60" />
        </Button>
      </motion.div>
    </header>
  );
}
