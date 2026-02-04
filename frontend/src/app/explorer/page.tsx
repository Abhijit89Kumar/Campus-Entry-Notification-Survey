"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { FilterChip } from "@/components/ui/FilterChip";
import { Modal, ModalBody, ModalFooter } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { getResponses, getMetadata, getSentiment } from "@/lib/api";
import {
  Search,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  X,
} from "lucide-react";

interface ResponseDetail {
  id: number;
  timestamp: string;
  name: string;
  roll_no: string;
  course: string;
  year: string;
  q1_parent_notification: string;
  q2_monitoring: string | null;
  comments: string;
  quality?: {
    score: number;
    flags: string[];
    is_valid: boolean;
  } | null;
  concerns?: {
    primary_concern: string | null;
    secondary_concerns: string[];
  } | null;
}

export default function ExplorerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<ResponseDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pageSize = 20;

  const { data: metadata } = useQuery({
    queryKey: ["metadata"],
    queryFn: getMetadata,
  });

  const { data: responses, isLoading } = useQuery({
    queryKey: ["responses", selectedCourses, selectedYears, searchQuery, page],
    queryFn: () =>
      getResponses({
        courses: selectedCourses.length > 0 ? selectedCourses : undefined,
        years: selectedYears.length > 0 ? selectedYears : undefined,
        search_query: searchQuery || undefined,
        page,
        page_size: pageSize,
        include_flagged: true,
      }),
  });

  const { data: sentimentData } = useQuery({
    queryKey: ["sentiment"],
    queryFn: getSentiment,
  });

  // Create a map of response ID to sentiment
  const sentimentMap = useMemo(() => {
    const map: Record<number, { polarity: number; label: string }> = {};
    // Note: sentiment data from API may not include per-response info
    // This is a fallback - in production, you'd want the API to return this
    return map;
  }, []);

  const toggleCourse = (course: string) => {
    setSelectedCourses((prev) =>
      prev.includes(course)
        ? prev.filter((c) => c !== course)
        : [...prev, course]
    );
    setPage(1);
  };

  const toggleYear = (year: string) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
    setPage(1);
  };

  const openDetailModal = (response: ResponseDetail) => {
    setSelectedResponse(response);
    setIsModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsModalOpen(false);
    setSelectedResponse(null);
  };

  const exportFilteredData = () => {
    if (!responses?.responses) return;
    
    const csvContent = [
      ["ID", "Name", "Roll No", "Course", "Year", "Q1", "Q2", "Quality Score", "Comment"].join(","),
      ...responses.responses.map(r => [
        r.id,
        `"${r.name}"`,
        r.roll_no,
        `"${r.course}"`,
        r.year,
        r.q1_parent_notification,
        r.q2_monitoring || "",
        r.quality?.score || 0,
        `"${(r.comments || "").replace(/"/g, '""')}"`
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey_responses_filtered_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = responses ? Math.ceil(responses.total / pageSize) : 0;

  // Get sentiment indicator component
  const SentimentIndicator = ({ response }: { response: ResponseDetail }) => {
    // Simple heuristic based on vote
    const isPositive = response.q1_parent_notification === "Yes";
    const isNegative = response.q1_parent_notification === "No" && response.comments && response.comments.length > 20;
    
    if (isNegative) {
      return <TrendingDown className="w-4 h-4 text-red-400" />;
    } else if (isPositive) {
      return <TrendingUp className="w-4 h-4 text-emerald-400" />;
    }
    return <Minus className="w-4 h-4 text-white/30" />;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <Header
        title="Data Explorer"
        subtitle="Browse and search individual survey responses"
      />

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            placeholder="Search comments, names, or roll numbers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 bg-white/[0.06] border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-sky-500/50 focus:bg-white/[0.08] transition-colors"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4 mb-6">
        <div>
          <p className="text-sm text-white/50 mb-2">Course Type</p>
          <div className="flex flex-wrap gap-2">
            {metadata?.courses.map((course) => (
              <FilterChip
                key={course}
                label={course}
                active={selectedCourses.includes(course)}
                onClick={() => toggleCourse(course)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-white/50 mb-2">Year of Study</p>
          <div className="flex flex-wrap gap-2">
            {metadata?.years.map((year) => (
              <FilterChip
                key={year}
                label={year}
                active={selectedYears.includes(year)}
                onClick={() => toggleYear(year)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-white/60">
          {responses?.total || 0} responses found
        </p>
        <div className="flex gap-2">
          {responses && responses.responses.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={exportFilteredData}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
          )}
          {(selectedCourses.length > 0 || selectedYears.length > 0 || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCourses([]);
                setSelectedYears([]);
                setSearchQuery("");
                setPage(1);
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <GlassCard className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-white/50">Loading...</div>
        ) : responses?.responses.length === 0 ? (
          <EmptyState
            variant="no-results"
            title="No responses found"
            description="Try adjusting your search or filters"
            action={{
              label: "Clear Filters",
              onClick: () => {
                setSelectedCourses([]);
                setSelectedYears([]);
                setSearchQuery("");
              }
            }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  <th>Name</th>
                  <th>Roll No</th>
                  <th>Course</th>
                  <th>Year</th>
                  <th>Q1</th>
                  <th>Q2</th>
                  <th className="text-center">Sentiment</th>
                  <th>Quality</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {responses?.responses.map((response, index) => (
                  <motion.tr
                    key={response.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="group"
                  >
                    <td className="text-white/40">{response.id}</td>
                    <td className="font-medium text-white">{response.name}</td>
                    <td>{response.roll_no}</td>
                    <td className="max-w-[120px] truncate" title={response.course}>{response.course}</td>
                    <td>{response.year}</td>
                    <td>
                      <span
                        className={
                          response.q1_parent_notification === "Yes"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {response.q1_parent_notification}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          response.q2_monitoring === "Yes"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }
                      >
                        {response.q2_monitoring || "-"}
                      </span>
                    </td>
                    <td className="text-center">
                      <SentimentIndicator response={response as ResponseDetail} />
                    </td>
                    <td>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          (response.quality?.score || 0) >= 70
                            ? "bg-emerald-500/20 text-emerald-400"
                            : (response.quality?.score || 0) >= 40
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {response.quality?.score || 0}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDetailModal(response as ResponseDetail);
                          }}
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                          title="View details"
                        >
                          <Eye className="w-4 h-4 text-white/60" />
                        </button>
                        <button
                          onClick={() =>
                            setExpandedRow(
                              expandedRow === response.id ? null : response.id
                            )
                          }
                          className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          {expandedRow === response.id ? (
                            <ChevronUp className="w-4 h-4 text-white/40" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-white/40" />
                          )}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {/* Expanded Row Details */}
            <AnimatePresence>
              {expandedRow && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-white/10 bg-white/[0.02]"
                >
                  {responses?.responses
                    .filter((r) => r.id === expandedRow)
                    .map((response) => (
                      <div key={response.id} className="p-6">
                        <h4 className="text-sm font-medium text-white/60 mb-2">
                          Comment
                        </h4>
                        <p className="text-white/80 mb-4 whitespace-pre-wrap">
                          {response.comments || "(No comment)"}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {response.concerns?.primary_concern && (
                            <div>
                              <h4 className="text-sm font-medium text-white/60 mb-2">
                                Detected Concerns
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                                  {response.concerns.primary_concern}
                                </span>
                                {response.concerns.secondary_concerns?.map((c) => (
                                  <span
                                    key={c}
                                    className="px-3 py-1 bg-white/10 text-white/60 rounded-full text-sm"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {response.quality?.flags &&
                            response.quality.flags.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-white/60 mb-2">
                                  Quality Flags
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {response.quality.flags.map((flag) => (
                                    <span
                                      key={flag}
                                      className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm"
                                    >
                                      {flag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-white/10">
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronLeft}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-white/60">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              icon={ChevronRight}
              iconPosition="right"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </GlassCard>

      {/* Detail Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeDetailModal}
        title="Response Details"
        size="lg"
      >
        {selectedResponse && (
          <ModalBody>
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-xs text-white/40 mb-1">Name</p>
                <p className="text-white font-medium">{selectedResponse.name}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Roll Number</p>
                <p className="text-white">{selectedResponse.roll_no}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Course</p>
                <p className="text-white">{selectedResponse.course}</p>
              </div>
              <div>
                <p className="text-xs text-white/40 mb-1">Year</p>
                <p className="text-white">{selectedResponse.year}</p>
              </div>
            </div>

            {/* Votes */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${selectedResponse.q1_parent_notification === "Yes" ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                <p className="text-xs text-white/40 mb-1">Q1: Parent Notification</p>
                <p className={`text-lg font-semibold ${selectedResponse.q1_parent_notification === "Yes" ? "text-emerald-400" : "text-red-400"}`}>
                  {selectedResponse.q1_parent_notification}
                </p>
              </div>
              <div className={`p-4 rounded-lg ${selectedResponse.q2_monitoring === "Yes" ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                <p className="text-xs text-white/40 mb-1">Q2: 24/7 Monitoring</p>
                <p className={`text-lg font-semibold ${selectedResponse.q2_monitoring === "Yes" ? "text-emerald-400" : "text-red-400"}`}>
                  {selectedResponse.q2_monitoring || "-"}
                </p>
              </div>
            </div>

            {/* Comment */}
            <div className="mb-6">
              <p className="text-xs text-white/40 mb-2">Comment</p>
              <div className="p-4 rounded-lg bg-white/[0.04] border border-white/10">
                <p className="text-white/80 whitespace-pre-wrap">
                  {selectedResponse.comments || "(No comment provided)"}
                </p>
              </div>
            </div>

            {/* Quality & Concerns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/40 mb-2">Quality Score</p>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                      (selectedResponse.quality?.score || 0) >= 70
                        ? "bg-emerald-500/20 text-emerald-400"
                        : (selectedResponse.quality?.score || 0) >= 40
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {selectedResponse.quality?.score || 0}/100
                  </span>
                  {selectedResponse.quality?.flags && selectedResponse.quality.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedResponse.quality.flags.map((flag) => (
                        <span
                          key={flag}
                          className="px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded text-xs"
                        >
                          {flag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {selectedResponse.concerns?.primary_concern && (
                <div>
                  <p className="text-xs text-white/40 mb-2">Detected Concerns</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm">
                      {selectedResponse.concerns.primary_concern}
                    </span>
                    {selectedResponse.concerns.secondary_concerns?.map((c) => (
                      <span
                        key={c}
                        className="px-2 py-1 bg-white/10 text-white/60 rounded-full text-xs"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
        )}
        <ModalFooter>
          <Button variant="ghost" onClick={closeDetailModal}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
