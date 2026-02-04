"use client";

import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";

interface WordCloudWord {
  word: string;
  count: number;
  size?: number;
}

interface WordCloudProps {
  words: WordCloudWord[];
  maxWords?: number;
  minFontSize?: number;
  maxFontSize?: number;
  colors?: string[];
  onWordClick?: (word: string) => void;
  className?: string;
}

export function WordCloud({
  words,
  maxWords = 50,
  minFontSize = 12,
  maxFontSize = 36,
  colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#ec4899"],
  onWordClick,
  className = "",
}: WordCloudProps) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);

  const processedWords = useMemo(() => {
    if (!words || words.length === 0) return [];

    // Sort by count and take top N
    const sorted = [...words].sort((a, b) => b.count - a.count).slice(0, maxWords);
    
    if (sorted.length === 0) return [];

    const maxCount = sorted[0].count;
    const minCount = sorted[sorted.length - 1].count;
    const range = maxCount - minCount || 1;

    return sorted.map((word, index) => {
      // Calculate font size based on count
      const normalized = (word.count - minCount) / range;
      const fontSize = minFontSize + normalized * (maxFontSize - minFontSize);
      
      // Assign color based on index
      const color = colors[index % colors.length];
      
      return {
        ...word,
        fontSize: Math.round(fontSize),
        color,
        opacity: 0.6 + normalized * 0.4,
      };
    });
  }, [words, maxWords, minFontSize, maxFontSize, colors]);

  // Shuffle words for better visual distribution
  const shuffledWords = useMemo(() => {
    const shuffled = [...processedWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [processedWords]);

  if (!words || words.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-white/40 py-12 ${className}`}
      >
        <p className="text-sm">No word data available</p>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-2 py-4 ${className}`}
    >
      {shuffledWords.map((word, index) => (
        <motion.button
          key={word.word}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: word.opacity, scale: 1 }}
          transition={{
            delay: index * 0.02,
            duration: 0.3,
            type: "spring",
            stiffness: 300,
          }}
          onClick={() => onWordClick?.(word.word)}
          onMouseEnter={() => setHoveredWord(word.word)}
          onMouseLeave={() => setHoveredWord(null)}
          className={`
            relative px-2 py-0.5 rounded-md
            transition-all duration-200
            ${onWordClick ? "cursor-pointer hover:scale-110" : "cursor-default"}
            ${hoveredWord === word.word ? "bg-white/10" : ""}
          `}
          style={{
            fontSize: `${word.fontSize}px`,
            color: word.color,
          }}
          title={`${word.word}: ${word.count} occurrences`}
        >
          {word.word}
          
          {/* Tooltip on hover */}
          {hoveredWord === word.word && (
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-black/80 text-white rounded whitespace-nowrap z-10"
            >
              {word.count} mentions
            </motion.span>
          )}
        </motion.button>
      ))}
    </div>
  );
}

// Compact version for smaller spaces
export function WordCloudCompact({
  words,
  maxWords = 15,
  className = "",
}: {
  words: WordCloudWord[];
  maxWords?: number;
  className?: string;
}) {
  const topWords = useMemo(() => {
    return [...words]
      .sort((a, b) => b.count - a.count)
      .slice(0, maxWords);
  }, [words, maxWords]);

  if (!words || words.length === 0) {
    return <span className="text-white/40 text-sm">No data</span>;
  }

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {topWords.map((word, index) => (
        <span
          key={word.word}
          className="px-2 py-0.5 text-xs rounded-full bg-white/5 text-white/70 border border-white/10"
          style={{
            opacity: 0.5 + (topWords.length - index) / topWords.length * 0.5,
          }}
        >
          {word.word}
          <span className="ml-1 text-white/40">{word.count}</span>
        </span>
      ))}
    </div>
  );
}

export default WordCloud;
