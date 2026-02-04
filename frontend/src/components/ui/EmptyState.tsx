"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FileQuestion,
  Database,
  Search,
  AlertCircle,
  RefreshCw,
  Plus,
  Filter,
} from "lucide-react";
import { Button } from "./Button";

type EmptyStateVariant =
  | "no-data"
  | "no-results"
  | "error"
  | "empty-filter"
  | "loading-error"
  | "custom";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const defaultContent: Record<
  EmptyStateVariant,
  { title: string; description: string; icon: React.ReactNode }
> = {
  "no-data": {
    title: "No Data Available",
    description: "There's no data to display yet. Try refreshing or check back later.",
    icon: <Database className="w-12 h-12" />,
  },
  "no-results": {
    title: "No Results Found",
    description: "Your search didn't match any records. Try adjusting your filters.",
    icon: <Search className="w-12 h-12" />,
  },
  "error": {
    title: "Something Went Wrong",
    description: "We couldn't load this data. Please try again.",
    icon: <AlertCircle className="w-12 h-12" />,
  },
  "empty-filter": {
    title: "No Matching Results",
    description: "No items match your current filters. Try removing some filters.",
    icon: <Filter className="w-12 h-12" />,
  },
  "loading-error": {
    title: "Failed to Load",
    description: "There was a problem loading this content. Please refresh the page.",
    icon: <AlertCircle className="w-12 h-12" />,
  },
  "custom": {
    title: "No Content",
    description: "Nothing to show here.",
    icon: <FileQuestion className="w-12 h-12" />,
  },
};

export function EmptyState({
  variant = "no-data",
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = "",
}: EmptyStateProps) {
  const defaults = defaultContent[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        flex flex-col items-center justify-center
        py-12 px-6 text-center
        ${className}
      `}
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="mb-6 text-white/20"
      >
        {icon || defaults.icon}
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-lg font-semibold text-white/80 mb-2"
      >
        {title || defaults.title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-sm text-white/50 max-w-sm mb-6"
      >
        {description || defaults.description}
      </motion.p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3"
        >
          {action && (
            <Button onClick={action.onClick} className="gap-2">
              {action.icon || <RefreshCw className="w-4 h-4" />}
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="ghost"
              className="text-white/60"
            >
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Compact version for inline use
export function EmptyStateInline({
  message = "No data",
  className = "",
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-center py-8 text-white/40 text-sm ${className}`}>
      <FileQuestion className="w-4 h-4 mr-2" />
      {message}
    </div>
  );
}

export default EmptyState;
