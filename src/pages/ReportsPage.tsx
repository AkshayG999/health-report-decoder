import { motion } from "motion/react";
import { AlertCircle, ArrowLeft, ChevronRight, FileText, Loader2 } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { SavedReport } from "@/src/lib/api";

interface ReportsPageProps {
  reports: SavedReport[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onOpenReport: (reportId: string) => void;
}

export function ReportsPage({ reports, loading, error, onBack, onOpenReport }: ReportsPageProps) {
  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="max-w-4xl mx-auto"
    >
      <div className="mb-8 space-y-4">
        <button
          type="button"
          onClick={onBack}
          className="h-9 px-2 -ml-2 rounded-md text-sm font-bold text-cocoa hover:text-primary-400 hover:bg-primary-50 transition-colors flex items-center gap-1.5 w-fit"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div>
          <h2 className="text-3xl font-extrabold text-ink mb-3 tracking-tight">Saved Reports</h2>
          <p className="text-clay font-medium">
            Open a completed report to view the saved summary, recommendations, and resources.
          </p>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4 text-rose-700 shadow-sm"
        >
          <AlertCircle className="shrink-0 mt-0.5" size={20} />
          <p className="text-sm font-medium leading-relaxed">{error}</p>
        </motion.div>
      )}

      {loading ? (
        <div className="bg-white border border-primary-100 rounded-[2rem] p-10 flex items-center justify-center gap-3 text-clay font-bold">
          <Loader2 className="animate-spin text-primary-400" />
          Loading saved reports...
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <button
              key={report.id}
              onClick={() => onOpenReport(report.id)}
              className="w-full text-left bg-white border border-primary-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-400 flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-ink truncate">{report.fileName}</h3>
                      <p className="text-xs font-bold uppercase tracking-widest text-clay/60">
                        {report.language} - {(report.fileSize / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {report.errorMessage && <p className="text-sm text-rose-600 font-medium">{report.errorMessage}</p>}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold border capitalize",
                    report.status === "completed" && "bg-emerald-50 text-emerald-600 border-emerald-100",
                    report.status === "failed" && "bg-rose-50 text-rose-600 border-rose-100",
                    report.status === "processing" && "bg-accent-50 text-accent-600 border-accent-100",
                    report.status === "pending" && "bg-primary-50 text-clay border-primary-100"
                  )}>
                    {report.status}
                  </span>
                  <ChevronRight size={18} className="text-clay/60" />
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-primary-100 rounded-[2rem] p-10 text-center">
          <FileText size={36} className="mx-auto text-primary-100 mb-4" />
          <h3 className="font-bold text-ink mb-2">No saved reports yet</h3>
          <p className="text-sm text-clay font-medium">Run an analysis first, then it will appear here.</p>
        </div>
      )}
    </motion.div>
  );
}
